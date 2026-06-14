import { forwardRef } from 'react'

/** Bottom progress line. scaleX of the fill is driven imperatively via ref. */
const ScrollProgress = forwardRef<HTMLSpanElement>((_props, ref) => {
  return (
    <div className="progress" aria-hidden="true">
      <span ref={ref} className="progress__fill" />
    </div>
  )
})

ScrollProgress.displayName = 'ScrollProgress'
export default ScrollProgress
