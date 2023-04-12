import { CBCTooltip } from './Util';
import React from 'react';

export const config = Object.fromEntries([
  ["Sort By Title", "st"],
  ["Keep Sorted", "ks", "Keep Sorted after Move/Create Folder"]
].map(([key, abbr, text]) => ([[key], { abbr, text, val: undefined }])))

interface OptionProps {
  title: string
}

export function Option({ title }: OptionProps) {
  const [get, set] = React.useState(false)

  const setAll = (val: boolean) => {
    config[title].val = val
    set(val)
  }

  React.useEffect(() => { // run only once
    chrome.storage.local.get(title).then((result) => {
      setAll(result[title])
    })
  }, []);

  const handleChange = () => {
    const val = !get
    setAll(val)
    chrome.storage.local.set({ [title]: val })
  }

  return (
    <CBCTooltip text={config[title].text || title}>
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
        <Option key={key} title={key} />
      ))}
    </>
  );
}
