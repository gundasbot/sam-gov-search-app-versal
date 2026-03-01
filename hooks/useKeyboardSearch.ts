// hooks/useKeyboardSearch.ts
import { useEffect, useCallback } from 'react'

interface UseKeyboardSearchOptions {
  onSearch: () => void
  onFocusSearch: () => void
  inputRef?: React.RefObject<HTMLInputElement | null>
  enabled?: boolean
}

export function useKeyboardSearch({
  onSearch,
  onFocusSearch,
  inputRef,
  enabled = true
}: UseKeyboardSearchOptions) {
  
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return
    
    // Get the active element
    const activeElement = document.activeElement
    const isInputFocused = activeElement?.tagName === 'INPUT' || 
                          activeElement?.tagName === 'TEXTAREA' ||
                          activeElement?.getAttribute('contenteditable') === 'true'
    
    // "/" key - Focus search input (only when not already in an input)
    if (event.key === '/' && !isInputFocused) {
      event.preventDefault()
      onFocusSearch()
      return
    }
    
    // Ctrl/Cmd + K - Focus search input (works everywhere)
    if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
      event.preventDefault()
      onFocusSearch()
      return
    }
    
    // Enter key - Trigger search (when in search input)
    if (event.key === 'Enter' && isInputFocused) {
      // Check if the focused element is the search input
      if (inputRef?.current && activeElement === inputRef.current) {
        event.preventDefault()
        onSearch()
        return
      }
    }
    
    // Ctrl/Cmd + Enter - Trigger search from anywhere
    if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
      event.preventDefault()
      onSearch()
      return
    }
    
    // Escape - Blur search input
    if (event.key === 'Escape' && isInputFocused) {
      (activeElement as HTMLElement)?.blur()
      return
    }
  }, [enabled, onSearch, onFocusSearch, inputRef])
  
  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])
}
