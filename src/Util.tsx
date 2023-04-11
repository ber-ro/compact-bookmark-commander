import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import React from 'react';

interface CBCTooltipProps {
  text: string,
  children: React.ReactElement
}
export const CBCTooltip = ({ text, children }: CBCTooltipProps) => {
  return (
    <OverlayTrigger
      key={text}
      placement={'top'}
      overlay={
        text
          ? <Tooltip className='position-fixed'>{text}</Tooltip>
          : <></>
      }
    >
      {children}
    </OverlayTrigger>
  )
}