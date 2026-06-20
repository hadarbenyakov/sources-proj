import { useState } from 'react'

type Props = {
  name: string
  online?: boolean
  selected?: boolean
  size?: number
  seed?: string
  photo?: string
}

// Picks a deterministic gradient from the user's name/seed so each avatar
// has its own consistent color while staying offline-friendly.
const GRADIENTS = [
  ['#f0a4d4', '#a06bd9'],
  ['#7dc6ff', '#5b8df5'],
  ['#ffb86b', '#ff6b8a'],
  ['#7be3b6', '#36b48f'],
  ['#b0a4ff', '#7a5cf0'],
  ['#ffd166', '#ff8b5e'],
  ['#9ddfff', '#5cbed8'],
  ['#ffb0ad', '#e85c5c'],
]

function hash(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return Math.abs(h)
}

export default function Avatar({
  name,
  online,
  selected,
  size = 64,
  seed,
  photo,
}: Props) {
  const [imgOk, setImgOk] = useState(true)
  const initial = (name.charAt(0) || '?').toUpperCase()
  const [a, b] = GRADIENTS[hash(seed ?? name) % GRADIENTS.length]
  const dotSize = 15
  const ringWidth = 3
  const showPhoto = Boolean(photo) && imgOk

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <div
        className="w-full h-full rounded-full overflow-hidden flex items-center justify-center text-white font-semibold"
        style={{
          background: showPhoto ? undefined : `linear-gradient(135deg, ${a}, ${b})`,
          fontSize: size * 0.36,
          boxShadow: selected ? `0 0 0 ${ringWidth}px #f75f19` : undefined,
        }}
      >
        {showPhoto ? (
          <img
            src={photo}
            alt={name}
            className="w-full h-full object-cover"
            onError={() => setImgOk(false)}
          />
        ) : (
          initial
        )}
      </div>
      {online && !selected && (
        <div
          className="absolute rounded-full bg-[#3dd676]"
          style={{
            width: dotSize,
            height: dotSize,
            right: -1,
            bottom: -1,
            boxShadow: `0 0 0 ${ringWidth}px #1b1b1b`,
          }}
        />
      )}
    </div>
  )
}
