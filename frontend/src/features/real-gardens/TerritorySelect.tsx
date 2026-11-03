import { useId, useState, type KeyboardEvent } from 'react'
import RealGardenField from './RealGardenField'
import { normalizeTerritory, territoryLabel } from './territory'

type Option = { code: string; name: string }

export default function TerritorySelect({ id, label, value, options, disabled, placeholder, error, onChange }: {
  id: string; label: string; value: string; options: Option[]; disabled: boolean
  placeholder: string; error?: string; onChange: (code: string) => void
}) {
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const selected = options.find(item => item.code === value)
  const filtered = options.filter(item => normalizeTerritory(`${item.name} ${item.code}`).includes(normalizeTerritory(query)))
    .sort((a, b) => a.name.localeCompare(b.name, 'es'))

  function choose(code: string) { onChange(code); setOpen(false); setQuery(''); setActive(0) }
  function keyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape') { event.preventDefault(); setOpen(false); return }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault()
      if (!open) { setOpen(true); setQuery(''); setActive(0) }
      else setActive(index => Math.max(0, Math.min(filtered.length - 1, index + (event.key === 'ArrowDown' ? 1 : -1))))
    } else if (event.key === 'Enter') {
      event.preventDefault()
      if (open && filtered[active]) choose(filtered[active].code)
      else { setOpen(true); setQuery('') }
    }
  }

  return <RealGardenField id={id} label={label} error={error}>{props =>
    <div className="rg-combobox" onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget)) { setOpen(false); setQuery('') } }}>
      <input {...props} type="text" role="combobox" autoComplete="off" disabled={disabled}
        aria-expanded={open && !disabled} aria-controls={open ? listId : undefined} aria-autocomplete="list"
        aria-activedescendant={open && filtered[active] ? `${listId}-${filtered[active].code}` : undefined}
        placeholder={placeholder} value={open ? query : selected ? territoryLabel(selected.name) : ''}
        onFocus={() => { setOpen(true); setQuery(''); setActive(0) }} onClick={() => setOpen(true)}
        onChange={event => { setQuery(event.target.value); setOpen(true); setActive(0) }} onKeyDown={keyDown}/>
      {open && !disabled && <div className="rg-select-popover">
        <ul id={listId} role="listbox" aria-label={label}>
          {filtered.map((item, index) => <li key={item.code} id={`${listId}-${item.code}`} role="option" aria-selected={value === item.code}
            className={index === active ? 'is-active' : undefined}
            ref={element => { if (index === active) element?.scrollIntoView({ block: 'nearest' }) }}
            onPointerDown={event => event.preventDefault()} onClick={() => choose(item.code)}>
            {territoryLabel(item.name)} <small>{item.code}</small>
          </li>)}
        </ul>
        {!filtered.length && <p>No se encontraron coincidencias.</p>}
        <button type="button" className="rg-text-button" onPointerDown={event => event.preventDefault()} onClick={() => choose('')}>Dejar sin especificar</button>
      </div>}
    </div>
  }</RealGardenField>
}
