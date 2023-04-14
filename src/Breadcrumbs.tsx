import React from 'react'

export const Breadcrumbs = ({ ancestors }: { ancestors: Ancestors }) => {
  return (
    <div className='p-1 bg-secondary text-light bookmark-breadcrumbs'>
      {ancestors.breadcrumbs()}
    </div>
  )
}

export class Ancestors {
  ancestors: chrome.bookmarks.BookmarkTreeNode[] = []

  getBookmark = async (id: string) => {
    try {
      return (await chrome.bookmarks.get(id))[0]
    } catch (e) {
      return undefined
    }
  }

  getId = async () => {
    if (this.ancestors.length)
      for (let i = this.ancestors.length - 1; i >= 0; i--) {
        const node = await this.getBookmark(this.ancestors[i].id)
        if (node)
          return node.id
      }
    return "0"
  }

  refresh = async (modifiedId?: string, id?: string) => {
    if (modifiedId && !this.ancestors.find((el) => el.id === modifiedId))
      return

    id ||= await this.getId()
    let ancestors = []
    for (let i = id; ;) {
      const node = await this.getBookmark(i!)
      if (!node)
        break
      ancestors.unshift(node)
      if (node.id === "0")
        break
      i = node.parentId!
    }
    if (!ancestors.length)
      ancestors = [{ id: "0", title: "" }]
    this.ancestors = ancestors

    return id
  }

  breadcrumbs = () => {
    return this.ancestors.map((n) => n.title + " /").join(" ");
  }

  gotoParent = () => {
    if (this.ancestors.length === 1)
      return undefined

    this.ancestors = this.ancestors.slice(0, -1)
    return this.ancestors.at(-1)!.id
  }
}
