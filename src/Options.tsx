import { CBCTooltip } from './Util.js'
import React from 'react'

export const config = Object.fromEntries([
  ["Sort By Title", "st", "Sort by Title instead of URL"],
  ["Keep Sorted", "ks", "Keep Sorted after Move/Create Folder"]
].map(([key, abbr, text]) => ([[key], { abbr, text, val: undefined }])))

export function Option({ title }: {
  title: string
}) {
  const [get, set] = React.useState(false)
  const initialized = React.useRef<boolean>()

  if (initialized.current === undefined) {
    initialized.current = true
    chrome.storage.local.get(title).then((result) => {
      setAll(result[title] || false)
    })
  }

  const setAll = (val: boolean) => {
    config[title].val = val
    set(val)
  }

  const handleChange = () => {
    const val = !get
    setAll(val)
    chrome.storage.local.set({ [title]: val })
  }

  return (
    <CBCTooltip text={config[title].text || title}>
      <label key={title} className='me-2 bm-key-definition'>
        <input
          type="checkbox" className='align-bottom'
          name={title}
          checked={get}
          onChange={handleChange}
        />
        <span className='px-1'>{config[title].abbr}</span>
      </label>
    </CBCTooltip>
  )
}

export function Options() {
  return (
    <>
      {Object.keys(config).map((key) => (
        <Option key={key} title={key} />
      ))}
    </>
  )
}
