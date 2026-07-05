import { useEffect, useState } from 'react'

type AquariumMood = 'happy' | 'content' | 'peckish' | 'hungry' | 'very_hungry' | 'sad'
function randomBetween(min: number, max: number) { return min + Math.random() * (max - min) }

function Clam({ mood }: { mood: AquariumMood }) {
  const [open, setOpen] = useState(false)
  const [pupils, setPupils] = useState<{ x: number; y: number }[]>([
    { x: 0, y: 0 },
    { x: 0, y: 0 },
  ])

  useEffect(() => {
    const closedMs = randomBetween(4200, 7200)
    const openMs = randomBetween(1100, 2000)
    const timeout = window.setTimeout(() => setOpen((value) => !value), open ? openMs : closedMs)
    return () => window.clearTimeout(timeout)
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const jiggle = () =>
      setPupils([
        { x: randomBetween(-2.2, 2.2), y: randomBetween(-2, 2.4) },
        { x: randomBetween(-2.2, 2.2), y: randomBetween(-2, 2.4) },
      ])
    jiggle()
    const interval = window.setInterval(jiggle, 320)
    return () => window.clearInterval(interval)
  }, [open])

  const isSad = mood === 'sad' || mood === 'very_hungry'

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <path d="M30 86 C 30 106 44 115 64 115 C 84 115 98 106 98 86 Z" fill="#c4b5fd" stroke="#5b21b6" strokeWidth="4" strokeLinejoin="round" />
      <path d="M38 91 L64 103 L90 91" fill="none" stroke="#7c3aed" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
      <path d="M42 98 L64 108 L86 98" fill="none" stroke="#7c3aed" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
      <g>
        <path d="M32 85 Q 64 60 96 85 Z" fill="#fbcfe8" />
        <path d="M50 85 Q 50 73 64 73 Q 78 73 78 85 Z" fill="#fb7185" />
        <path d="M64 75 Q 62 80 64 85" fill="none" stroke="#e11d48" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
        <circle cx="52" cy="72" r="8" fill="#ffffff" stroke="#3b2a66" strokeWidth="2" />
        <circle cx="76" cy="72" r="8" fill="#ffffff" stroke="#3b2a66" strokeWidth="2" />
        <circle cx={52 + pupils[0].x} cy={72 + pupils[0].y} r="3.8" fill="#221b3a" />
        <circle cx={76 + pupils[1].x} cy={72 + pupils[1].y} r="3.8" fill="#221b3a" />
        {isSad && (
          <g className="creature-tears">
            <ellipse cx="52" cy="81" rx="2.3" ry="3.4" fill="#7dd3fc" />
            <ellipse cx="76" cy="81" rx="2.3" ry="3.4" fill="#7dd3fc" />
          </g>
        )}
      </g>
      <g style={{ transformBox: 'view-box', transformOrigin: '97px 86px', transform: open ? 'rotate(-34deg)' : 'rotate(0deg)', transition: 'transform 380ms cubic-bezier(0.34, 1.56, 0.64, 1)' }}>
        <path d="M30 86 C 30 66 44 57 64 57 C 84 57 98 66 98 86 Z" fill="#ddd6fe" stroke="#5b21b6" strokeWidth="4" strokeLinejoin="round" />
        <path d="M38 81 L64 69 L90 81" fill="none" stroke="#7c3aed" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.65" />
        <path d="M42 74 L64 64 L86 74" fill="none" stroke="#7c3aed" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        <ellipse cx="51" cy="69" rx="7" ry="4" fill="#f5f3ff" opacity="0.7" />
      </g>
      <path d="M33 86 L95 86" fill="none" stroke="#4c1d95" strokeWidth="2.4" strokeLinecap="round" opacity="0.85" />
    </svg>
  )
}

export default Clam
