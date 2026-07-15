/* eslint-disable react-refresh/only-export-components -- Keep the typed species registry beside its renderer. */
import { useId } from 'react'

export type AquariumMood = 'happy' | 'content' | 'peckish' | 'hungry' | 'very_hungry' | 'sad'

export const aquariumSpeciesIds = [
  'clownfish',
  'seahorse',
  'angelfish',
  'crab',
  'pufferfish',
  'starfish',
  'clam',
  'happy-jellyfish',
  'benny-fish',
] as const

export type AquariumSpeciesId = (typeof aquariumSpeciesIds)[number]

export const aquariumSpeciesLabels: Record<AquariumSpeciesId, string> = {
  clownfish: 'Clownfish',
  seahorse: 'Seahorse',
  angelfish: 'Angelfish',
  crab: 'Crab',
  pufferfish: 'Pufferfish',
  starfish: 'Starfish',
  clam: 'Clam',
  'happy-jellyfish': 'Happy Jellyfish',
  'benny-fish': 'Benny Fish',
}

const aquariumSpeciesSet = new Set<string>(aquariumSpeciesIds)

export function isAquariumSpecies(value: string): value is AquariumSpeciesId {
  return aquariumSpeciesSet.has(value)
}

export type CreatureArtProps = {
  speciesId: string
  mood: AquariumMood
}

type CreaturePalette = {
  light: string
  base: string
  shadow: string
  deep: string
  accent: string
}

type MoodFaceProps = {
  mood: AquariumMood
  x: number
  y: number
  scale?: number
  eyeSpacing?: number
}

const outline = '#173247'
const softOutline = '#284b5d'
const cream = '#fff8e7'

function useSvgId(prefix: string) {
  const reactId = useId().replace(/:/g, '')
  return `${prefix}-${reactId}`
}

function CreatureDefs({ id, palette }: { id: string; palette: CreaturePalette }) {
  return (
    <defs>
      <linearGradient id={`${id}-body`} x1="12%" y1="8%" x2="88%" y2="94%">
        <stop offset="0" stopColor={palette.light} />
        <stop offset="0.43" stopColor={palette.base} />
        <stop offset="1" stopColor={palette.shadow} />
      </linearGradient>
      <linearGradient id={`${id}-shadow`} x1="18%" y1="0" x2="82%" y2="100%">
        <stop offset="0" stopColor={palette.shadow} stopOpacity="0.25" />
        <stop offset="1" stopColor={palette.deep} stopOpacity="0.92" />
      </linearGradient>
      <linearGradient id={`${id}-fin`} x1="10%" y1="5%" x2="90%" y2="95%">
        <stop offset="0" stopColor={palette.light} stopOpacity="0.9" />
        <stop offset="0.55" stopColor={palette.accent} stopOpacity="0.78" />
        <stop offset="1" stopColor={palette.shadow} stopOpacity="0.82" />
      </linearGradient>
      <radialGradient id={`${id}-glow`} cx="32%" cy="24%" r="72%">
        <stop offset="0" stopColor="#ffffff" stopOpacity="0.82" />
        <stop offset="0.42" stopColor={palette.light} stopOpacity="0.3" />
        <stop offset="1" stopColor={palette.light} stopOpacity="0" />
      </radialGradient>
    </defs>
  )
}

function MoodFace({ mood, x, y, scale = 1, eyeSpacing = 13 }: MoodFaceProps) {
  const mouthPath = {
    happy: 'M -7 11 Q 0 20 7 11',
    content: 'M -6 12 Q 0 17 6 12',
    peckish: 'M -6 15 Q 0 16 6 15',
    hungry: 'M -6 20 Q 0 15 6 20',
    very_hungry: 'M -7 22 Q 0 14 7 22',
    sad: 'M -7 22 Q 0 14 7 22',
  }[mood]

  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      <g className="creature-eyes" fill={outline}>
        <circle cx={-eyeSpacing} cy="0" r="4.1" />
        <circle cx={eyeSpacing} cy="0" r="4.1" />
      </g>
      <path d={mouthPath} fill="none" stroke={outline} strokeLinecap="round" strokeWidth="3.4" />
    </g>
  )
}

