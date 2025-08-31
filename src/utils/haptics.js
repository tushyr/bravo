// Lightweight web haptics helper (Android Vibration API)
// - No-ops on unsupported platforms (iOS Safari, Desktop, Reduced Motion)
// - Throttles to avoid dense patterns during rapid taps/scrolls

let enabled = true
let last = 0
const MIN_GAP_MS = 60

function isReducedMotion() {
  try { return window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches } catch { return false }
}

function isAndroid() {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent || navigator.vendor || ''
  return /Android/i.test(ua)
}

function canVibrate() {
  return typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function'
}

function shouldHaptic() {
  return enabled && !isReducedMotion() && isAndroid() && canVibrate()
}

function vibrate(pattern) {
  if (!shouldHaptic()) return
  const now = Date.now()
  if (now - last < MIN_GAP_MS) return
  try { navigator.vibrate(pattern) } catch { /* ignore */ }
  last = now
}

export function initHaptics() {
  try {
    const v = localStorage.getItem('haptics:enabled')
    if (v != null) enabled = v === '1'
  } catch { /* ignore */ }
}

export function setHapticsEnabled(v) {
  enabled = !!v
  try { localStorage.setItem('haptics:enabled', enabled ? '1' : '0') } catch { /* ignore */ }
}

export const haptics = {
  light: () => vibrate(10),
  selection: () => vibrate(12),
  success: () => vibrate([15, 8, 15]),
  warning: () => vibrate([20, 8, 20]),
  error: () => vibrate([25, 12, 25]),
  heavy: () => vibrate(30),
  toggle: (on) => vibrate(on ? [12, 6, 12] : 12),
  impact: (level = 'light') => {
    switch (level) {
      case 'medium': return vibrate(18)
      case 'heavy': return vibrate(30)
      default: return vibrate(10)
    }
  },
}

export default haptics
