import React from 'react';
import { BookmarkList } from './BookmarkList';
import { Toast, Toasts } from './Toasts';
import { Container, Row, Col } from 'react-bootstrap';

interface AppState {
  showUrls: boolean
}

class App extends React.Component<{}, AppState> {
  pane: React.RefObject<BookmarkList>[] = Array.from([0, 1], () => React.createRef());
  toasts = React.createRef<Toast>()
  constructor(props: {}) {
    super(props);
    this.state = { showUrls: true };
  }

  componentDidMount() {
    this.pane[0].current?.focus();
  }

  onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Tab") {
      if (this.pane[0].current?.ref.current === document.activeElement)
        this.pane[1].current?.focus();
      else
        this.pane[0].current?.focus();
    } else if (e.key === "F3") {
      this.setState({ showUrls: !this.state.showUrls })
    } else {
      return
    }

    e.preventDefault();
  }

  render() {
    const buttons = [
      ["Tab", "...", "Left/Right"]
      , ["Del", "...", "Delete\nShift: Delete recursive"]
      , ["Up/Down", "...", "Up/Down"]
      , ["Enter, Right", "Open...", "Open Folder\nOpen Bookmark in new Window/Tab"]
      , ["Backspace, Left", "Parent...", "Goto Parent Folder"]
      , ["F3", "Toggle URLs"]
      , ["F5", "Sort...", "Sort by URL\nShift: Sort by Title"]
      , ["F6", "Move"]
      , ["F7", "+ Folder...", "Create Folder"]
      , ["F9", "Same...", "Goto same Folder in other Pane"]
    ]

    return (
      <Container className="App" fluid onKeyDown={this.onKeyDown} tabIndex={0}>
        <Row className='panes'>
          {this.pane.map((ref, index) => (
            <Col className='pane-container col-6' key={index}>
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
          <div className='p-0 text-truncate'>
            {buttons.map((text) => (
              <span key={text[0]} title={text[2]} className='me-2 bm-key-definition'>
                <span className="px-1 ms-0 me-1 bm-key" >{text[0]}</span>
                <span className="me-1">{text[1]}</span>
              </span>
            ))}
          </div>
        </Row>
        <Toasts ref={this.toasts} />
      </Container>
    );
  }
}

export default App;
