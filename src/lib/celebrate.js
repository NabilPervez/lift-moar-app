import { createElement } from 'react'
import { createRoot } from 'react-dom/client'
import Celebration from '../components/Celebration'

// A single detached React root for the celebration overlay, kept OUTSIDE the
// app's <StrictMode> tree so partycles' own root create/unmount never collides
// with an in-flight app render.
let active = null

function teardown() {
  if (!active) return
  const { host, root } = active
  active = null
  // unmount on a fresh task — never inside a React render/commit phase
  setTimeout(() => {
    try {
      root.unmount()
    } catch (e) {
      /* already gone */
    }
    host.remove()
  }, 0)
}

/** Fire the post-workout celebration. `pr` escalates it to fireworks + mortar. */
export function celebrate({ pr = false } = {}) {
  teardown()
  const host = document.createElement('div')
  document.body.appendChild(host)
  const root = createRoot(host)
  active = { host, root }
  root.render(createElement(Celebration, { pr, onDone: teardown }))
}