export function CreatureArt({ speciesId, mood }: CreatureArtProps) {
  switch (speciesId) {
    case 'clownfish':
      return <Clownfish mood={mood} />
    case 'seahorse':
      return <Seahorse mood={mood} />
    case 'angelfish':
      return <Angelfish mood={mood} />
    case 'crab':
      return <Crab mood={mood} />
    case 'pufferfish':
      return <Pufferfish mood={mood} />
    case 'starfish':
      return <Starfish mood={mood} />
    case 'clam':
      return <Clam mood={mood} />
    case 'happy-jellyfish':
      return <HappyJellyfish mood={mood} />
    case 'benny-fish':
      return <BennyFish mood={mood} />
    default:
      return <UnknownCreature />
  }
}

function UnknownCreature() {
  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <path d="M22 66 C27 39 49 24 76 29 C98 33 113 49 108 70 C103 91 81 103 57 98 C35 94 18 82 22 66 Z" fill="#dbe8ee" stroke={outline} strokeWidth="3.8" />
      <path d="M25 65 C17 54 9 51 5 55 C10 64 15 69 24 72 Z" fill="#bfd3dd" stroke={outline} strokeLinejoin="round" strokeWidth="3.4" />
      <text x="68" y="78" fill={softOutline} fontFamily="system-ui, sans-serif" fontSize="42" fontWeight="900" textAnchor="middle">?</text>
    </svg>
  )
}

function Clownfish({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('clownfish')
  const palette: CreaturePalette = {
    light: '#ffbf69',
    base: '#ff7a3d',
    shadow: '#d94f2b',
    deep: '#9f3524',
    accent: '#ff9f4f',
  }

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />
      <path d="M31 65 C22 48 13 39 7 40 C7 52 11 61 19 66 C11 72 8 82 9 94 C19 91 27 82 33 69 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.6" />
      <path d="M58 38 C53 25 42 20 33 24 C38 37 47 43 59 44 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.4" />
      <path d="M59 91 C49 105 39 106 32 100 C37 88 47 83 61 83 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.4" />

      <path d="M29 65 C32 44 51 32 79 33 C101 34 118 46 120 62 C122 78 106 92 82 95 C55 98 33 87 29 65 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
      <path d="M36 73 C52 91 84 98 108 82 C100 94 82 99 63 95 C48 92 39 84 36 73 Z" fill={`url(#${id}-shadow)`} opacity="0.68" />
      <path d="M43 47 C58 35 81 34 98 40 C78 39 59 44 47 56 Z" fill={`url(#${id}-glow)`} opacity="0.72" />

      <path d="M52 39 C45 51 45 77 53 91 C58 93 64 94 69 94 C61 78 60 50 68 35 C62 35 57 36 52 39 Z" fill={cream} stroke={outline} strokeWidth="2.7" />
      <path d="M82 34 C76 51 77 80 86 94 C92 93 98 91 103 88 C94 73 94 48 101 40 C95 37 89 35 82 34 Z" fill={cream} stroke={outline} strokeWidth="2.7" />
      <path d="M64 53 C54 57 51 67 58 75 C66 71 70 62 64 53 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3" />
      <path d="M76 40 C82 37 88 37 94 39" fill="none" stroke="#fff3cf" strokeLinecap="round" strokeWidth="3.2" opacity="0.75" />

      <MoodFace mood={mood} x={99} y={61} scale={0.59} eyeSpacing={10.5} />
    </svg>
  )
}

function Angelfish({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('angelfish')
  const palette: CreaturePalette = {
    light: '#fff3a6',
    base: '#f9d85e',
    shadow: '#dda936',
    deep: '#9d6b24',
    accent: '#6ed6e8',
  }

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />
      <path d="M38 63 C29 49 19 45 10 49 C17 57 22 62 28 65 C21 70 16 77 14 86 C25 84 33 77 40 68 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.6" />
      <path d="M59 43 C58 22 68 11 81 8 C85 27 80 41 68 52 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.5" />
      <path d="M57 82 C55 101 64 115 76 120 C83 101 79 86 68 75 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.5" />

      <path d="M38 64 C43 42 60 27 79 28 C98 29 113 45 116 62 C118 79 103 97 80 103 C59 98 44 84 38 64 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
      <path d="M44 72 C57 91 82 102 105 85 C99 95 89 101 80 103 C61 99 48 87 44 72 Z" fill={`url(#${id}-shadow)`} opacity="0.62" />
      <path d="M50 49 C63 33 84 29 99 39 C81 36 64 45 55 59 Z" fill={`url(#${id}-glow)`} opacity="0.7" />

      <path d="M58 36 C53 50 54 79 65 95" fill="none" stroke="#56c7dd" strokeLinecap="round" strokeWidth="7.5" opacity="0.9" />
      <path d="M74 30 C67 47 69 77 81 98" fill="none" stroke="#fb7185" strokeLinecap="round" strokeWidth="6.2" opacity="0.9" />
      <path d="M45 63 C53 57 62 58 68 65 C61 74 52 75 45 63 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="2.9" />
      <path d="M83 34 C91 35 98 39 103 45" fill="none" stroke="#fff9d8" strokeLinecap="round" strokeWidth="3.2" opacity="0.75" />

      <MoodFace mood={mood} x={94} y={62} scale={0.57} eyeSpacing={10.5} />
    </svg>
  )
}

