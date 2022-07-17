import React, { RefObject } from 'react';
import { BookmarkItem } from './BookmarkItem';
import { CreateFolder } from './CreateFolder'
import { Toast as Toast } from './Toasts';
type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode;

interface BookmarkListState {
  nodes: BookmarkTreeNode[]
  , ancestors: BookmarkTreeNode[]
  , selected: Set<number>
  , index: number
  , showCreateFolder: boolean
}

interface BookmarkListProps {
  side: string
  , other: RefObject<BookmarkList>
  , toasts: RefObject<Toast>
  , showUrls: boolean
}

function removeProtocol(url: string) {
  return url?.replace(/[^:]*:\/*(www\.)?/i, "")
}

export class BookmarkList extends React.Component<BookmarkListProps, BookmarkListState>
{
  ref: React.RefObject<HTMLDivElement> = React.createRef();
  scrollRef: React.RefObject<HTMLDivElement> = React.createRef();
  operationIsPending = false
  constructor(props: BookmarkListProps) {
    super(props)
    this.state = {
      nodes: []
      , ancestors: []
      , selected: new Set()
      , index: 0
      , showCreateFolder: false
    }
  }

  componentDidMount() {
    chrome.bookmarks.onChanged.addListener(this.getAncestors)
    chrome.bookmarks.onChildrenReordered.addListener(this.getAncestors)
    chrome.bookmarks.onCreated.addListener(this.getAncestors)
    chrome.bookmarks.onMoved.addListener(this.getAncestors)
    chrome.bookmarks.onRemoved.addListener(this.getAncestors)
    this.getAncestors()
  }

  componentWillUnmount() {
    chrome.bookmarks.onChanged.removeListener(this.getAncestors)
    chrome.bookmarks.onChildrenReordered.removeListener(this.getAncestors)
    chrome.bookmarks.onCreated.removeListener(this.getAncestors)
    chrome.bookmarks.onMoved.removeListener(this.getAncestors)
    chrome.bookmarks.onRemoved.removeListener(this.getAncestors)
  }

  getAncestors = async () => {
    let ancestors: BookmarkTreeNode[] = []
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
    this.getChildren({ ancestors })
  }

  parentId = (ancestors = this.state.ancestors) => {
    return ancestors.length
      ? ancestors[ancestors.length - 1].id
      : "0";
  }

  hideCreateFolder = () => {
    this.getChildren({ showCreateFolder: false })
  }

  getChildren = async (
    state: Partial<BookmarkListState> = {}
    , setState = true
    , callback?: () => void
  ) => {
    state.ancestors ??= this.state.ancestors
    while (!state.nodes)
      try {
        state.nodes = await chrome.bookmarks.getChildren(
          this.parentId(state.ancestors)
        )
      } catch (e) {
        state.ancestors.pop()
      }
    chrome.storage.local.set({ [this.props.side]: this.parentId(state.ancestors) })
    state.index ??= this.state.index
    if (state.index >= state.nodes.length)
      state.index = state.nodes.length - 1
    if (setState)
      this.setState(state as BookmarkListState, callback)
    return state
  }

  onClick = (index: number): (() => void) => {
    return () => { this.setState({ index: index }); }
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (this.state.showCreateFolder)
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
      if (this.state.index !== 0)
        this.setState({ index: 0 })
    } else if (e.key === "End") {
      if (this.state.index !== this.state.nodes.length - 1)
        this.setState({ index: this.state.nodes.length - 1 })
    } else if (e.key === "Enter" || e.key == "ArrowRight") {
      this.open(this.state.nodes[this.state.index])
    } else if (e.key === "Backspace" || e.key == "ArrowLeft") {
      this.gotoParent()
    } else if (e.key === "Delete") {
      this.delete(e.shiftKey)
    } else if (e.key === "F5") {
      const id = this.state.nodes[this.state.index].id
      this.sort(e.shiftKey ? "title" : "url")
        .then(() => this.getChildren({}, false))
        .then((state) => {
          state.index = state.nodes?.findIndex((node) => node.id === id) ?? 0
          this.setState(state as BookmarkListState)
        })
    } else if (e.key === "F6") {
      const node = this.state.nodes[this.state.index]
      if (node && !this.operationIsPending) {
        this.operationIsPending = true
        this.props.other.current?.move(node)
          .finally(() => this.getChildren({}, true, () => {
            this.operationIsPending = false
          }))
      }
    } else if (e.key === "F7") {
      this.setState({ showCreateFolder: true })
    } else if (e.key === "F9") {
      this.props.other.current?.goto(this.state.ancestors)
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
    this.getChildren({ ancestors, index: 0 })
  }

  open(node: BookmarkTreeNode) {
    if (!node)
      return

    if (node.url) {
      window.open(node.url)
    } else {
      this.getChildren({ index: 0, ancestors: [...this.state.ancestors, node] })
    }
  }

  gotoParent() {
    if (this.state.ancestors.length <= 1)
      return

    const id = this.parentId()
    this.getChildren({ ancestors: this.state.ancestors.slice(0, -1) }, false)
      .then((state: Partial<BookmarkListState>) => {
        const index = state.nodes?.findIndex((node) => node.id === id)
        if (index !== -1 && index !== this.state.index)
          state.index = index
        this.setState(state as BookmarkListState)
      })
  }

  delete(recurse: boolean) {
    if (this.state.index < 0 || this.operationIsPending)
      return

    this.operationIsPending = true
    const remove = recurse ? chrome.bookmarks.removeTree : chrome.bookmarks.remove
    remove(this.state.nodes[this.state.index].id)
      .then(() => {
        const msg = "Deleted " + this.state.nodes[this.state.index].title
        this.props.toasts.current?.addToast({ msg, type: "success" })
      })
      .catch((p) => {
        const msg = this.state.nodes[this.state.index]?.title + " - " + p.message
        this.props.toasts.current?.addToast({ msg, type: "warning" })
      })
      .then(() => this.getChildren(
        {}, true, () => { this.operationIsPending = false }
      ))
  }

  async sort(key: string) {
    const nodes = [...this.state.nodes]
    const compare = key === "url"
      ? (a: BookmarkTreeNode, b: BookmarkTreeNode): number => {
        const u1 = removeProtocol(a.url || "")
        const u2 = removeProtocol(b.url || "")
        return u1.localeCompare(u2) || a.title.localeCompare(b.title)
      }
      : (a: BookmarkTreeNode, b: BookmarkTreeNode): number => {
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
    nodes.sort(compare)
    for (let i = 0; i < nodes.length; i++)
      await chrome.bookmarks.move(nodes[i].id, { index: i })
  }

  focus(): void {
    this.ref.current?.focus();
  }

  move = async (node: BookmarkTreeNode): Promise<void> => {
    for (const a of this.state.ancestors)
      if (a.id === node.id) {
        this.props.toasts.current?.addToast({
          msg: "Cannot move folder under itself!", type: "warning"
        })
        return Promise.resolve()
      }

    let index = this.state.index
    if (index === -1)
      index = this.state.nodes.length

    return chrome.bookmarks.move(node.id, { parentId: this.parentId(), index })
      .then(() => {
        const msg = "Moved " + node.title
        this.props.toasts.current?.addToast({ msg, type: "success" })
      })
      .then(() => this.getChildren({}, false))
      .then((state) => {
        const index = state.nodes?.findIndex((node2) => node2.id === node.id) ?? 0
        state.index = index === -1 || index >= (state.nodes?.length ?? 0) - 1
          ? -1
          : index + 1
        this.setState(state as BookmarkListState)
      })
      .catch((p) => {
        this.props.toasts.current?.addToast({ msg: p.message, type: "warning" })
        this.getChildren()
      })
  }

  render() {
    const breadcrumbs = this.state.ancestors.map((node) => node.title + " /").join(" ");
    const listItems = this.state.nodes.map((node, index) => {
      return <BookmarkItem node={node}
        selected={this.state.selected.has(index)}
        isCurrent={index === this.state.index}
        key={node.id}
        containerRef={this.ref}
        showUrls={this.props.showUrls}
        onClick={this.onClick(index)}
      />
    });
    return (
      <div className="vstack h-100 p-0 outline bookmarks" ref={this.ref}
        tabIndex={0} onKeyDown={this.onKeyDown}>
        <div className='p-1 bg-secondary text-light bookmark-breadcrumbs'>
          {breadcrumbs}
        </div>
        <div className="p-0 overflow-auto" ref={this.scrollRef}>
          <div className="mb-0 p-0 pane">
            {listItems}
          </div>
        </div>
        <CreateFolder
          index={this.state.index === -1 ? undefined : this.state.index}
          parentId={this.parentId()}
          show={this.state.showCreateFolder}
          breadcrumbs={breadcrumbs}
          resetParentId={this.hideCreateFolder} />
      </div>
    );
  }
}

export default BookmarkList;
