// Centralized scroll lock helper for apps that use a custom scroll container (.app-scroll)
// Ensures: no background scroll while modal is open, no layout jump on close.
// Works across mobile/desktop by fixing the scroller and restoring its position.

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
    // Save current scroll
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

    // Fix the scroller in place and prevent any scroll bleed
    scroller.style.position = 'fixed'
    scroller.style.top = `-${savedScrollTop}px`
    scroller.style.left = '0'
    scroller.style.right = '0'
    scroller.style.width = '100%'
    scroller.style.overflow = 'hidden'

    // Keep CSS hook for any additional rules
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
  if (scroller === document.documentElement || scroller === document.body) {
    window.scrollTo(0, savedScrollTop)
  } else {
    scroller.scrollTop = savedScrollTop
  }

  document.body.classList.remove('modal-open')
}
