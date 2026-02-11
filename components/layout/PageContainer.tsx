// app/components/layout/PageContainer.tsx
import { ReactNode } from 'react'

interface PageContainerProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
  background?: 'default' | 'gradient' | 'dark' | 'light' | 'none'
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl'
  maxWidth?: 'wide' | 'content'
}

export default function PageContainer({
  children,
  className = '',
  fullWidth = false,
  background = 'default',
  padding = 'md',
  maxWidth = 'wide',
}: PageContainerProps) {
  const backgroundClasses = {
    default: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
    gradient: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
    dark: 'bg-slate-950',
    light: 'bg-white text-slate-900',
    none: '',
  }

  const paddingClasses = {
    none: '',
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
    xl: 'py-16',
  }

  // ✅ IMPORTANT: stop using container-wide (likely max-w-7xl)
  const widthClasses = fullWidth
    ? 'w-full'
    : maxWidth === 'content'
      ? 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12'
      : 'max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12'

  return (
    <div className={`min-h-screen ${backgroundClasses[background]} ${paddingClasses[padding]} ${className}`}>
      <div className={widthClasses}>{children}</div>
    </div>
  )
}
