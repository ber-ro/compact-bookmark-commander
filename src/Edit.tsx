import React from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { Ancestors } from './Breadcrumbs.js'

interface EditProps {
  id: string,
  title: string,
  url: string | undefined,
  ancestors: Ancestors,
  hide: () => void
}

export const Edit = React.forwardRef(function Edit(
  { id, title, url, ancestors, hide }: EditProps
  , ref
) {
  const [getTitle, setTitle] = React.useState(title)
  const [getUrl, setUrl] = React.useState(url)
  const [message, setMessage] = React.useState("")
  const focused = React.useRef<HTMLInputElement | null>(null)

  React.useImperativeHandle(ref, () => { return { focus } }, [])

  const setFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    focused.current = e.currentTarget as HTMLInputElement
  }

  const focus = () => {
    focused.current?.focus()
  }

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
      <Modal show={true}
        onKeyDown={onKeyDown} dialogClassName="w-100 mw-100" >
        <Modal.Header>
          <Modal.Title>Edit</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p className="lead">{ancestors.breadcrumbs()}</p>
          <Form tabIndex={0} onSubmit={onSubmit} id="Edit-Title-URL">
            <Form.Group className="mb-3">
              <Form.Label>Title</Form.Label>
              <Form.Control type="text" autoFocus
                value={getTitle}
                onFocus={setFocus}
                onChange={(e) => setTitle(e.target.value)} />
            </Form.Group>
            {getUrl && (
              <Form.Group>
                <Form.Label>URL</Form.Label>
                <Form.Control type="text" as="textarea" rows={8}
                  value={getUrl}
                  onFocus={setFocus}
                  onChange={(e) => setUrl(e.target.value)} />
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
  )
})
