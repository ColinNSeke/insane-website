import { useState } from 'react'

const LINKS = ['Technology', 'System', 'Applications', 'Company', 'Resources']

export default function FixedNav() {
  const [open, setOpen] = useState(false)

  return (
    <header className="nav" aria-label="Primary">
      <a className="nav__wordmark" href="#server" aria-label="Q.ANT home">
        Q.ANT
      </a>

      <nav className="nav__links" aria-label="Sections">
        {LINKS.map((l) => (
          <a key={l} href={`#${l.toLowerCase()}`} className="nav__link">
            {l}
          </a>
        ))}
      </nav>

      <button
        className={`nav__menu${open ? ' is-open' : ''}`}
        aria-label="Menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <span />
        <span />
      </button>
    </header>
  )
}
