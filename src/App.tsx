import { lazy, Suspense } from 'react'
import QantExperience from './components/QantExperience'

// New, isolated WebGL experience at /x. Lazy-loaded so Three.js never touches
// the existing homepage bundle. The default route is unchanged.
const ChipExperience = lazy(() => import('./x/ChipExperience'))

export default function App() {
  const isX =
    typeof window !== 'undefined' && window.location.pathname.replace(/\/$/, '') === '/x'

  if (isX) {
    return (
      <Suspense fallback={<div style={{ position: 'fixed', inset: 0, background: '#04060a' }} />}>
        <ChipExperience />
      </Suspense>
    )
  }

  return <QantExperience />
}