function Seahorse({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('seahorse')
  const palette: CreaturePalette = {
    light: '#ffe17a',
    base: '#f4b83f',
    shadow: '#d98a2b',
    deep: '#9d5e25',
    accent: '#ffcf58',
  }

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />

      <path d="M69 79 C70 92 68 103 60 110 C53 116 40 116 36 108 C32 100 39 92 47 95 C53 97 54 104 50 108" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="20" />
      <path d="M69 79 C70 92 68 103 60 110 C53 116 40 116 36 108 C32 100 39 92 47 95 C53 97 54 104 50 108" fill="none" stroke={`url(#${id}-body)`} strokeLinecap="round" strokeWidth="13.5" />

      <path d="M65 28 C72 18 84 16 94 22 C102 27 105 36 102 45 C110 45 117 49 121 54 C114 60 105 61 95 57 C91 64 87 68 81 70 C81 82 76 91 68 94 C61 94 56 87 58 78 C60 69 55 61 53 54 C50 44 54 34 65 28 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
      <path d="M58 56 C65 66 70 79 67 92 C74 88 78 79 77 68 C69 65 63 61 58 56 Z" fill={`url(#${id}-shadow)`} opacity="0.66" />
      <path d="M65 31 C75 21 88 22 95 29 C83 26 72 34 67 45 Z" fill={`url(#${id}-glow)`} opacity="0.78" />

      <path d="M57 38 L47 31 L55 48 L45 45 L55 58 L47 61 L59 69" fill={`url(#${id}-fin)`} stroke={outline} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <path d="M69 23 L68 12 L76 20 L82 10 L86 21 L95 15 L93 25" fill={`url(#${id}-fin)`} stroke={outline} strokeLinecap="round" strokeLinejoin="round" strokeWidth="3.2" />
      <path d="M58 60 C65 58 73 62 77 68 M61 70 C67 69 73 73 76 78 M61 81 C66 81 70 84 72 88" fill="none" stroke="#b96f27" strokeLinecap="round" strokeWidth="2.2" opacity="0.52" />
      <path d="M105 49 C111 49 115 51 118 54" fill="none" stroke="#fff3b0" strokeLinecap="round" strokeWidth="2.8" opacity="0.82" />

      <MoodFace mood={mood} x={84} y={39} scale={0.52} eyeSpacing={9.5} />
    </svg>
  )
}

