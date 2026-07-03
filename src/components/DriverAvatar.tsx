import { useState } from 'react'
import { manufacturerColor } from '../lib/driverStats'

interface Props {
  carNumber: number
  driverName: string
  manufacturer: string | null
  photoUrl?: string | null
  size?: 'sm' | 'lg'
}

/** Driver headshot with a race-plate fallback when no photo is available. */
export default function DriverAvatar({
  carNumber,
  driverName,
  manufacturer,
  photoUrl,
  size = 'sm',
}: Props) {
  const [failed, setFailed] = useState(false)
  const px = size === 'lg' ? 'w-24 h-24' : 'w-12 h-12'
  const color = manufacturerColor(manufacturer)

  if (photoUrl && !failed) {
    return (
      <div
        className={`${px} shrink-0 overflow-hidden rounded-sm border-2`}
        style={{ borderColor: color }}
      >
        <img
          src={photoUrl}
          alt={driverName}
          loading="lazy"
          onError={() => setFailed(true)}
          className="w-full h-full object-cover object-top"
        />
      </div>
    )
  }

  return (
    <div
      className={`${px} shrink-0 rounded-sm border-2 bg-asphalt-800 flex items-center justify-center`}
      style={{ borderColor: color }}
      aria-label={driverName}
    >
      <span
        className={`font-display ${size === 'lg' ? 'text-4xl' : 'text-lg'}`}
        style={{ color }}
      >
        {carNumber}
      </span>
    </div>
  )
}
