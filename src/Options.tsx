import { OverlayTrigger, Tooltip } from 'react-bootstrap';
import React from 'react';

export const config = {
  "Sort By Title": {
    val: false,
    abbr: "st"
  },
  "Move Sorted": {
    val: false,
    abbr: "ms"
  }
}
type Config = keyof typeof config

interface OptionProps {
  label: Config
}

export function Option({ label }: OptionProps) {
  const [get, set] = React.useState(false)

  chrome.storage.local.get(label).then((result) => {
    if (typeof result[label] !== 'undefined')
      set(result[label])
  })

  const handleChange = () => {
    const val = !get
    config[label].val = val
    set(val)
    chrome.storage.local.set({ [label]: val })
  }

  return (
    <OverlayTrigger
      key={label}
      placement={'top'}
      overlay={
        label
          ? <Tooltip className='position-fixed'>{label}</Tooltip>
          : <></>
      }
    >
      <label key={label} className='me-2'>
        <input
          type="checkbox"
          checked={get}
          onChange={handleChange}
        />
        <span className='align-top'>{config[label].abbr}</span>
      </label>
    </OverlayTrigger>
  );
}

export function Options(
) {
  return (
    <>
      {Object.keys(config).map((key) => (
        <Option key={key} label={key as Config} />
      ))}
    </>
  );
}
