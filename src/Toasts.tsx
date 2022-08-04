import React from 'react';
import { ToastContainer, Toast, Button } from 'react-bootstrap'
type BookmarkTreeNode = chrome.bookmarks.BookmarkTreeNode

export interface Msg {
  id?: number
  , type: string
  , msg: string
  , undoInfo?: BookmarkTreeNode[]
}

export interface ToastRef {
  addToast: (msg: Msg) => void
}

interface ToastsProps {
  focus: () => void
}

export const Toasts = React.forwardRef(ToastsComponent)
function ToastsComponent(props: ToastsProps, ref: React.Ref<ToastRef>) {
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const id = React.useRef<number>();

  React.useImperativeHandle(ref, () => ({ addToast }));

  const addToast = (msg: Msg) => {
    msg.id = id.current = (id.current ?? 0) + 1
    setMessages(messages.concat(msg))
  }

  const removeToast = (id: number | undefined) => {
    setMessages((messages) => messages.filter((e) => e.id !== id));
  }

  const CreateDetails = (obj: BookmarkTreeNode) => {
    return Object.fromEntries(Object.entries(obj).filter(
      ([key]) => ['index', 'parentId', 'title', 'url'].indexOf(key) != -1
    ))
  }

  const undo = async (msg: Msg) => {
    if (!msg.undoInfo)
      return

    const nodes = msg.undoInfo
    while (nodes.length) {
      const node = nodes.shift()
      try {
        const created = await chrome.bookmarks.create(CreateDetails(node!))
        if (!node?.children)
          continue

        for (const i of node.children)
          i.parentId = created.id
        nodes.push(...node.children)
      } catch (error) {
        console.log(error)
      }
    }
    removeToast(msg.id)
    props.focus()
  }

  const UndoButton = (msg: Msg) => {
    if (msg.undoInfo)
      return (
        <Button size="sm" onClick={() => undo(msg)}>
          Undo
        </Button>
      )
    return <></>
  }

  return (
    <ToastContainer
      className="position-fixed d-flex flex-column-reverse flex-wrap-reverse h-100 p-3"
      position='bottom-end'>
      {messages.map((msg) => (
        <Toast key={msg.id}
          bg={msg.type} autohide delay={15000}
          className={"d-flex m-1" + (msg.type === "success" ? " text-light" : "")}
          onClose={() => removeToast(msg.id)}>
          <Toast.Body className='d-flex flex-grow-1 justify-content-between align-items-center p-1'>
            <div className='me-auto'>{msg.msg}</div>
            {UndoButton(msg)}
            <button type="button"
              className={"btn-closeme-2 btn-close"
                + (msg.type === "success" ? " btn-close-white" : "")}
              data-bs-dismiss="toast"
              onClick={() => removeToast(msg.id)} aria-label="Close" />
          </Toast.Body>
        </Toast>
      ))}
    </ToastContainer>
  )
}
