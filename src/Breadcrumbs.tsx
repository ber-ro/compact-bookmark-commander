import React from 'react'

export const Breadcrumbs = ({ ancestors }: { ancestors: Ancestors }) => {
  return (
    <div className='p-1 bg-secondary text-light bookmark-breadcrumbs'>
      {ancestors.breadcrumbs()}
    </div>
  )
}

export class Ancestors {
  ancestors: chrome.bookmarks.BookmarkTreeNode[]

  constructor(arr?: chrome.bookmarks.BookmarkTreeNode[]) {
    this.ancestors = arr || []
  }

  getBookmarkNode = async (id: string) => {
    try {
      return (await chrome.bookmarks.get(id))[0]
    } catch (e) {
      return undefined
    }
  }

  findExistingId = async () => {
    if (this.ancestors.length)
      for (let i = this.ancestors.length - 1; i >= 0; i--) {
        const node = await this.getBookmarkNode(this.ancestors[i].id)
        if (node)
          return node.id
      }
    return "0"
  }

  getAncestors = async (id: string) => {
    const ancestors = []
    for (; ;) {
      const node = await this.getBookmarkNode(id!)
      if (!node)
        return [{ id: "0", title: "" }]
      ancestors.unshift(node)
      if (!node.parentId)
        return ancestors
      id = node.parentId
    }
  }

  refresh = async (modifiedId?: string, id?: string) => {
    if (modifiedId && !this.ancestors.find((el) => el.id === modifiedId))
      return

    this.ancestors = await this.getAncestors(id || await this.findExistingId())
    return this.ancestors.at(-1)!.id
  }

  breadcrumbs = () => {
    return this.ancestors.map((n) => n.title + " /").join(" ");
  }

  gotoParent = () => {
    return this.ancestors.length === 1
      ? undefined
      : this.ancestors.slice(0, -1)
  }
}
