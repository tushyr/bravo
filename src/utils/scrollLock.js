// Centralized scroll lock helper for apps that use a custom scroll container (.app-scroll)
// Ensures: no background scroll while modal is open, and restores scroll on close.
// Uses position: fixed pinning to avoid browser quirks that reset scrollTop when overflow changes.

let lockCount = 0
let savedScrollTop = 0
let prevStyles = {}

const getScroller = () => {
  if (typeof document === 'undefined') return null
  return document.querySelector('.app-scroll') || document.documentElement
}

export function lockScroll() {
  const scroller = getScroller()
  if (!scroller) return () => {}

  if (lockCount === 0) {
    // Save current scroll position
    savedScrollTop = scroller.scrollTop || window.pageYOffset || document.documentElement.scrollTop || 0

    // Save inline styles we'll mutate
    prevStyles = {
      position: scroller.style.position,
      top: scroller.style.top,
      left: scroller.style.left,
      right: scroller.style.right,
      width: scroller.style.width,
      overflow: scroller.style.overflow,
    }

    // Pin the scroller to prevent any scroll bleed and keep visual position
    scroller.style.position = 'fixed'
    scroller.style.top = `-${savedScrollTop}px`
    scroller.style.left = '0'
    scroller.style.right = '0'
    scroller.style.width = '100%'
    scroller.style.overflow = 'hidden'

    // CSS hook for any global rules
    document.body.classList.add('modal-open')
  }

  lockCount++

  return () => unlockScroll()
}

export function unlockScroll() {
  const scroller = getScroller()
  if (!scroller) return

  lockCount = Math.max(0, lockCount - 1)
  if (lockCount > 0) return

  // Restore styles
  scroller.style.position = prevStyles.position || ''
  scroller.style.top = prevStyles.top || ''
  scroller.style.left = prevStyles.left || ''
  scroller.style.right = prevStyles.right || ''
  scroller.style.width = prevStyles.width || ''
  scroller.style.overflow = prevStyles.overflow || ''

  // Restore scroll position
  try {
    if (scroller === document.documentElement || scroller === document.body) {
      window.scrollTo(0, savedScrollTop)
    } else {
      scroller.scrollTop = savedScrollTop
    }
  } catch {}

  document.body.classList.remove('modal-open')
}
