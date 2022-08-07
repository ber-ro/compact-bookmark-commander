import React from 'react';
import { Button, Modal, Form } from 'react-bootstrap';

interface CreateFolderProps {
  index: () => number,
  parentId: () => string,
  show: boolean,
  breadcrumbs: string,
  hideCreateFolder: () => void
}

export const CreateFolder = React.memo(function CreateFolder(
  { index, parentId, show, breadcrumbs, hideCreateFolder }: CreateFolderProps
) {
  const [title, setTitle] = React.useState("")

  const onFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select()
  }

  const createFolder = (event: React.FormEvent) => {
    event.preventDefault()
    chrome.bookmarks.create({
      index: index() === -1 ? undefined : index(), parentId: parentId(), title
    })
      .then(() => hideCreateFolder())
      .catch((e) => { console.log(e) })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  }

  return (
    <>
      <Modal show={show} keyboard={true} onHide={() => hideCreateFolder()}>
        <Modal.Header>
          <Modal.Title>Create Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form tabIndex={0} onSubmit={createFolder}>
            <Form.Group>
              <Form.Label>{breadcrumbs}</Form.Label>
              <Form.Control type="text"
                autoFocus onFocus={onFocus}
                value={title} onChange={handleChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => hideCreateFolder()}>
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
})
