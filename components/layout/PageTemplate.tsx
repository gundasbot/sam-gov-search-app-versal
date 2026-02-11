// app/components/layout/PageTemplate.tsx
import { ReactNode } from 'react'

interface PageTemplateProps {
  children: ReactNode
  className?: string
  background?: 'default' | 'dark' | 'light' | 'gradient'
  containerWidth?: 'full' | 'content' | 'wide'
  paddingY?: 'none' | 'sm' | 'md' | 'lg'
}

export default function PageTemplate({
  children,
  className = '',
  background = 'default',
  containerWidth = 'wide',
  paddingY = 'md',
}: PageTemplateProps) {
  const backgroundClasses = {
    default: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
    dark: 'bg-slate-950',
    light: 'bg-slate-100 text-slate-900',
    gradient: 'bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900',
  }

  const paddingClasses = {
    none: '',
    sm: 'py-4',
    md: 'py-8',
    lg: 'py-12',
  }

  // ✅ IMPORTANT: stop using content-container (likely capped)
  const containerClasses = {
    full: 'w-full',
    content: 'max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12',
    wide: 'max-w-[1920px] mx-auto px-4 sm:px-6 lg:px-10 2xl:px-12',
  }

  return (
    <div className={`min-h-[calc(100vh-200px)] ${backgroundClasses[background]} ${className}`}>
      <div className={`${containerClasses[containerWidth]} ${paddingClasses[paddingY]}`}>{children}</div>
    </div>
  )
}
