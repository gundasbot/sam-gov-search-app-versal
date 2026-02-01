'use client'

import { useCallback } from 'react'

interface ScrollToOptions {
  offset?: number
  behavior?: ScrollBehavior
}

export function useScrollTo() {
  const scrollToTop = useCallback((options?: ScrollToOptions) => {
    window.scrollTo({
      top: options?.offset || 0,
      behavior: options?.behavior || 'smooth',
    })
  }, [])

  const scrollToElement = useCallback((
    elementId: string,
    options?: ScrollToOptions
  ) => {
    const element = document.getElementById(elementId)
    if (element) {
      const offsetTop = element.offsetTop - (options?.offset || 0)
      window.scrollTo({
        top: offsetTop,
        behavior: options?.behavior || 'smooth',
      })
    }
  }, [])

  const scrollToBottom = useCallback((options?: ScrollToOptions) => {
    window.scrollTo({
      top: document.documentElement.scrollHeight,
      behavior: options?.behavior || 'smooth',
    })
  }, [])

  return {
    scrollToTop,
    scrollToElement,
    scrollToBottom,
  }
}

// Example usage:
// const { scrollToTop, scrollToElement } = useScrollTo()
// 
// <button onClick={() => scrollToTop()}>Back to Top</button>
// <button onClick={() => scrollToElement('contact-section', { offset: 100 })}>
//   Go to Contact
// </button>