function Crab({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('crab')
  const palette: CreaturePalette = {
    light: '#ff9e9c',
    base: '#f0646c',
    shadow: '#c83f56',
    deep: '#8f2943',
    accent: '#ffb0a8',
  }

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />

      <path d="M43 84 C34 91 27 98 22 107 M52 89 C47 98 44 106 43 114 M85 84 C94 91 101 98 106 107 M76 89 C81 98 84 106 85 114" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="7.2" />
      <path d="M43 84 C34 91 27 98 22 107 M52 89 C47 98 44 106 43 114 M85 84 C94 91 101 98 106 107 M76 89 C81 98 84 106 85 114" fill="none" stroke="#e75462" strokeLinecap="round" strokeWidth="3.6" />

      <path d="M40 58 C29 55 22 48 19 39" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="8" />
      <path d="M88 58 C99 55 106 48 109 39" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="8" />
      <path d="M25 17 C12 17 6 29 12 41 C18 51 32 50 38 40 C30 39 26 35 25 29 C31 31 36 28 39 22 C35 18 30 17 25 17 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
      <path d="M103 17 C116 17 122 29 116 41 C110 51 96 50 90 40 C98 39 102 35 103 29 C97 31 92 28 89 22 C93 18 98 17 103 17 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />

      <path d="M28 68 C29 48 45 38 64 38 C83 38 99 48 100 68 C101 88 86 99 64 99 C42 99 27 88 28 68 Z" fill={`url(#${id}-body)`} stroke={outline} strokeWidth="3.8" />
      <path d="M31 77 C41 94 68 102 91 89 C84 97 73 100 62 99 C45 98 34 90 31 77 Z" fill={`url(#${id}-shadow)`} opacity="0.7" />
      <path d="M38 55 C49 42 69 40 83 47 C66 44 51 50 42 63 Z" fill={`url(#${id}-glow)`} opacity="0.72" />
      <path d="M41 43 C42 35 47 30 53 30 M75 30 C81 30 86 35 87 43" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="4" />
      <circle cx="43" cy="64" r="3" fill="#ffb1a6" opacity="0.72" />
      <circle cx="87" cy="76" r="2.5" fill="#b9364f" opacity="0.5" />

      <MoodFace mood={mood} x={64} y={65} scale={0.72} eyeSpacing={12} />
    </svg>
  )
}

function Pufferfish({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('pufferfish')
  const palette: CreaturePalette = {
    light: '#fff49a',
    base: '#f7cf47',
    shadow: '#d5a62f',
    deep: '#946825',
    accent: '#ffd85e',
  }

  const spikes = [
    'M47 32 L42 16 L56 27 Z',
    'M70 27 L72 10 L81 29 Z',
    'M91 35 L104 20 L102 42 Z',
    'M106 52 L123 48 L109 63 Z',
    'M108 76 L124 83 L106 87 Z',
    'M92 94 L102 111 L84 101 Z',
    'M66 101 L64 119 L55 101 Z',
    'M41 93 L27 108 L31 87 Z',
  ]

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />
      <path d="M34 66 C25 53 15 49 7 53 C14 61 19 65 26 68 C18 73 14 79 12 87 C23 86 31 79 37 71 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.6" />
      {spikes.map((spike) => (
        <path key={spike} d={spike} fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.2" />
      ))}
      <path d="M30 66 C30 42 47 28 71 28 C95 28 111 44 111 66 C111 89 94 103 70 103 C47 103 30 89 30 66 Z" fill={`url(#${id}-body)`} stroke={outline} strokeWidth="3.8" />
      <path d="M34 75 C45 96 77 108 101 88 C94 98 82 103 69 103 C50 102 38 92 34 75 Z" fill={`url(#${id}-shadow)`} opacity="0.64" />
      <path d="M41 49 C53 32 77 29 93 38 C74 34 55 42 46 58 Z" fill={`url(#${id}-glow)`} opacity="0.72" />
      <path d="M35 65 C44 57 54 58 61 66 C54 76 44 76 35 65 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="2.9" />
      <circle cx="55" cy="42" r="2.7" fill="#b98229" opacity="0.62" />
      <circle cx="88" cy="88" r="3.1" fill="#b98229" opacity="0.55" />
      <circle cx="48" cy="84" r="2.1" fill="#fff3a3" opacity="0.7" />

      <MoodFace mood={mood} x={79} y={64} scale={0.66} eyeSpacing={11} />
    </svg>
  )
}

function Starfish({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('starfish')
  const palette: CreaturePalette = {
    light: '#ffc46b',
    base: '#f38b42',
    shadow: '#d35b36',
    deep: '#943c2f',
    accent: '#ffad55',
  }

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />
      <path d="M64 8 C70 8 75 31 78 43 C89 38 111 29 116 36 C121 44 101 58 91 65 C100 74 114 94 107 100 C100 107 82 91 72 83 C67 95 60 119 51 116 C42 113 47 89 49 77 C36 78 12 81 11 72 C10 63 34 57 46 54 C41 43 31 21 39 17 C47 13 58 34 64 44 C68 33 58 8 64 8 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
      <path d="M22 71 C42 70 54 73 60 84 C66 94 60 109 54 115 C46 112 48 89 49 77 C37 78 20 79 14 75 Z" fill={`url(#${id}-shadow)`} opacity="0.58" />
      <path d="M47 28 C55 34 61 44 64 52 C72 47 84 43 98 40 C84 48 74 56 68 67 C59 57 52 43 47 28 Z" fill={`url(#${id}-glow)`} opacity="0.68" />
      <circle cx="43" cy="54" r="3.1" fill="#ffd08a" opacity="0.82" />
      <circle cx="82" cy="48" r="2.6" fill="#c74c34" opacity="0.52" />
      <circle cx="84" cy="80" r="3.3" fill="#ffbd69" opacity="0.78" />
      <circle cx="43" cy="87" r="2.4" fill="#bd4934" opacity="0.46" />
      <circle cx="64" cy="29" r="2.2" fill="#fff0bd" opacity="0.72" />

      <MoodFace mood={mood} x={64} y={64} scale={0.75} eyeSpacing={11.5} />
    </svg>
  )
}

