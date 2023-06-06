import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import React from 'react';

interface CBCTooltipProps {
  text: string,
  children: React.ReactElement
}
export const CBCTooltip = ({ text, children }: CBCTooltipProps) => {
  return (
    <OverlayTrigger
      // placement={'top'}
      overlay={
        text
          ? <Tooltip className='position-fixed'>{text}</Tooltip>
          : <></>
      }
    >
      {children}
    </OverlayTrigger>
  )
}

export const mutateChangedNodes = (
  id: string,
  ci: chrome.bookmarks.BookmarkChangeInfo,
  array: chrome.bookmarks.BookmarkTreeNode[]
) => {
  let nodes = array
  for (let i = 0; i < nodes.length; i++) {
    if (nodes[i].id === id) {
      nodes = [...nodes]
      nodes[i].title = ci.title
      nodes[i].url = ci.url
      return nodes
    }
  }
}

export class Queue<T> {
  data = Array<T>()
  size

  constructor(size: number) {
    this.size = size
  }

  add = (val: T) => {
    this.data.push(val)
    if (this.data.length > this.size)
      this.data.shift()
  }

  at = (n: number) => {
    return this.data.at(n)
  }

  dump = (func: (t: T) => string) => {
    let result = []
    for (const i of this.data)
      result.push(func(i))
    return result
  }
}

export class Debounce {
  queue = new Queue<Date>(5)

  check = () => {
    let t1 = new Date()
    let t0 = this.queue.at(0)
    this.queue.add(t1)
    return t0 && t1.valueOf() - t0.valueOf() < 100
  }
}