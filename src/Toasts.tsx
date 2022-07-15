import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { ToastContainer, Toast } from 'react-bootstrap';

export interface Msg {
  id?: number
  , type: string
  , msg: string
}

export interface Toast {
  addToast: (msg: Msg) => void
}

export const Toasts = forwardRef(function Toasts(props: {}, ref: React.Ref<Toast>) {
  const [messages, setMessages] = useState<Msg[]>([]);
  const id = useRef<number>();

  useImperativeHandle(ref, () => ({
    addToast: (msg: Msg) => {
      msg.id = id.current = id.current ? id.current + 1 : 1
      setMessages(messages.concat(msg))
    }
  }));

  const removeToast = (id: number | undefined) => {
    setMessages((messages) => messages.filter((e) => e.id !== id));
  }

  return (
    <ToastContainer
      className="position-fixed d-flex flex-column-reverse flex-wrap-reverse h-100 p-3"
      position='bottom-end'>
      {messages.map((msg) => (
        <Toast key={msg.id}
          bg={msg.type} autohide
          className={"d-flex m-1" + (msg.type === "success" ? " text-light" : "")}
          onClose={() => removeToast(msg.id)}>
          <Toast.Body className='d-flex flex-grow-1 justify-content-between align-items-center p-1'>
            <div className='align-items-stretch'>{msg.msg}</div>
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
})
