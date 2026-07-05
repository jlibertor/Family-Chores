import { useMemo } from 'react'
type AquariumMood = 'happy' | 'content' | 'peckish' | 'hungry' | 'very_hungry' | 'sad'

const seahorseTail = [
  { x: 65.5, y: 86.4, r: 7.0 }, { x: 64.7, y: 92.8, r: 6.6 },
  { x: 61.3, y: 97.6, r: 6.2 }, { x: 56.3, y: 100.1, r: 5.7 },
]

export function Seahorse({ mood }: { mood: AquariumMood }) {
  const isSad = mood === 'sad' || mood === 'very_hungry'
  const isHappy = mood === 'happy' || mood === 'content'
  const mouth = isSad ? 'M103 41 Q107 37 110 41' : isHappy ? 'M104 39 Q107 42 110 38' : 'M104 40 L110 39'
  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <g fill="#be123c">
        {seahorseTail.map((c, i) => (<circle key={`to${i}`} cx={c.x} cy={c.y} r={c.r + 2.2} />))}
      </g>
      {isSad && (<g className="creature-tears"><ellipse cx="85" cy="38" rx="2.6" ry="4" fill="#7dd3fc" /></g>)}
      <path d={mouth} fill="none" stroke="#be123c" strokeWidth="2.6" strokeLinecap="round" />
    </svg>
  )
}

type PlantLeaf = { x: number; y: number; ang: number; ln: number; wd: number; fill: string; sc: string; sw: number }

function buildTallPlant(): { stems: string[]; leaves: PlantLeaf[] } {
  const baseY = 372, topY = 16, cx = 70, maxHW = 45
  const hw = (t: number) => maxHW * Math.pow(Math.sin(Math.PI * Math.pow(Math.max(0, Math.min(1, t)), 0.82)), 0.78)
  const stemCount = 6
  const stems: { pts: { x: number; y: number; t: number }[]; phase: number }[] = []
  for (let s = 0; s < stemCount; s += 1) {
    const spread = (s / (stemCount - 1) - 0.5) * 2
    const phase = s * 1.7
    const pts: { x: number; y: number; t: number }[] = []
    for (let i = 0; i < 60; i += 1) {
      const t = i / 59
      pts.push({ x: cx + spread * hw(t) * 0.62 + Math.sin(t * 3 + phase) * 3.2, y: baseY - t * (baseY - topY), t })
    }
    stems.push({ pts, phase })
  }
  const stemPaths = stems.map(({ pts }) => 'M ' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L '))
  const leaves: PlantLeaf[] = []
  const emit = (fill: string, sc: string, sw: number, sizeMul: number, dy: number, dx: number, step: number, angSpread: number) => {
    for (const { pts, phase } of stems) {
      const start = Math.floor((phase * 7) % step)
      for (let i = start; i < pts.length; i += step) {
        const { x, y, t } = pts[i]
        if (t > 0.985) continue
        const env = Math.sin(Math.PI * Math.min(t, 1))
        const ln = (11 + 8 * env) * sizeMul * (1 - 0.25 * t)
        const wd = ln * 0.42
        for (const side of [-1, 1]) {
          const ang = -90 + side * (angSpread * (0.55 + 0.45 * env)) + Math.sin(t * 5 + i) * 6
          leaves.push({ x: x + side * dx, y: y + dy, ang, ln, wd, fill, sc, sw })
        }
      }
    }
  }
  emit('#246b29', '#1c5223', 0.6, 1.6, 1, 0, 2, 30)
  return { stems: stemPaths, leaves }
}

export function TallPlant() {
  const { stems, leaves } = useMemo(() => buildTallPlant(), [])
  return (
    <svg className="leafy-plant-svg" viewBox="0 0 140 380" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {stems.map((d, i) => (<path key={`s${i}`} d={d} fill="none" stroke="#1c5e2b" strokeWidth={2} strokeLinecap="round" opacity={0.8} />))}
      {leaves.map((l, i) => (
        <path key={`l${i}`}
          d={`M0 0 Q ${(l.ln * 0.5).toFixed(1)} ${(-l.wd).toFixed(1)} ${l.ln.toFixed(1)} 0 Q ${(l.ln * 0.5).toFixed(1)} ${l.wd.toFixed(1)} 0 0 Z`}
          transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.ang.toFixed(1)})`}
          fill={l.fill} stroke={l.sc} strokeWidth={l.sw} />
      ))}
    </svg>
  )
}
