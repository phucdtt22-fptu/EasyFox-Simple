"use client"

import { useRef, useEffect } from "react"

export function useScrollToBottom<T extends HTMLElement>(
  dependencies: unknown[] = []
): [
  React.RefObject<T | null>,
  React.RefObject<HTMLDivElement | null>
] {
  const containerRef = useRef<T>(null)
  const endRef = useRef<HTMLDivElement>(null)
  const lastDependencyRef = useRef<unknown[]>([])

  useEffect(() => {
    const scrollToBottom = () => {
      if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }

    // Check if dependencies actually changed (for messages array, check length)
    const currentDeps = dependencies
    const lastDeps = lastDependencyRef.current
    
    let shouldScroll = false
    
    if (currentDeps.length !== lastDeps.length) {
      shouldScroll = true
    } else {
      // Check if the messages array length changed (first dependency should be messages)
      const currentMessages = currentDeps[0] as unknown[]
      const lastMessages = lastDeps[0] as unknown[]
      
      if (Array.isArray(currentMessages) && Array.isArray(lastMessages)) {
        shouldScroll = currentMessages.length !== lastMessages.length
      } else {
        shouldScroll = JSON.stringify(currentDeps) !== JSON.stringify(lastDeps)
      }
    }
    
    if (shouldScroll) {
      // Use a small timeout to let the DOM update
      const timeoutId = setTimeout(scrollToBottom, 100)
      lastDependencyRef.current = [...currentDeps]
      
      return () => clearTimeout(timeoutId)
    }
    
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...dependencies]) // Spread dependencies to satisfy ESLint

  return [containerRef, endRef]
}
