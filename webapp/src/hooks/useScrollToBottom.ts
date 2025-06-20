"use client"

import { useRef, useEffect } from "react"

export function useScrollToBottom<T extends HTMLElement>(): [
  React.RefObject<T | null>,
  React.RefObject<HTMLDivElement | null>
] {
  const containerRef = useRef<T>(null)
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const scrollToBottom = () => {
      if (endRef.current) {
        endRef.current.scrollIntoView({ behavior: "smooth" })
      }
    }

    const observer = new MutationObserver(scrollToBottom)
    
    if (containerRef.current) {
      observer.observe(containerRef.current, {
        childList: true,
        subtree: true,
        attributes: true,
        characterData: true
      })
    }

    return () => observer.disconnect()
  }, [])

  return [containerRef, endRef]
}
