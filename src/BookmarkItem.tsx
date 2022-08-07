import React, { RefObject } from 'react';
import { Card } from 'react-bootstrap';
import { Color } from 'react-bootstrap/esm/types';

interface BookmarkProps {
  node: chrome.bookmarks.BookmarkTreeNode
  , isCurrent: boolean
  , containerRef: RefObject<HTMLElement>
  , showUrls: boolean
  , onClick: () => void
}

export class BookmarkItem extends React.PureComponent<BookmarkProps, {}>
{
  ref: HTMLElement | null = null
  constructor(props: BookmarkProps) {
    super(props);
    this.state = {};
  }

  refCallback = (el: HTMLDivElement) => {
    if (el !== null)
      this.ref = el
  }

  scrollIntoView = (prev?: BookmarkProps) => {
    if (!this.props.isCurrent || prev?.isCurrent)
      return

    const el = this.ref?.getBoundingClientRect();
    const container = this.props.containerRef.current?.getBoundingClientRect();
    if (!el || !container || el.top < container.top || el.bottom > container.bottom)
      this.ref?.scrollIntoView({ block: "center" })
  }

  componentDidMount() {
    this.scrollIntoView()
  }

  componentDidUpdate(prev: BookmarkProps) {
    this.scrollIntoView(prev)
  }

  onClick = () => {
    this.props.onClick()
  }

  favicon = (): JSX.Element => {
    if (!this.props.node.url)
      return <></>

    const Url = new URL(this.props.node.url)
    if (!Url.protocol.startsWith("http"))
      return <></>

    const domain = Url.protocol + "//" + Url.hostname
    return (
      <img width='16' height='16'
        src={'https://www.google.com/s2/favicons?domain=' + domain}
      />
    )
  }

  link = (): JSX.Element => {
    const node = this.props.node
    return node.url?.startsWith("http")
      ? (
        <a href={node.url} onFocus={this.onFocus}>
          {this.favicon()} {node.title}
        </a>
      )
      : <>{node.title}</>
  }

  onFocus = () => {
    this.props.containerRef.current?.focus()
  }

  render() {
    let classes: string[] = [
      'bookmark',
      this.props.isCurrent ? 'cursor' : ''
    ];
    classes = classes.filter((val: string) => { return val; });

    const bg = this.props.isCurrent ? 'primary' : ''
    const text: Color = this.props.isCurrent ? 'light' : 'dark'

    return (
      <Card style={{}} bg={bg} text={text} className={classes.join(' ')}
        ref={this.refCallback} onClick={this.onClick}>
        <Card.Body className='p-0'>
          <Card.Title as='strong'
            className={this.props.node.url ? '' : 'bookmark-folder'}
            title={this.props.node.url}>
            {this.link()}
          </Card.Title>
          <Card.Text className={this.props.showUrls ? '' : 'd-none'}>
            {this.props.node.url}
          </Card.Text>
        </Card.Body>
      </Card>
    );
  }
}
