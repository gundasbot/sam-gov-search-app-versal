// components/ProfileCompletionReminder.tsx
'use client'

import React, { useState, useEffect } from 'react'
import { X, AlertCircle, CheckCircle, User } from 'lucide-react'
import { useSession } from 'next-auth/react'

const STORAGE_KEY = 'profile_reminder_state'
const MAX_DISPLAYS = 3
const MAX_REMIND_LATER = 2

interface ReminderState {
  displayCount: number
  remindLaterCount: number
  lastDismissed: string | null
  permanentlyDismissed: boolean
}

export default function ProfileCompletionReminder() {
  const { data: session } = useSession()
  const [show, setShow] = useState(false)
  const [state, setState] = useState<ReminderState>({
    displayCount: 0,
    remindLaterCount: 0,
    lastDismissed: null,
    permanentlyDismissed: false,
  })

  // Load state from localStorage
  useEffect(() => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsedState = JSON.parse(stored)
        setState(parsedState)
        
        // Determine if we should show the reminder
        const shouldShow = Boolean(
          !parsedState.permanentlyDismissed &&
          parsedState.displayCount < MAX_DISPLAYS &&
          session?.user
        )

        setShow(shouldShow)

        
        // If showing, increment display count
        if (shouldShow) {
          const newState = {
            ...parsedState,
            displayCount: parsedState.displayCount + 1,
          }
          setState(newState)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
        }
      } else {
        // First time - show if authenticated
        if (session?.user) {
          const initialState = {
            displayCount: 1,
            remindLaterCount: 0,
            lastDismissed: null,
            permanentlyDismissed: false,
          }
          setState(initialState)
          localStorage.setItem(STORAGE_KEY, JSON.stringify(initialState))
          setShow(true)
        }
      }
    } catch (error) {
      console.error('Error loading profile reminder state:', error)
    }
  }, [session])

  const handleRemindLater = () => {
    const newRemindLaterCount = state.remindLaterCount + 1
    const newState = {
      ...state,
      remindLaterCount: newRemindLaterCount,
      lastDismissed: new Date().toISOString(),
      // If exceeded remind later limit, permanently dismiss
      permanentlyDismissed: newRemindLaterCount >= MAX_REMIND_LATER,
    }
    
    setState(newState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    setShow(false)
  }

  const handleDismiss = () => {
    const newState = {
      ...state,
      permanentlyDismissed: true,
      lastDismissed: new Date().toISOString(),
    }
    
    setState(newState)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newState))
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="mb-6 rounded-2xl border border-amber-500/20 bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm p-5 shadow-lg">
      <div className="flex items-start gap-4">
        <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center flex-shrink-0">
          <User className="h-5 w-5 text-amber-400" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-lg font-semibold text-white">Complete Your Profile</h3>
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300">
              {state.displayCount}/{MAX_DISPLAYS} reminders
            </span>
          </div>
          
          <p className="text-sm text-slate-300 mb-3">
            Unlock advanced features and personalized recommendations by completing your company profile. 
            Add your NAICS codes, set-aside preferences, and location to get better-targeted opportunities.
          </p>
          
          <div className="flex flex-wrap items-center gap-2">
            <a
              href="/account/profile"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium hover:from-amber-600 hover:to-orange-600 transition-all text-sm"
            >
              <CheckCircle className="h-4 w-4" />
              Complete Profile
            </a>
            
            {state.remindLaterCount < MAX_REMIND_LATER && (
              <button
                onClick={handleRemindLater}
                className="px-4 py-2 rounded-xl bg-slate-800/50 text-slate-300 hover:bg-slate-800 hover:text-white border border-slate-700 transition-all text-sm"
              >
                Remind Me Later ({MAX_REMIND_LATER - state.remindLaterCount} left)
              </button>
            )}
            
            <button
              onClick={handleDismiss}
              className="px-4 py-2 rounded-xl text-slate-400 hover:text-white transition-colors text-sm"
            >
              Don't Show Again
            </button>
          </div>
        </div>
        
        <button
          onClick={handleDismiss}
          className="p-2 hover:bg-slate-800/50 rounded-xl transition-colors flex-shrink-0"
          aria-label="Close"
        >
          <X className="h-5 w-5 text-slate-400" />
        </button>
      </div>
    </div>
  )
}