interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  color?: 'primary' | 'white' | 'gray'
  className?: string
}

export default function LoadingSpinner({ 
  size = 'md', 
  color = 'primary',
  className = '' 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  const colorClasses = {
    primary: 'border-primary-500',
    white: 'border-white',
    gray: 'border-gray-500'
  }

  return (
    <div 
      className={`animate-spin rounded-full border-2 border-t-transparent ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  )
}
