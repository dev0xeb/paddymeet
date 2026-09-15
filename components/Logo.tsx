const sources = {
  color: {
    horizontal: '/brand/paddymeet-logo-kit/svg/logo-horizontal-color.svg',
    stacked: '/brand/paddymeet-logo-kit/svg/logo-stacked-color.svg',
    wordmark: '/brand/paddymeet-logo-kit/svg/wordmark-color.svg',
    icon: '/brand/paddymeet-logo-kit/svg/icon-color.svg',
  },
  white: {
    horizontal: '/brand/paddymeet-logo-kit/svg/logo-horizontal-white.svg',
    stacked: '/brand/paddymeet-logo-kit/svg/logo-stacked-white.svg',
    wordmark: '/brand/paddymeet-logo-kit/svg/wordmark-white.svg',
    icon: '/brand/paddymeet-logo-kit/svg/icon-white.svg',
  },
} as const

interface LogoProps {
  /** 'color' = navy pin/text for light backgrounds. 'white' = white pin/text for dark backgrounds. */
  theme?: keyof typeof sources
  variant?: keyof typeof sources['color']
  className?: string
  alt?: string
}

export default function Logo({ theme = 'color', variant = 'horizontal', className = 'h-7 w-auto', alt = 'PaddyMeet' }: LogoProps) {
  return <img src={sources[theme][variant]} alt={alt} className={className} />
}
