import { CHAPTERS } from '../data/chapters'

interface Props {
  active: number // 1-based active chapter index
}

export default function ChapterRail({ active }: Props) {
  return (
    <div className="rail" aria-hidden="true">
      <span className="rail__num">
        {String(active).padStart(2, '0')}
        <span className="rail__total"> / 07</span>
      </span>
      <div className="rail__track">
        {CHAPTERS.map((c) => (
          <span
            key={c.id}
            className={`rail__dot${c.index === active ? ' is-active' : ''}`}
          />
        ))}
      </div>
    </div>
  )
}
