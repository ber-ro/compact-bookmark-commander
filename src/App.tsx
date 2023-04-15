import { BookmarkList } from './BookmarkList';
import { Col, Container, Row } from 'react-bootstrap';
import { CBCTooltip } from './Util';
import { Options } from './Options';
import { ToastRef, Toasts } from './Toasts';
import React from 'react';
import ReactDOM from 'react-dom/client';

interface AppState {
  showUrls: boolean
}

class App extends React.Component<{}, AppState> {
  pane: React.RefObject<BookmarkList>[] = Array.from([0, 1], () => React.createRef());
  toasts = React.createRef<ToastRef>()
  hasFocus = 0
  constructor(props: {}) {
    super(props);
    this.state = { showUrls: true };
  }

  componentDidMount() {
    this.focus();
  }

  focus = (num?: number) => {
    if (num)
      this.hasFocus = num
    this.pane[this.hasFocus].current?.focus();
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      this.hasFocus =
        this.pane[0].current?.ref.current === document.activeElement ? 1 : 0
      this.focus()
    } else if (e.key === "F3") {
      this.setState({ showUrls: !this.state.showUrls })
    } else {
      return
    }

    e.preventDefault();
  }

  render() {
    return (
      <Container className="App" fluid onKeyDown={this.onKeyDown} tabIndex={0}>
        <Row className='panes'>
          {this.pane.map((ref, index) => (
            <Col className='pane-container col-6' key={index}>
              <BookmarkList
                focus={() => { this.focus(index) }}
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
          <div className='p-0 text-truncate'>
            <Options focus={this.focus} />
            <KeyboardHints />
          </div>
        </Row>
        <Toasts ref={this.toasts} focus={this.focus} />
      </Container>
    );
  }
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
);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

export { App };
export default App;
