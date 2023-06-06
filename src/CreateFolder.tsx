import React from 'react'
import { Alert, Button, Form, Modal } from 'react-bootstrap'
import { Ancestors } from './Breadcrumbs.js'

interface CreateFolderProps {
  index: (a: chrome.bookmarks.BookmarkTreeNode) => number | undefined,
  parentId: string,
  ancestors: Ancestors,
  hide: () => void
}

export const CreateFolder = React.forwardRef(function CreateFolder(
  { index, parentId, ancestors, hide }: CreateFolderProps,
  ref: React.ForwardedRef<HTMLInputElement>
) {
  const [title, setTitle] = React.useState("")
  const [message, setMessage] = React.useState("")

  const createFolder = (event: React.FormEvent) => {
    setMessage("")
    event.preventDefault()
    chrome.bookmarks.create({
      index: index({ title } as chrome.bookmarks.BookmarkTreeNode)
      , parentId: parentId, title
    })
      .then(() => hide())
      .catch((e) => { setMessage(e.message) })
  }

  return (
    <Modal show={true} keyboard={true}
      onHide={hide}
      onShow={() => { typeof (ref) !== "function" && ref?.current?.focus() }}
      dialogClassName="w-100 mw-100">
      <Modal.Header>
        <Modal.Title>Create Folder</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="lead">{ancestors.breadcrumbs()}</p>
        <Form tabIndex={0} onSubmit={createFolder} id="CreateFolder">
          <Form.Group>
            <Form.Control type="text" className='cbc-bookmark-formcontrol'
              autoFocus ref={ref} value={title}
              onChange={(e) => { setTitle(e.target.value) }} />
          </Form.Group>
          {message && <Alert variant='danger'>{message}</Alert>}
        </Form>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={() => hide()}>
          Cancel
        </Button>
        <Button type="submit" form="CreateFolder">Submit</Button>
      </Modal.Footer>
    </Modal>
  )
})
