import React, { RefObject } from 'react';
import { BookmarkItem } from './BookmarkItem';
import { Ancestors, Breadcrumbs } from './Breadcrumbs';
import { CreateFolder } from './CreateFolder';
import { Edit } from './Edit';
import { config } from './Options';
import { ToastRef } from './Toasts';
import * as Util from './Util';

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface BookmarkListState {
  nodes: BookmarkTreeNode[]
  , ancestors: Ancestors
  , index: number | undefined
  , showCreateFolder: boolean
  , showEdit: boolean
}

interface BookmarkListProps {
  other: RefObject<BookmarkList>
  showUrls: boolean
  side: string
  toasts: RefObject<ToastRef>
}

function normalizeUrl(url: string) {
  return url?.replace(/(http|ftp)s?:\/*(www\.)?/i, "$1://")
}

const compareFunc = () =>
  config["Sort By Title"].val ? compareTitle : compareUrl

const compareUrl = (a: BookmarkTreeNode, b: BookmarkTreeNode) => {
  const u1 = normalizeUrl(a.url || "")
  const u2 = normalizeUrl(b.url || "")
  return u1.localeCompare(u2) || a.title.localeCompare(b.title)
}

const compareTitle = (a: BookmarkTreeNode, b: BookmarkTreeNode) => {
  // node is a folder if url is missing
  return (
    !a.url && !b.url
      ? a.title.localeCompare(b.title)
      : !a.url
        ? -1
        : !b.url
          ? 1
          : a.title.localeCompare(b.title)
  )
}

export class BookmarkList extends React.Component<BookmarkListProps, BookmarkListState>
{
  ref = React.createRef<HTMLDivElement>()
  refCreateFolder = React.createRef<HTMLInputElement>()
  refEdit = React.createRef<HTMLInputElement>()
  scrollRef = React.createRef<HTMLDivElement>()
  operationIsPending = false
  id = "0"
  dirty: boolean | undefined;

  constructor(props: BookmarkListProps) {
    super(props)
    this.state = {
      nodes: []
      , ancestors: new Ancestors()
      , index: 0
      , showCreateFolder: false
      , showEdit: false
    }
  }

  async componentDidMount() {
    chrome.bookmarks.onChanged.addListener(this.onChanged)
    chrome.bookmarks.onCreated.addListener(this.onCreated)
    chrome.bookmarks.onMoved.addListener(this.onMoved)
    chrome.bookmarks.onRemoved.addListener(this.onRemoved)
    const key = this.props.side;
    this.goto((await chrome.storage.local.get(key))[key] ?? "0")
    window.addEventListener("pagehide", this.save)
  }

  componentWillUnmount() {
    chrome.bookmarks.onChanged.removeListener(this.onChanged)
    chrome.bookmarks.onCreated.removeListener(this.onCreated)
    chrome.bookmarks.onMoved.removeListener(this.onMoved)
    chrome.bookmarks.onRemoved.removeListener(this.onRemoved)
    window.removeEventListener("pagehide", this.save)
  }

  save = () => {
    if (this.dirty)
      chrome.storage.local.set({ [this.props.side]: this.id })
        .then(() => { this.dirty = false })
  }

  onChanged = (id: string, ci: chrome.bookmarks.BookmarkChangeInfo) => {
    const nodes = Util.mutateChangedNodes(id, ci, this.state.nodes)
    if (nodes)
      this.setState({ nodes })
    const ancestors = Util.mutateChangedNodes(id, ci, this.state.ancestors.ancestors)
    if (ancestors)
      this.setState({ ancestors: new Ancestors(ancestors) })
  }

  onCreated = (id: string, bookmark: BookmarkTreeNode) => {
    if (bookmark.parentId === this.id)
      this.getChildren()
  }

  onMoved = (id: string, mi: chrome.bookmarks.BookmarkMoveInfo) => {
    if (this.id === mi.parentId)
      this.getChildren().then(() => {
        if (mi.index === this.state.index && !config["Keep Sorted"].val)
          this.prevNextItem(+1)
      })
    else if (this.id === mi.oldParentId)
      this.getChildren()
    else
      this.state.ancestors.refresh(id)
  }

  onRemoved = (id: string, removeInfo: chrome.bookmarks.BookmarkRemoveInfo) => {
    if (this.id === removeInfo.parentId)
      this.getChildren()
    else
      this.state.ancestors.refresh(id)
  }

  getChildren = async (
    state: Partial<BookmarkListState & { id: string }> = {},
    id?: string
  ): Promise<Partial<BookmarkListState>> => {
    if (id) {
      this.id = id
      this.dirty = this.dirty !== undefined // do not set dirty in initialization
    }
    state.nodes = await chrome.bookmarks.getChildren(this.id)
    if (state.id) {
      const index = state.nodes?.findIndex((n) => n.id === state.id)
      if (index !== -1)
        state.index = index
    }
    return new Promise((resolve) => {
      this.setState(state as BookmarkListState, () => resolve(state))
    })
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (this.state.showCreateFolder || this.state.showEdit)
      return;

    // console.log(e.key);
    if (e.key === "ArrowDown") {
      this.prevNextItem(+1)
    } else if (e.key === "ArrowUp") {
      this.prevNextItem(-1)
    } else if (e.key === "Home") {
      this.setState({ index: 0 })
    } else if (e.key === "End") {
      this.setState({ index: this.state.nodes.length - 1 })
    } else if (e.key === "Enter" || e.key === "ArrowRight") {
      this.open(this.current())
    } else if (e.key === "Backspace" || e.key === "ArrowLeft") {
      this.gotoParent()
    } else if (e.key === "Delete") {
      this.delete(e.shiftKey)
    } else if (e.key === "F2") {
      if (this.current())
        this.setState({ showEdit: true })
    } else if (e.key === "F5") {
      this.sort()
    } else if (e.key === "F6") {
      this.move()
    } else if (e.key === "F7") {
      this.setState({ showCreateFolder: true })
    } else if (e.key === "F9") {
      this.props.other.current?.goto(this.id)
    } else if (e.key === "PageDown") {
      this.scrollRef.current?.scrollBy(0, this.scrollRef.current.clientHeight)
    } else if (e.key === "PageUp") {
      this.scrollRef.current?.scrollBy(0, -this.scrollRef.current.clientHeight)
    } else {
      return
    }

    e.preventDefault()
  }

  prevNextItem = (dir: number) => {
    let idx = this.state.index
    const len = this.state.nodes.length
    if (idx === undefined)
      idx = len
    idx = idx + dir
    if (idx === -1 || idx === len)
      idx = undefined
    else if (idx > len)
      idx = 0
    this.setState({ index: idx })
  }

  goto(node: BookmarkTreeNode | string) {
    if (typeof node === "string")
      this.state.ancestors.refresh(undefined, node).then((id) => {
        this.getChildren({ index: 0 }, id)
      })
    else {
      const ancestors = new Ancestors([...this.state.ancestors.ancestors, node])
      this.setState({ ancestors })
      this.getChildren({ index: 0 }, node.id)
    }
  }

  open(node: BookmarkTreeNode | undefined) {
    if (!node)
      return

    if (node.url) {
      if (node.url.startsWith("http"))
        window.open(node.url)
    } else {
      this.goto(node)
    }
  }

  gotoParent() {
    const ancestors = this.state.ancestors.gotoParent()
    if (ancestors) {
      this.setState({ ancestors: new Ancestors(ancestors) })
      this.getChildren({ id: this.id }, ancestors.at(-1)?.id)
    }
  }

  async delete(recurse: boolean) {
    const current = this.current()
    if (!current || this.operationIsPending)
      return

    this.operationIsPending = true
    const remove = recurse ? chrome.bookmarks.removeTree : chrome.bookmarks.remove
    const id = current.id
    try {
      const undoInfo = await chrome.bookmarks.getSubTree(id)
      await remove(id)
      const msg = "Deleted " + current.title
      this.props.toasts.current?.addToast({ msg, type: "success", undoInfo })
    } catch (p: any) {
      const msg = current.title + " - " + p.message
      this.props.toasts.current?.addToast({ msg, type: "warning" })
    } finally {
      this.operationIsPending = false
    }
  }

  async sort() {
    const nodes = [...this.state.nodes]
    nodes.sort(compareFunc())

    chrome.bookmarks.onMoved.removeListener(this.onMoved)
    for (let i = 0; i < nodes.length; i++)
      await chrome.bookmarks.move(nodes[i].id, { index: i })
    chrome.bookmarks.onMoved.addListener(this.onMoved)
    this.getChildren()
  }

  focus(): void {
    if (this.state.showCreateFolder)
      this.refCreateFolder.current?.focus()
    else if (this.state.showEdit)
      this.refEdit.current?.focus()
    else
      this.ref.current?.focus();
  }

  onBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    if (!e.relatedTarget?.classList.contains("bookmarks"))
      setTimeout(() => { this.focus() })
  }

  move = () => {
    const node = this.current()
    if (node && !this.operationIsPending) {
      this.operationIsPending = true
      this.props.other.current?.moveHere(node)
        .finally(() => {
          this.operationIsPending = false
        })
    }
  }

  moveHere = async (node: BookmarkTreeNode): Promise<void> => {
    for (const a of this.state.ancestors.ancestors)
      if (a.id === node.id) {
        this.props.toasts.current?.addToast({
          msg: "Cannot move folder under itself!", type: "warning"
        })
        return Promise.resolve()
      }

    return chrome.bookmarks.move(node.id, {
      parentId: this.id, index: this.index(node)
    })
      .then(() => {
        const msg = "Moved " + node.title
        this.props.toasts.current?.addToast({ msg, type: "success" })
      })
      .catch((p) => {
        this.props.toasts.current?.addToast({ msg: p.message, type: "warning" })
      })
  }

  getIndexSorted = (node: BookmarkTreeNode) => {
    const nodes = this.state.nodes
    const compare = compareFunc()
    for (let i = 0; i < nodes.length; i++) {
      if (compare(nodes[i], node) > 0)
        return i
    }
    return nodes.length
  }

  index = (node: BookmarkTreeNode): number | undefined => {
    return config["Keep Sorted"].val
      ? this.getIndexSorted(node)
      : this.state.index
  }

  current = () => {
    const state = this.state
    return state.index === undefined || state.index >= state.nodes.length
      ? undefined
      : state.nodes[state.index]
  }

  render() {
    const listItems = this.state.nodes.map((node, index) => {
      return <BookmarkItem node={node}
        isCurrent={index === this.state.index}
        key={node.id}
        containerRef={this.ref}
        showUrls={this.props.showUrls}
        setItem={() => { this.setState({ index }) }}
      />
    });
    const node = this.current()

    return (
      <div className="vstack h-100 p-0 outline bookmarks" ref={this.ref}
        tabIndex={0} onKeyDown={this.onKeyDown} onBlur={this.onBlur}>
        <Breadcrumbs ancestors={this.state.ancestors} />
        <div className="p-0 overflow-auto" ref={this.scrollRef}>
          <div className="mb-0 p-0 pane"> {listItems} </div>
        </div>
        {this.state.showCreateFolder && (
          <CreateFolder
            index={this.index}
            parentId={this.id}
            ancestors={this.state.ancestors}
            ref={this.refCreateFolder}
            hide={() => { this.setState({ showCreateFolder: false }) }} />
        )}
        {this.state.showEdit && node && (
          <Edit
            id={node.id}
            title={node.title}
            url={node.url}
            ancestors={this.state.ancestors}
            ref={this.refEdit}
            hide={() => { this.setState({ showEdit: false }) }} />
        )}
      </div>
    );
  }
}

export default BookmarkList;