function Clam({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('clam')
  const palette: CreaturePalette = {
    light: '#eadcff',
    base: '#c9b2ef',
    shadow: '#9277c8',
    deep: '#614d96',
    accent: '#f4a9c8',
  }

  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />
      <path d="M18 70 C21 42 40 24 64 24 C88 24 107 42 110 70 C92 66 36 66 18 70 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
      <path d="M24 65 C31 43 45 32 62 29 C48 39 43 52 43 67 Z" fill={`url(#${id}-glow)`} opacity="0.72" />
      <path d="M64 27 L64 66 M43 32 C49 44 52 55 53 67 M85 32 C79 44 76 55 75 67 M27 47 C39 52 45 59 47 68 M101 47 C89 52 83 59 81 68" fill="none" stroke="#7d65ad" strokeLinecap="round" strokeWidth="2.5" opacity="0.58" />

      <path d="M20 72 C29 62 42 57 64 57 C86 57 99 62 108 72 C101 91 85 103 64 103 C43 103 27 91 20 72 Z" fill="#f7d8e8" stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
      <ellipse cx="64" cy="74" rx="32" ry="18" fill={`url(#${id}-fin)`} stroke="#7e567d" strokeWidth="2.4" />
      <path d="M22 78 C31 99 48 108 68 106 C86 104 100 94 106 77 C99 94 83 101 64 101 C44 101 30 92 22 78 Z" fill={`url(#${id}-shadow)`} opacity="0.62" />
      <path d="M28 86 C39 91 51 94 64 94 C77 94 89 91 100 86 M38 96 C47 99 55 101 64 101 C73 101 81 99 90 96" fill="none" stroke="#755b9f" strokeLinecap="round" strokeWidth="2.4" opacity="0.48" />
      <ellipse cx="64" cy="67" rx="11" ry="8" fill="#fffaf5" stroke="#e7b7cb" strokeWidth="2.2" />
      <ellipse cx="60" cy="64" rx="4" ry="2.2" fill="white" opacity="0.82" />

      <MoodFace mood={mood} x={64} y={71} scale={0.63} eyeSpacing={10.5} />
    </svg>
  )
}

