import React, { useState } from 'react';
import { Button, Modal, Form } from 'react-bootstrap';

interface CreateFolderProps {
  index: number | undefined,
  parentId: string,
  show: boolean,
  breadcrumbs: string,
  resetParentId: () => void
}

export function CreateFolder({ index, parentId, show, breadcrumbs, resetParentId }: CreateFolderProps) {
  const [title, setTitle] = useState("")

  const onFocus = (event: React.FocusEvent<HTMLInputElement>) => {
    event.target.select()
  }

  const createFolder = (event: React.FormEvent) => {
    event.preventDefault()
    chrome.bookmarks.create({ index, parentId, title })
      .then(() => resetParentId())
      .catch((e) => { console.log(e) })
  }

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  }

  return (
    <>
      <Modal show={show} keyboard={true} onHide={() => resetParentId()}>
        <Modal.Header>
          <Modal.Title>Create Folder</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form tabIndex={0} onSubmit={createFolder}>
            <Form.Group>
              <Form.Label>{breadcrumbs}/</Form.Label>
              <Form.Control type="text"
                autoFocus onFocus={onFocus}
                value={title} onChange={handleChange} />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => resetParentId()}>
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}