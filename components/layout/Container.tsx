// components/layout/Container.tsx

import React, { ReactNode } from 'react'

interface ContainerProps {
  children: ReactNode
  className?: string
  fullWidth?: boolean
  as?: keyof React.JSX.IntrinsicElements
}

export default function Container({
  children,
  className = '',
  fullWidth = false,
  as: Component = 'div',
}: ContainerProps) {
  const containerClasses = fullWidth
    ? 'w-full'
    : 'max-w-[1800px] mx-auto px-6 lg:px-10 xl:px-12'

  return <Component className={`${containerClasses} ${className}`}>{children}</Component>
}