function HappyJellyfish({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('happy-jellyfish')
  const palette: CreaturePalette = {
    light: '#ffb88d',
    base: '#ff7f61',
    shadow: '#e95f55',
    deep: '#b9434b',
    accent: '#ffd0ad',
  }

  return (
    <svg className="creature-svg creature-svg-happy-jellyfish" viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />
      <defs>
        <linearGradient id={`${id}-tentacles`} x1="20%" y1="0" x2="78%" y2="100%">
          <stop offset="0" stopColor="#ffd0ad" />
          <stop offset="0.55" stopColor="#ffe1c7" />
          <stop offset="1" stopColor="#fff0df" />
        </linearGradient>
      </defs>

      <g className="jellyfish-tentacles">
        <path d="M37 55 C31 68 28 81 32 93 C36 104 30 112 23 117 C38 117 45 108 43 95 C41 83 48 70 51 59 Z" fill={`url(#${id}-tentacles)`} stroke={outline} strokeLinejoin="round" strokeWidth="2.8" />
        <path d="M49 57 C44 70 46 81 51 90 C56 100 51 110 44 118 C59 115 67 104 62 91 C58 80 63 68 64 58 Z" fill={`url(#${id}-tentacles)`} stroke={outline} strokeLinejoin="round" strokeWidth="2.8" />
        <path d="M61 57 C57 72 62 83 58 95 C55 106 60 116 66 121 C72 112 72 103 75 95 C80 82 71 70 72 57 Z" fill={`url(#${id}-tentacles)`} stroke={outline} strokeLinejoin="round" strokeWidth="2.8" />
        <path d="M74 58 C76 72 83 80 81 91 C78 102 85 111 94 116 C91 105 96 96 98 88 C102 75 91 65 88 56 Z" fill={`url(#${id}-tentacles)`} stroke={outline} strokeLinejoin="round" strokeWidth="2.8" />
        <path d="M32 67 C24 78 23 90 27 99 M96 66 C105 77 105 88 101 99" fill="none" stroke="#fff0df" strokeLinecap="round" strokeWidth="3.4" opacity="0.92" />
      </g>

      <g className="jellyfish-bell">
        <path d="M19 59 C21 33 39 15 64 15 C89 15 107 33 109 59 C103 68 95 66 88 59 C84 69 76 72 68 62 C63 72 53 72 46 62 C39 69 28 68 19 59 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
        <path d="M22 56 C31 66 40 64 46 57 C53 68 62 68 68 58 C76 68 84 66 89 56 C96 64 102 63 107 57 C104 68 96 69 88 61 C83 71 75 72 68 63 C62 72 52 72 46 63 C38 70 28 67 22 56 Z" fill={`url(#${id}-shadow)`} opacity="0.52" />
        <path d="M31 40 C40 23 59 18 75 21 C57 22 44 31 37 47 Z" fill={`url(#${id}-glow)`} opacity="0.88" />
        <path d="M40 27 C47 21 55 19 63 19" fill="none" stroke="#ffe6d1" strokeLinecap="round" strokeWidth="4" opacity="0.72" />
        <circle cx="32" cy="52" r="2.5" fill="#ffbf9b" opacity="0.65" />
        <circle cx="94" cy="43" r="2.2" fill="#d95455" opacity="0.4" />
        <MoodFace mood={mood} x={64} y={43} scale={0.66} eyeSpacing={11} />
      </g>
    </svg>
  )
}

function BennyFace({ mood }: { mood: AquariumMood }) {
  const cheerful = mood === 'happy' || mood === 'content'
  const worried = mood === 'hungry' || mood === 'very_hungry' || mood === 'sad'
  const crying = mood === 'very_hungry' || mood === 'sad'

  return (
    <g>
      <ellipse cx="87" cy="68" rx="5.5" ry="3" fill="#fb8b91" opacity={cheerful ? 0.4 : 0.18} />
      <ellipse cx="115" cy="68" rx="5.2" ry="3" fill="#fb8b91" opacity={cheerful ? 0.4 : 0.18} />
      <path d={worried ? 'M84 49 Q90 44 96 49' : 'M84 48 Q90 45 96 47'} fill="none" stroke={softOutline} strokeLinecap="round" strokeWidth="2.5" />
      <path d={worried ? 'M105 49 Q111 44 117 49' : 'M105 47 Q111 45 117 48'} fill="none" stroke={softOutline} strokeLinecap="round" strokeWidth="2.5" />
      <g className="creature-eyes">
        <ellipse cx="91" cy="57" rx="6.2" ry="7.7" fill="#162731" stroke="#fff8e7" strokeWidth="2.1" />
        <ellipse cx="110" cy="57" rx="6.2" ry="7.7" fill="#162731" stroke="#fff8e7" strokeWidth="2.1" />
        <circle cx="89.5" cy="54.3" r="1.7" fill="white" />
        <circle cx="108.5" cy="54.3" r="1.7" fill="white" />
      </g>
      {crying && (
        <g className="creature-tears">
          <ellipse cx="90" cy="68" rx="2.5" ry="4.4" fill="#7dd3fc" stroke="#e0f2fe" strokeWidth="0.8" />
          <ellipse cx="111" cy="68" rx="2.5" ry="4.4" fill="#7dd3fc" stroke="#e0f2fe" strokeWidth="0.8" />
        </g>
      )}
      <path d="M96 68 Q102 64 108 68 L102 74 Z" fill="#15242d" stroke={outline} strokeLinejoin="round" strokeWidth="2" />
      <path d="M102 74 L102 77" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="2.2" />
      {mood === 'happy' && (
        <g>
          <path d="M91 78 Q102 91 113 78 Q111 96 102 97 Q93 96 91 78 Z" fill="#3b2530" stroke={outline} strokeLinejoin="round" strokeWidth="2.7" />
          <path d="M96 91 Q102 86 108 91 Q106 95 102 95 Q98 95 96 91 Z" fill="#fb7185" />
        </g>
      )}
      {mood === 'content' && <path d="M92 79 Q102 88 112 79" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="3" />}
      {mood === 'peckish' && <path d="M94 82 Q102 80 110 82" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="3" />}
      {mood === 'hungry' && <ellipse cx="102" cy="83" rx="4.7" ry="3.8" fill="#fff1f2" stroke={outline} strokeWidth="2.5" />}
      {mood === 'very_hungry' && <path d="M92 88 Q102 77 112 88" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="3.2" />}
      {mood === 'sad' && <path d="M91 90 Q102 76 113 90" fill="none" stroke={outline} strokeLinecap="round" strokeWidth="3.4" />}
    </g>
  )
}

function BennyFish({ mood }: { mood: AquariumMood }) {
  const id = useSvgId('benny-fish')
  const palette: CreaturePalette = {
    light: '#68747a',
    base: '#343d42',
    shadow: '#222a2f',
    deep: '#10171b',
    accent: '#f8f3e8',
  }

  return (
    <svg className="creature-svg creature-svg-benny-fish" viewBox="0 0 128 128" role="img" aria-hidden="true">
      <CreatureDefs id={id} palette={palette} />

      <g className="benny-tail">
        <path d="M31 65 C22 49 12 42 6 45 C7 57 12 64 20 68 C12 74 9 84 11 96 C21 92 29 83 34 69 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.8" />
        <path d="M18 51 C20 58 24 63 30 66 M18 89 C23 83 27 77 31 69" fill="none" stroke="#88949a" strokeLinecap="round" strokeWidth="2.2" opacity="0.42" />
      </g>
      <path d="M55 39 C50 25 40 20 31 25 C36 38 45 44 58 45 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.4" />
      <path d="M58 92 C48 105 38 105 32 98 C39 88 49 84 61 85 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.4" />

      <g className="benny-ears">
        <path className="benny-ear" d="M76 38 L82 12 C91 17 97 25 97 37 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.7" />
        <path className="benny-ear benny-ear-back" d="M96 37 L108 15 C115 24 117 35 113 46 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.7" />
        <path d="M84 29 L87 20 C91 24 93 28 93 34 Z M104 34 L109 24 C112 29 113 34 111 39 Z" fill="#d98282" opacity="0.72" />
      </g>

      <path d="M29 66 C32 44 51 31 78 31 C101 31 117 45 120 62 C123 80 105 96 80 99 C53 102 32 88 29 66 Z" fill={`url(#${id}-body)`} stroke={outline} strokeLinejoin="round" strokeWidth="3.9" />
      <path d="M34 76 C49 96 83 105 109 88 C101 97 90 100 79 100 C57 101 41 92 34 76 Z" fill={`url(#${id}-shadow)`} opacity="0.76" />
      <path d="M40 49 C51 35 68 32 82 35 C65 36 51 44 44 58 Z" fill={`url(#${id}-glow)`} opacity="0.5" />

      <path d="M99 32 C103 42 101 51 99 59 C97 66 100 72 103 78 C107 71 109 62 110 54 C112 45 108 37 104 33 C102 32 101 32 99 32 Z" fill="#fff8e7" />
      <path d="M88 66 C92 59 108 58 115 65 C121 73 116 86 104 93 C92 94 83 82 88 66 Z" fill="#fff8e7" stroke={outline} strokeLinejoin="round" strokeWidth="2.8" />
      <path d="M75 91 C84 96 94 97 104 91 C99 101 86 104 72 98 Z" fill="#f7f2e7" stroke={outline} strokeLinejoin="round" strokeWidth="2.5" />
      <path d="M51 58 C43 63 42 73 50 80 C60 77 65 66 51 58 Z" fill={`url(#${id}-fin)`} stroke={outline} strokeLinejoin="round" strokeWidth="3" />
      <path d="M45 43 C55 35 67 33 76 35" fill="none" stroke="#aab4b8" strokeLinecap="round" strokeWidth="3" opacity="0.48" />

      <BennyFace mood={mood} />
    </svg>
  )
}
