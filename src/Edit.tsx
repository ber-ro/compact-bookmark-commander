import React from 'react';
import { Alert, Button, Form, Modal } from 'react-bootstrap';
import { Ancestors } from './Breadcrumbs';

interface EditProps {
  id: string,
  title: string,
  url: string | undefined,
  ancestors: Ancestors,
  hide: () => void
}

export function Edit(
  { id, title, url, ancestors, hide }: EditProps
) {
  const [getTitle, setTitle] = React.useState(title)
  const [getUrl, setUrl] = React.useState(url)
  const [message, setMessage] = React.useState("")
  const titleRef = React.useRef<HTMLInputElement>(null)

  const onKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation()
    if (e.key === "Escape") {
      hide()
    } else if (e.key === "Enter") {
      e.preventDefault()
      onSubmit(e)
    }
  }

  const onSubmit = (event: React.FormEvent) => {
    setMessage("")
    event.preventDefault()
    chrome.bookmarks.update(id, { title: getTitle, url: getUrl })
      .then(() => hide())
      .catch((e) => { setMessage(e.message) })
  }

  return (
    <>
      <Modal show={true} onEntered={() => titleRef?.current?.focus()}
        onKeyDown={onKeyDown} dialogClassName="w-100 mw-100" >
        <Modal.Header>
          <Modal.Title>Edit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="lead">{ancestors.breadcrumbs()}</p>
          <Form tabIndex={0} onSubmit={onSubmit} id="Edit-Title-URL">
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control type="text" ref={titleRef}
                value={getTitle} onChange={(e) => setTitle(e.target.value)} />
            </Form.Group>
            {getUrl && (
              <Form.Group>
                <Form.Label>URL</Form.Label>
                <Form.Control type="text" as="textarea" rows={8}
                  value={getUrl} onChange={(e) => setUrl(e.target.value)} />
              </Form.Group>
            )}
            {message && <Alert variant='danger'>{message}</Alert>}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={hide}>
            Cancel
          </Button>
          <Button type="submit" form="Edit-Title-URL">Submit</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}
