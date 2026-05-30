import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { filterPitcherNameSuggestions } from '../data/pitcherNames'

interface PitcherNameInputProps {
  id?: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  autoFocus?: boolean
}

export function PitcherNameInput({
  id,
  value,
  onChange,
  placeholder,
  autoFocus,
}: PitcherNameInputProps) {
  const listId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [open, setOpen] = useState(false)

  const groups = useMemo(() => filterPitcherNameSuggestions(value), [value])
  const hasSuggestions = groups.some((group) => group.candidates.length > 0)

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handlePointerDown)
    return () => document.removeEventListener('mousedown', handlePointerDown)
  }, [])

  const handleSelect = (name: string) => {
    onChange(name)
    setOpen(false)
  }

  return (
    <div className="name-suggest-field" ref={rootRef}>
      <input
        id={id}
        className="session-input"
        value={value}
        onChange={(event) => {
          onChange(event.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        autoFocus={autoFocus}
        autoComplete="off"
        role="combobox"
        aria-expanded={open && hasSuggestions}
        aria-controls={listId}
      />

      {open && hasSuggestions && (
        <div className="name-suggest-panel" id={listId} role="listbox">
          {groups.map((group) => (
            <div key={group.label} className="name-suggest-group">
              <p className="name-suggest-group-label">{group.label}</p>
              <ul className="name-suggest-list">
                {group.candidates.map((candidate) => (
                  <li key={`${candidate.name}|${candidate.reading}`}>
                    <button
                      type="button"
                      className="name-suggest-item"
                      role="option"
                      aria-selected={value === candidate.name}
                      onMouseDown={(event) => event.preventDefault()}
                      onClick={() => handleSelect(candidate.name)}
                    >
                      <span className="name-suggest-primary">{candidate.name}</span>
                      <span className="name-suggest-reading">{candidate.reading}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
