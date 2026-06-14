import { forwardRef } from 'react'

const COLUMNS = ['Technology', 'System', 'Applications', 'Company', 'Resources']
const META = ['Contact', 'Legal', 'Privacy']

interface Props {
  /** when true, render fully visible (used by the stacked fallback) */
  visible?: boolean
}

/** Footer fades in during the final chapter; opacity driven imperatively. */
const SiteFooter = forwardRef<HTMLElement, Props>(({ visible }, ref) => {
  return (
    <footer
      ref={ref}
      className="footer"
      aria-label="Footer"
      style={visible ? { opacity: 1, pointerEvents: 'auto' } : undefined}
    >
      <div className="footer__brand">
        <span className="footer__wordmark">Q.ANT</span>
        <p className="footer__tag">
          Computing with light.
          <br />
          Intelligence without limits.
        </p>
      </div>

      <nav className="footer__cols" aria-label="Footer navigation">
        {COLUMNS.map((c) => (
          <a key={c} href={`#${c.toLowerCase()}`} className="footer__col">
            {c}
          </a>
        ))}
      </nav>

      <nav className="footer__meta" aria-label="Legal">
        {META.map((m) => (
          <a key={m} href={`#${m.toLowerCase()}`} className="footer__metalink">
            {m}
          </a>
        ))}
      </nav>
    </footer>
  )
})

SiteFooter.displayName = 'SiteFooter'
export default SiteFooter
