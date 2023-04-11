import { CBCTooltip } from './Util';
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
  title: Config
}

export function Option({ title }: OptionProps) {
  const [get, set] = React.useState(false)

  chrome.storage.local.get(title).then((result) => {
    if (typeof result[title] !== 'undefined')
      set(result[title])
  })

  const handleChange = () => {
    const val = !get
    config[title].val = val
    set(val)
    chrome.storage.local.set({ [title]: val })
  }

  return (
    <CBCTooltip text={title}>
      <label key={title} className='me-2'>
        <input
          type="checkbox"
          checked={get}
          onChange={handleChange}
        />
        <span className='align-top'>{config[title].abbr}</span>
      </label>
    </CBCTooltip>
  );
}

export function Options(
) {
  return (
    <>
      {Object.keys(config).map((key) => (
        <Option key={key} title={key as Config} />
      ))}
    </>
  );
}
