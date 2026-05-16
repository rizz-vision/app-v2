export function LiveRegions() {
  return (
    <>
      <div aria-live="polite" aria-atomic="true" id="live-polite"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }} />
      <div aria-live="assertive" aria-atomic="true" id="live-assertive"
        style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }} />
    </>
  )
}

export function announce(message, priority = 'polite') {
  const el = document.getElementById(`live-${priority}`)
  if (!el) return
  el.textContent = ''
  requestAnimationFrame(() => { el.textContent = message })
}
