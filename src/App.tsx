import React from 'react'
import ReactDOM from 'react-dom/client'
import { Col, Container, Row } from 'react-bootstrap'
import { BookmarkList } from './BookmarkList.js'
import { Options } from './Options.js'
import { ToastRef, Toasts } from './Toasts.js'
import { CBCTooltip } from './Util.js'

interface AppState {
  showUrls: boolean
}

class App extends React.Component<{}, AppState> {
  pane: React.RefObject<BookmarkList>[]
    = Array.from([0, 1], () => React.createRef())
  toasts = React.createRef<ToastRef>()
  hasFocus = 0
  state = { showUrls: true }
  dirty = false

  async componentDidMount() {
    addEventListener("visibilitychange", this.save)
    const saved = (await chrome.storage.local.get("hasFocus"))["hasFocus"]
    this.focus(saved)
  }

  componentWillUnmount() {
    removeEventListener("visibilitychange", this.save)
  }

  focus = (num?: number) => {
    this.dirty = true
    if (num !== undefined)
      this.hasFocus = num
    this.pane[this.hasFocus].current?.focus()
  }

  save = () => {
    if (document.visibilityState == "hidden" && this.dirty)
      chrome.storage.local.set({ hasFocus: this.hasFocus })
        .then(() => { this.dirty = false })
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      this.focus(this.hasFocus ? 0 : 1)
    } else if (e.key === "F3") {
      this.setState({ showUrls: !this.state.showUrls })
    } else {
      return
    }

    e.preventDefault()
  }

  render() {
    return (
      <Container className="App" fluid onKeyDown={this.onKeyDown}>
        <Row className='panes'>
          {this.pane.map((ref, index) => (
            <Col className='pane-container col-6' key={index}
              onClick={() => { this.focus(index) }}
            >
              <BookmarkList
                side={index.toString()}
                showUrls={this.state.showUrls}
                other={index === 0 ? this.pane[1] : this.pane[0]}
                ref={ref}
                toasts={this.toasts}
              />
            </Col>
          ))}
        </Row>
        <Row className='help bg-light'>
          <div className='p-0 text-truncate help-bar'>
            <Help />
            <Options />
            <KeyboardHints />
          </div>
        </Row>
        <Toasts ref={this.toasts} />
      </Container>
    )
  }
}

const QuestionMark = () => {
  return (
    // https://icons.getbootstrap.com/icons/question-circle-fill/
    <svg xmlns="http://www.w3.org/2000/svg"
      width="16" height="16" fill="currentColor"
      key={"1"}
      className="bi bi-question-circle-fill me-2 d-inline-block align-bottom"
      style={{
        width: "1.1em", height: "1.1em"
      }}
      viewBox="0 0 16 16">
      <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.496 6.033h.825c.138 0 .248-.113.266-.25.09-.656.54-1.134 1.342-1.134.686 0 1.314.343 1.314 1.168 0 .635-.374.927-.965 1.371-.673.489-1.206 1.06-1.168 1.987l.003.217a.25.25 0 0 0 .25.246h.811a.25.25 0 0 0 .25-.25v-.105c0-.718.273-.927 1.01-1.486.609-.463 1.244-.977 1.244-2.056 0-1.511-1.276-2.241-2.673-2.241-1.267 0-2.655.59-2.75 2.286a.237.237 0 0 0 .241.247zm2.325 6.443c.61 0 1.029-.394 1.029-.927 0-.552-.42-.94-1.029-.94-.584 0-1.009.388-1.009.94 0 .533.425.927 1.01.927z" />
    </svg>
  )
}

const Help = () => {
  return (
    <CBCTooltip text="Mainly keyboard usage. The only mouse interactions are checkboxes, selecting an item and hyperlinks. Hover over checkboxes/keyboard hints containing '...' for additional info.">
      {QuestionMark()}
    </CBCTooltip>
  )
}

const KeyboardHints = () => {
  const keys = [
    ["Tab", "...", "Left/Right"]
    , ["Del", "...", "Delete\nShift: Delete recursive"]
    , ["Up/Down", "...", "Up/Down"]
    , ["Enter, Right", "Open...", "Open Folder\nOpen Bookmark in new Window/Tab"]
    , ["Backspace, Left", "Parent...", "Goto Parent Folder"]
    , ["F2", "Edit...", "Edit Bookmark/Folder"]
    , ["F3", "Toggle URLs"]
    , ["F5", "Sort"]
    , ["F6", "Move"]
    , ["F7", "+ Folder...", "Create Folder"]
    , ["F9", "Same...", "Goto same Folder in other Pane"]
  ]

  const keyboardHint = ([key, text, additional]: string[]) => (
    <CBCTooltip key={key} text={additional}>
      <span key={key} className='me-2 bm-key-definition'>
        <span className="px-1 ms-0 me-1 bm-key">{key}</span>
        <span className="me-1">{text}</span>
      </span>
    </CBCTooltip>
  )

  return <>{keys.map(keyboardHint)}</>
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
)
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
