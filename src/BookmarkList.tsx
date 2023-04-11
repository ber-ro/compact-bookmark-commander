import React, { RefObject } from 'react';
import { BookmarkItem } from './BookmarkItem';
import { CreateFolder } from './CreateFolder'
import { Edit } from './Edit';
import { ToastRef } from './Toasts';
import { config } from './Options'

type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface BookmarkListState {
  nodes: BookmarkTreeNode[]
  , breadcrumbs: string
  , index: number
  , showCreateFolder: boolean
  , showEdit: boolean
}

interface BookmarkListProps {
  side: string
  , other: RefObject<BookmarkList>
  , toasts: RefObject<ToastRef>
  , showUrls: boolean
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
  ref: React.RefObject<HTMLDivElement> = React.createRef();
  scrollRef: React.RefObject<HTMLDivElement> = React.createRef();
  operationIsPending = false
  ancestors: Array<BookmarkTreeNode> = []
  constructor(props: BookmarkListProps) {
    super(props)
    this.state = {
      nodes: []
      , breadcrumbs: ""
      , index: 0
      , showCreateFolder: false
      , showEdit: false
    }
  }

  componentDidMount() {
    chrome.bookmarks.onChanged.addListener(this.onChanged)
    chrome.bookmarks.onCreated.addListener(this.onCreated)
    chrome.bookmarks.onMoved.addListener(this.onMoved)
    chrome.bookmarks.onRemoved.addListener(this.onRemoved)
    this.getAncestors()
  }

  componentWillUnmount() {
    chrome.bookmarks.onChanged.removeListener(this.onChanged)
    chrome.bookmarks.onCreated.removeListener(this.onCreated)
    chrome.bookmarks.onMoved.removeListener(this.onMoved)
    chrome.bookmarks.onRemoved.removeListener(this.onRemoved)
  }

  onChanged = (id: string) => {
    for (const i of this.state.nodes) {
      if (i.id === id) {
        this.getChildren()
        return
      }
    }
  }

  onCreated = (id: string, bookmark: BookmarkTreeNode) => {
    if (bookmark.parentId === this.parentId())
      this.getChildren()
  }

  onMoved = (id: string, moveInfo: chrome.bookmarks.BookmarkMoveInfo) => {
    for (const a of this.ancestors)
      if (a.id === id) {
        this.getAncestors()
        return
      }

    if (
      this.parentId() === moveInfo.parentId ||
      this.parentId() === moveInfo.oldParentId
    )
      this.getChildren()
  }

  onRemoved = (id: string, removeInfo: chrome.bookmarks.BookmarkRemoveInfo) => {
    for (const a of this.ancestors)
      if (a.id === id) {
        this.getAncestors()
        return
      }

    if (this.parentId() === removeInfo.parentId)
      this.getChildren()
  }

  getAncestors = async () => {
    let ancestors = []
    try {
      const key = this.props.side;
      let id = (await chrome.storage.local.get(key))[key] ?? "0"
      for (; ;) {
        const node = (await chrome.bookmarks.get(id))[0]
        ancestors.unshift(node)
        if (node.id === "0")
          break
        id = node.parentId
      }
    } catch (e) {
      ancestors = [{ id: "0", title: "" }]
    }
    this.ancestors = ancestors
    return this.getChildren()
  }

  parentId = (ancestors = this.ancestors) => {
    return ancestors.length
      ? ancestors[ancestors.length - 1].id
      : "0";
  }

  hideCreateFolder = () => {
    this.getChildren({ showCreateFolder: false })
  }

  hideEdit = () => {
    this.getChildren({ showEdit: false })
  }

  getChildren = async (
    state: Partial<BookmarkListState> = {}
    , setState = true
  ): Promise<Partial<BookmarkListState>> => {
    const node = this.state.nodes[this.state.index]
    while (!state.nodes)
      try {
        state.nodes = await chrome.bookmarks.getChildren(
          this.parentId(this.ancestors)
        )
      } catch (e) {
        this.ancestors.pop()
      }
    state.breadcrumbs = this.ancestors.map((node) => node.title + " /").join(" ");
    chrome.storage.local.set({
      [this.props.side]: this.parentId(this.ancestors)
    })
    if (state.index === undefined) {
      const index =
        node ? state.nodes.findIndex((node2) => node2.id === node.id) : -1
      state.index = index === -1 ? this.state.index : index
    }
    if (state.index >= state.nodes.length)
      state.index = state.nodes.length - 1
    if (setState)
      return new Promise((resolve) => {
        this.setState(state as BookmarkListState, () => resolve(state))
      })
    return state
  }

