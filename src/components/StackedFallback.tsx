import { CHAPTERS } from '../data/chapters'
import FixedNav from './FixedNav'
import SiteFooter from './SiteFooter'

/**
 * Reduced-motion / unstable-mobile fallback: plain stacked sections with
 * static images and fully readable text. No Lenis, no scrub, no particles.
 */
export default function StackedFallback() {
  return (
    <div className="stacked">
      <FixedNav />
      {CHAPTERS.map((c) => (
        <section key={c.id} id={c.id} className="stacked__section">
          <img
            className="stacked__img"
            src={c.asset}
            alt=""
            style={{ objectPosition: c.objectPosition }}
            loading={c.index === 1 ? 'eager' : 'lazy'}
          />
          <div className="stacked__readability" />
          <div className="stacked__content">
            <div className="chapter-content__eyebrow">{c.eyebrow}</div>
            <h2 className="chapter-content__title">
              {c.title.map((line) => (
                <span key={line}>{line}</span>
              ))}
            </h2>
            <p className="chapter-content__body">{c.body}</p>
            <a className="chapter-content__cta" href="#">
              {c.cta}
            </a>
          </div>
        </section>
      ))}
      <div style={{ position: 'relative', minHeight: '46vh', background: 'var(--bg-0)' }}>
        <SiteFooter visible />
      </div>
    </div>
  )
}
