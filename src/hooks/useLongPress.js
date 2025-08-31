import { useState, useRef, useCallback, useEffect } from 'react'
import { haptics } from '../utils/haptics'

export default function useLongPress(
  onLongPress,
  onClick,
  {
    threshold = 500,
    captureEvent = true,
    preventContextMenu = true,
    movementThreshold = 10,
    ignoreInteractive = true,
  } = {}
) {
  const [action, setAction] = useState()
  const [isPressed, setIsPressed] = useState(false)
  const timerRef = useRef()
  const isLongPress = useRef(false)
  const startPosRef = useRef({ x: 0, y: 0 })
  const startedRef = useRef(false)

  const isFromInteractive = (target) => {
    if (!ignoreInteractive || !target) return false
    try {
      return !!target.closest(
        'button, a, input, textarea, select, [role="button"], [data-no-longpress]'
      )
    } catch {
      return false
    }
  }

  const start = useCallback((event) => {
    if (captureEvent) {
      event.persist?.()
    }

    // Only left mouse button for desktop
    if (event.type === 'mousedown' && event.button !== 0) return
    // Ignore interactive elements (buttons, inputs, etc.)
    if (isFromInteractive(event.target)) return

    // Record starting position for move-cancel logic
    if (event.touches && event.touches[0]) {
      startPosRef.current = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
      }
    } else {
      startPosRef.current = {
        x: event.clientX ?? 0,
        y: event.clientY ?? 0,
      }
    }

    setIsPressed(true)
    startedRef.current = true
    isLongPress.current = false
    
    timerRef.current = setTimeout(() => {
      isLongPress.current = true
      setAction('longpress')
      try { haptics.impact('heavy') } catch {}
      onLongPress?.(event)
    }, threshold)
  }, [onLongPress, threshold, captureEvent])

  const clear = useCallback((event, shouldTriggerClick = true) => {
    if (captureEvent) {
      event.persist?.()
    }

    setIsPressed(false)
    clearTimeout(timerRef.current)
    
    if (startedRef.current && shouldTriggerClick && !isLongPress.current) {
      setAction('click')
      onClick?.(event)
    }
    startedRef.current = false
  }, [onClick, captureEvent])

  const move = useCallback((event) => {
    if (!isPressed) return
    const { x: sx, y: sy } = startPosRef.current
    let cx = 0, cy = 0
    if (event.touches && event.touches[0]) {
      cx = event.touches[0].clientX
      cy = event.touches[0].clientY
    } else {
      cx = event.clientX ?? sx
      cy = event.clientY ?? sy
    }
    const dx = Math.abs(cx - sx)
    const dy = Math.abs(cy - sy)
    if (dx > movementThreshold || dy > movementThreshold) {
      clear(event, false)
    }
  }, [isPressed, movementThreshold, clear])

  const handlers = {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseMove: move,
    onMouseLeave: (event) => clear(event, false),
    onTouchStart: start,
    onTouchEnd: clear,
    onTouchMove: move,
    onTouchCancel: (event) => clear(event, false),
  }

  if (preventContextMenu) {
    handlers.onContextMenu = (e) => {
      e.preventDefault()
    }
  }

  useEffect(() => {
    return () => clearTimeout(timerRef.current)
  }, [])

  return {
    action,
    handlers,
    isPressed,
    isLongPress: isLongPress.current,
  }
}