  onClick = (index: number): (() => void) => {
    return () => { this.setState({ index: index }); }
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (this.state.showCreateFolder || this.state.showEdit)
      return;

    // console.log(e.key);
    if (e.key === "ArrowDown") {
      this.setState({
        index: this.state.index === this.state.nodes.length - 1
          ? -1 : this.state.index + 1
      })
    } else if (e.key === "ArrowUp") {
      this.setState({
        index: this.state.index === - 1
          ? this.state.nodes.length - 1 : this.state.index - 1
      })
    } else if (e.key === "Home") {
      this.setState({ index: 0 })
    } else if (e.key === "End") {
      this.setState({ index: this.state.nodes.length - 1 })
    } else if (e.key === "Enter" || e.key == "ArrowRight") {
      this.open(this.state.nodes[this.state.index])
    } else if (e.key === "Backspace" || e.key == "ArrowLeft") {
      this.gotoParent()
    } else if (e.key === "Delete") {
      this.delete(e.shiftKey)
    } else if (e.key === "F2") {
      if (this.state.index >= 0)
        this.setState({ showEdit: true })
    } else if (e.key === "F5") {
      this.sort()
    } else if (e.key === "F6") {
      const node = this.state.nodes[this.state.index]
      if (node && !this.operationIsPending) {
        this.operationIsPending = true
        chrome.bookmarks.onMoved.removeListener(this.onMoved)
        this.props.other.current?.move(node)
          .finally(() => this.getChildren())
          .finally(() => {
            chrome.bookmarks.onMoved.addListener(this.onMoved)
            this.operationIsPending = false
          })
      }
    } else if (e.key === "F7") {
      this.setState({ showCreateFolder: true })
    } else if (e.key === "F9") {
      this.props.other.current?.goto(this.ancestors)
    } else if (e.key === "PageDown") {
      this.scrollRef.current?.scrollBy(0, this.scrollRef.current.clientHeight)
    } else if (e.key === "PageUp") {
      this.scrollRef.current?.scrollBy(0, -this.scrollRef.current.clientHeight)
    } else {
      return
    }

    e.preventDefault()
  }

  goto(ancestors: BookmarkTreeNode[]) {
    this.ancestors = ancestors
    this.getChildren({ index: 0 })
  }

  open(node: BookmarkTreeNode) {
    if (!node)
      return

    if (node.url) {
      if (node.url.startsWith("http"))
        window.open(node.url)
    } else {
      this.ancestors = [...this.ancestors, node]
      this.getChildren({ index: 0 })
    }
  }

  gotoParent() {
    if (this.ancestors.length <= 1)
      return

    const id = this.parentId()
    this.ancestors = this.ancestors.slice(0, -1)
    this.getChildren({}, false)
      .then((state) => {
        const index = state.nodes?.findIndex((node) => node.id === id)
        if (index !== -1 && index !== this.state.index)
          state.index = index
        this.setState(state as BookmarkListState)
      })
  }

  async delete(recurse: boolean) {
    if (this.state.index < 0 || this.operationIsPending)
      return

    this.operationIsPending = true
    chrome.bookmarks.onRemoved.removeListener(this.onRemoved)
    const remove = recurse ? chrome.bookmarks.removeTree : chrome.bookmarks.remove
    const id = this.state.nodes[this.state.index].id
    try {
      const undoInfo = await chrome.bookmarks.getSubTree(id)
      await remove(id)
      const msg = "Deleted " + this.state.nodes[this.state.index].title
      this.props.toasts.current?.addToast({ msg, type: "success", undoInfo })
    } catch (p: any) {
      const msg = this.state.nodes[this.state.index]?.title + " - " + p.message
      this.props.toasts.current?.addToast({ msg, type: "warning" })
    } finally {
      try {
        await this.getChildren()
      } finally {
        chrome.bookmarks.onRemoved.addListener(this.onRemoved)
        this.operationIsPending = false
      }
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
    this.ref.current?.focus();
  }

  move = async (node: BookmarkTreeNode): Promise<void> => {
    for (const a of this.ancestors)
      if (a.id === node.id) {
        this.props.toasts.current?.addToast({
          msg: "Cannot move folder under itself!", type: "warning"
        })
        return Promise.resolve()
      }

    return chrome.bookmarks.move(node.id, { parentId: this.parentId(), index: this.index(node) })
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
      : this.state.index === -1
        ? undefined
        : this.state.index
  }

  render() {
    const listItems = this.state.nodes.map((node, index) => {
      return <BookmarkItem node={node}
        isCurrent={index === this.state.index}
        key={node.id}
        containerRef={this.ref}
        showUrls={this.props.showUrls}
        onClick={this.onClick(index)}
      />
    });
    const node = this.state.nodes[this.state.index]

    return (
      <div className="vstack h-100 p-0 outline bookmarks" ref={this.ref}
        tabIndex={0} onKeyDown={this.onKeyDown}>
        <div className='p-1 bg-secondary text-light bookmark-breadcrumbs'>
          {this.state.breadcrumbs}
        </div>
        <div className="p-0 overflow-auto" ref={this.scrollRef}>
          <div className="mb-0 p-0 pane"> {listItems} </div>
        </div>
        {this.state.showCreateFolder && (
          <CreateFolder
            index={this.index}
            parentId={this.parentId}
            breadcrumbs={this.state.breadcrumbs}
            hide={this.hideCreateFolder} />
        )}
        {this.state.showEdit && node && (
          <Edit
            id={node.id}
            title={node.title}
            url={node.url}
            breadcrumbs={this.state.breadcrumbs}
            hide={this.hideEdit} />
        )}
      </div>
    );
  }
}

export default BookmarkList;
