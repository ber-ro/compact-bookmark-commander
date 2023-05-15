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