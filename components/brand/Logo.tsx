import Image from 'next/image'

export type LogoVariant = 'horizontal' | 'stacked' | 'symbol'
export type LogoTone = 'color' | 'reversed' | 'black' | 'white'

interface LogoProps {
  /** horizontal = P symbol + "paddymeet" side by side. stacked = symbol above wordmark. symbol = P mark only. */
  variant: LogoVariant
  /** color = light backgrounds. reversed = navy/dark backgrounds. black = one-colour, light backgrounds. white = orange backgrounds or photos. */
  tone: LogoTone
  className?: string
  /** Intrinsic height next/image reserves space for (defaults to a high-res base — actual rendered size comes from className, e.g. "h-7 w-auto"). */
  height?: number
  alt?: string
}

// Each variant's real aspect ratio (width / height), taken from the source
// SVG's own viewBox — used to derive an intrinsic width/height pair so
// next/image reserves the right amount of space and never stretches the
// mark, regardless of what final size a className like "h-7 w-auto" renders
// it at.
const ASPECT_RATIO: Record<LogoVariant, number> = {
  horizontal: 780.47 / 193,
  stacked: 632.5 / 458,
  symbol: 160 / 219,
}

const BASE_HEIGHT = 200

export default function Logo({ variant, tone, className = 'h-7 w-auto', height, alt = 'PaddyMeet' }: LogoProps) {
  const h = height ?? BASE_HEIGHT
  const w = Math.round(h * ASPECT_RATIO[variant])

  return (
    <Image
      src={`/brand/${variant}/paddymeet-${variant}-${tone}.svg`}
      alt={alt}
      width={w}
      height={h}
      className={className}
    />
  )
}
