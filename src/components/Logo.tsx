'use client'

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showText?: boolean
  variant?: 'default' | 'light' | 'dark'
  className?: string
}

const sizeMap = {
  sm: { img: 32, text: 'text-lg', container: 'space-x-2' },
  md: { img: 40, text: 'text-xl', container: 'space-x-2.5' },
  lg: { img: 48, text: 'text-2xl', container: 'space-x-3' },
  xl: { img: 64, text: 'text-3xl', container: 'space-x-4' }
}

export default function Logo({ 
  size = 'md', 
  showText = true, 
  variant = 'default',
  className = ''
}: LogoProps) {
  const sizes = sizeMap[size]
  
  const getTextColor = () => {
    switch (variant) {
      case 'light':
        return 'text-white'
      case 'dark':
        return 'text-gray-900'
      default:
        return 'bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent'
    }
  }

  return (
    <div className={`flex items-center ${sizes.container} ${className}`}>
      {/* Logo Image */}
      <div className="relative flex-shrink-0 rounded-xl overflow-hidden" style={{ width: sizes.img, height: sizes.img }}>
        <Image
          src="/logo.png"
          alt="LearnAID Logo"
          width={sizes.img}
          height={sizes.img}
          className="object-cover w-full h-full"
          priority
        />
      </div>

      {/* Logo Text */}
      {showText && (
        <div className="flex flex-col justify-center">
          <span className={`font-bold leading-none ${sizes.text} ${getTextColor()} transition-all duration-300`}>
            LearnAID
          </span>
          {(size === 'lg' || size === 'xl') && (
            <span className={`text-xs ${variant === 'light' ? 'text-blue-200' : variant === 'dark' ? 'text-gray-600' : 'text-blue-400'} font-medium mt-0.5`}>
              Intelligent Learning
            </span>
          )}
        </div>
      )}
    </div>
  )
}