import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

export type AquariumMood = 'happy' | 'content' | 'peckish' | 'hungry' | 'very_hungry' | 'sad'
export type AquariumGrowthStage = 'baby' | 'adult'
export type AquariumLeaderboardRange = 'today' | 'yesterday' | 'allTime'

export type AquariumCreature = {
  id: number
  species_id: string
  growth_stage: AquariumGrowthStage
  created_at: string
  updated_at: string
}

export type AquariumEgg = {
  id: number
  species_id: string
  laid_at: string
  hatch_after: string
  hatched_at: string | null
  creature_id: number | null
  completion_id: number | null
  created_at: string
  updated_at: string
}

export type AquariumEvent = {
  id: number
  event_type: 'fed' | 'hatched' | 'mood_reset'
  message: string
  member_name: string | null
  completion_id: number | null
  creature_id: number | null
  created_at: string
}

export type AquariumLeaderboardRow = {
  member_id: number
  member_name: string
  member_avatar_id: string | null
  member_type: string
  completed_count: number
}

export type AquariumYesterdayCompletion = {
  id: number
  member_name: string
  chore_name: string
  completed_at: string
}

export type AquariumMoodDebugCompletion = {
  id: number
  member_id: number
  member_name: string
  member_type: 'adult' | 'child'
  chore_name: string
  feeds_aquarium: number
  completed_at: string
}

export type AquariumMoodDebug = {
  generated_at: string
  time_zone: string
  today: {
    date: string
    start: string
    end: string
  }
  mood: {
    final: AquariumMood
    base: AquariumMood
    uncapped: AquariumMood
    participation_ceiling: AquariumMood | null
  }
  participation: {
    todayChildCount: number
    todayDistinctChildCount: number
    activeChildCount: number
  }
  counted_completions: AquariumMoodDebugCompletion[]
  ignored_completions: AquariumMoodDebugCompletion[]
  rules: {
    chore_count: Array<{ min?: number; count?: number; mood: AquariumMood | 'time_decay' }>
    time_decay_hours: {
      peckish: number
      hungry: number
      very_hungry: number
    }
    mood_rank: Record<AquariumMood, number>
    participation_cap_enabled: boolean
  }
  overrides: {
    everything_good_active: boolean
    everything_good_until: string | null
    panic_active: boolean
    panic_chores_needed: number
    panic_expires_at: string | null
  }
  last_fed_at: string | null
  hours_since_fed: number
}

export type AquariumData = {
  state: {
    food_reserve: number
    starting_food_reserve: number
    max_food_reserve: number
    daily_food_consumption: number
    last_consumed_on: string
    total_chore_completions: number
    creature_unlock_interval: number
    egg_incubation_minutes: number
    growth_days: number
    mood: AquariumMood
    mood_message: string
    last_fed_at: string | null
    hours_since_fed: number
    panic_mode: number
    panic_chores_needed: number
    panic_expires_at: string | null
    everything_good_until: string | null
    fish_text_active_until: string | null
  }
  creatures: AquariumCreature[]
  eggs: AquariumEgg[]
  events: AquariumEvent[]
  leaderboard: {
    today: AquariumLeaderboardRow[]
    yesterday: AquariumLeaderboardRow[]
    allTime: AquariumLeaderboardRow[]
  }
  yesterdayCompletions: AquariumYesterdayCompletion[]
  moodDebug: AquariumMoodDebug
}

type Swimmer = {
  id: number
  x: number
  y: number
  targetX: number
  targetY: number
  speed: number
  facing: 1 | -1
  pauseUntil: number
  moodBoostUntil: number
  bobOffset: number
}

type FeedingFrenzy = {
  startedAt: number
  until: number
  centerX: number
  surfaceY: number
}

type ManualFishHookDrop = {
  startedAt: number
  hasWorm: boolean
}

type FishHookPosition = {
  visible: boolean
  x: number
  y: number
  attraction: number
  hasWorm: boolean
}

type BubbleBurst = {
  id: number
  x: number
  y: number
  size: number
}

type FallingFood = {
  id: number
  x: number
  y: number
  targetY: number
  size: number
  delayMs: number
  driftX: number
}

type AmbientBubble = {
  id: number
  x: number
  size: number
  durationMs: number
}

type FloatingHeart = {
  id: number
  x: number
  y: number
  size: number
  delayMs: number
}

const tankBubbleAudioSources = [
  '/sounds/fish/aquarium-tank-bubble-1.mp3',
  '/sounds/fish/aquarium-tank-bubble-2.mp3',
  '/sounds/fish/aquarium-tank-bubble-3.mp3',
  '/sounds/fish/aquarium-tank-bubble-4.mp3',
]

const fishFeedingAudioSources = [
  '/sounds/fish/fish-feeding-1.mp3',
  '/sounds/fish/fish-feeding-2.mp3',
  '/sounds/fish/fish-feeding-3.mp3',
  '/sounds/fish/fish-feeding-4.mp3',
]

const cellPhoneBuzzAudioSources = [
  '/sounds/fish/cell-phone-buzzing.mp3',
]

const hungryFishAudioSources = [
  '/sounds/fish/hungry-fish-1.mp3',
  '/sounds/fish/hungry-fish-2.mp3',
  '/sounds/fish/hungry-fish-3.mp3',
  '/sounds/fish/hungry-fish-4.mp3',
]

const fishHappyNowAudioSources = [
  '/sounds/fish/fish-happy-now-1.mp3',
]

const fishHookHappyAudioSources = [
  '/sounds/fish/small_creature_happy_%231.mp3',
  '/sounds/fish/small_creature_happy_%232.mp3',
  '/sounds/fish/small_creature_happy_%233.mp3',
  '/sounds/fish/small_creature_happy_%234.mp3',
]

const unlockableAudioSources = [
  ...tankBubbleAudioSources,
  ...fishFeedingAudioSources,
  ...cellPhoneBuzzAudioSources,
  ...hungryFishAudioSources,
  ...fishHappyNowAudioSources,
  ...fishHookHappyAudioSources,
]

const hungryMoods = new Set<AquariumMood>(['hungry', 'very_hungry', 'sad'])

const htmlAudioCache = new Map<string, HTMLAudioElement>()

function getHtmlAudio(source: string) {
  let audio = htmlAudioCache.get(source)
  if (!audio) {
    audio = new Audio(source)
    audio.preload = 'auto'
    htmlAudioCache.set(source, audio)
  }
  return audio
}

function unlockHtmlAudio() {
  for (const source of unlockableAudioSources) {
    const audio = getHtmlAudio(source)
    const originalMuted = audio.muted
    const originalVolume = audio.volume
    audio.muted = true
    audio.volume = 0
    void audio.play()
      .then(() => {
        audio.pause()
        audio.currentTime = 0
        audio.muted = originalMuted
        audio.volume = originalVolume
      })
      .catch(() => {
        audio.muted = originalMuted
        audio.volume = originalVolume
      })
  }
}

function playAudioFrom(sources: string[], volume: number) {
  const source = sources[Math.floor(Math.random() * sources.length)]
  const audio = getHtmlAudio(source)
  audio.pause()
  audio.currentTime = 0
  audio.volume = volume
  audio.muted = false
  void audio.play().catch(() => {
    // Autoplay may be blocked until the tablet is touched once; stay silent.
  })
}

let sharedAudioContext: AudioContext | null = null

function getAudioContext() {
  if (typeof window === 'undefined') return null
  if (!sharedAudioContext) {
    try {
      sharedAudioContext = new AudioContext()
    } catch {
      return null
    }
  }
  if (sharedAudioContext.state === 'suspended') {
    void sharedAudioContext.resume().catch(() => undefined)
  }
  return sharedAudioContext
}

function playFeedChime() {
  const context = getAudioContext()
  if (!context || context.state !== 'running') return

  const now = context.currentTime
  const notes = [523.25, 659.25, 783.99, 1046.5]

  notes.forEach((frequency, index) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const startAt = now + index * 0.09

    oscillator.type = 'triangle'
    oscillator.frequency.setValueAtTime(frequency, startAt)
    gain.gain.setValueAtTime(0, startAt)
    gain.gain.linearRampToValueAtTime(0.16, startAt + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.001, startAt + 0.6)

    oscillator.connect(gain)
    gain.connect(context.destination)
    oscillator.start(startAt)
    oscillator.stop(startAt + 0.65)
  })
}

const aquariumSpecies = ['clownfish', 'seahorse', 'angelfish', 'crab', 'pufferfish', 'starfish', 'clam'] as const

const speciesLabels: Record<string, string> = {
  clownfish: 'Clownfish',
  angelfish: 'Angelfish',
  seahorse: 'Seahorse',
  crab: 'Crab',
  pufferfish: 'Pufferfish',
  starfish: 'Starfish',
  clam: 'Clam',
}

const moodLabels: Record<AquariumMood, string> = {
  happy: '😄 HAPPY',
  content: '🙂 CONTENT',
  peckish: '😐 PECKISH',
  hungry: '😟 HUNGRY',
  very_hungry: '😫 VERY HUNGRY',
  sad: '🚨 STARVING',
}

const moodSpeed: Record<AquariumMood, number> = {
  happy: 1.12,
  content: 0.88,
  peckish: 0.76,
  hungry: 0.68,
  very_hungry: 0.48,
  sad: 0.28,
}

const fishHookCycleMs = 15 * 60_000
const fishHookLowerMs = 3_600
const fishHookHoldMs = 20_000
const fishHookRetractMs = 3_400

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function getCreatureSize(creature: AquariumCreature, tankWidth: number) {
  const baseSize = creature.growth_stage === 'adult' ? 110 : 74
  const responsiveSize = tankWidth > 0 ? tankWidth * (creature.growth_stage === 'adult' ? 0.12 : 0.085) : baseSize
  const size = Math.round(Math.min(Math.max(responsiveSize, baseSize * 0.82), baseSize * 1.22))
  // The clam is a chunky bottom-dweller — a touch bigger than the fish.
  if (creature.species_id === 'clam') return Math.round(size * 1.14)
  return size
}

function pickTarget(width: number, height: number, spriteSize: number) {
  const left = spriteSize * 0.7
  const right = Math.max(left, width - spriteSize * 0.7)
  const top = spriteSize * 0.9
  const bottom = Math.max(top, height - spriteSize * 1.35)

  return {
    x: randomBetween(left, right),
    y: randomBetween(top, bottom),
  }
}

function displaySpecies(speciesId: string) {
  return speciesLabels[speciesId] ?? 'Aquarium friend'
}

function formatPercent(value: number, max: number) {
  if (max <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)))
}

function formatLastFed(hoursSinceFed: number) {
  if (hoursSinceFed <= 1) return 'less than an hour ago'
  if (hoursSinceFed < 24) return `${hoursSinceFed} hours ago`
  const days = Math.floor(hoursSinceFed / 24)
  return `${days} day${days === 1 ? '' : 's'} ago`
}

function formatDiscoveryDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}Z`))
}

export function AquariumView({
  aquarium,
  onRecord,
  onFriends,
  onPanic,
  onEverythingGood,
  onTextMode,
  onDebug,
  textModeSubmitting,
  fishTextActiveUntil,
  testMode,
}: {
  aquarium: AquariumData | null
  fishTextActiveUntil: string | null
  onRecord: () => void
  onFriends: () => void
  onPanic: () => void
  onEverythingGood: () => void
  onTextMode: () => void
  onDebug: () => void
  textModeSubmitting: boolean
  testMode: boolean
}) {
  const [leaderboardRange, setLeaderboardRange] = useState<AquariumLeaderboardRange>('today')
  const testFeedHandlerRef = useRef<() => void>(() => undefined)
  const testHookHandlerRef = useRef<() => void>(() => undefined)
  const setTestFeedHandler = useCallback((handler: () => void) => {
    testFeedHandlerRef.current = handler
  }, [])
  const setTestHookHandler = useCallback((handler: () => void) => {
    testHookHandlerRef.current = handler
  }, [])

  if (!aquarium) {
    return (
      <section className="screen aquarium-screen">
        <section className="aquarium-loading-panel">
          <h1>Family Aquarium</h1>
          <p>Filling the tank...</p>
        </section>
      </section>
    )
  }

  const foodPercent = formatPercent(aquarium.state.food_reserve, aquarium.state.max_food_reserve)
  const leaderboard = aquarium.leaderboard[leaderboardRange] ?? []
  const pendingEggs = aquarium.eggs ?? []
  const milestoneRemainder = aquarium.state.total_chore_completions % aquarium.state.creature_unlock_interval
  const nextMilestoneRemaining =
    milestoneRemainder === 0
      ? aquarium.state.creature_unlock_interval
      : aquarium.state.creature_unlock_interval - milestoneRemainder
  const displayCreatures = aquarium.creatures.length > 0 ? aquarium.creatures : [starterClownfish]
  const lastFed = formatLastFed(aquarium.state.hours_since_fed)

  return (
    <section className={`screen aquarium-screen aquarium-mood-${aquarium.state.mood}`}>
      <section className="aquarium-stage">
        <AquariumScene
          creatures={displayCreatures}
          eggs={pendingEggs}
          mood={aquarium.state.mood}
          events={aquarium.events}
          fishTextActiveUntil={fishTextActiveUntil}
          onTestFeedReady={setTestFeedHandler}
          onTestHookReady={setTestHookHandler}
        />
        {testMode && (
          <div className="aquarium-test-actions">
            <button type="button" className="secondary-action" onClick={() => testFeedHandlerRef.current()}>
              Test feed fish
            </button>
            <button type="button" className="secondary-action" onClick={() => testHookHandlerRef.current()}>
              Test fish hook
            </button>
          </div>
        )}

        <div className="aquarium-status-strip" aria-live="polite">
          <div>
            <span>Mood</span>
            <strong>{moodLabels[aquarium.state.mood]}</strong>
          </div>
          <div>
            <span>Nursery</span>
            <strong>{foodPercent}%</strong>
          </div>
          <div>
            <span>Friends</span>
            <strong>{aquarium.creatures.length + pendingEggs.length}</strong>
          </div>
        </div>
      </section>

      <aside className="aquarium-side-panel">
        <section className="aquarium-summary">
          <h1>{moodLabels[aquarium.state.mood]}</h1>
          <p>{aquarium.state.mood_message}</p>
          <p>Last fed {lastFed}.</p>
        </section>

        <section className="aquarium-food-card">
          <div className="aquarium-card-heading">
            <h2>🐠 Nursery</h2>
            <strong>{foodPercent}% Full</strong>
          </div>
          <div className="aquarium-food-meter" aria-label={`Nursery ${foodPercent}% full`}>
            <span style={{ width: `${foodPercent}%` }} />
          </div>
          <p>
            {nextMilestoneRemaining} chore{nextMilestoneRemaining === 1 ? '' : 's'} until the next friend arrives.
          </p>
        </section>

        {pendingEggs.length > 0 && (
          <section className="aquarium-egg-card">
            <h2>Egg watch</h2>
            <div className="aquarium-event-list">
              {pendingEggs.map((egg) => (
                <span key={egg.id}>
                  A {displaySpecies(egg.species_id).toLowerCase()} egg is wiggling.
                </span>
              ))}
            </div>
          </section>
        )}

        <section className="aquarium-leaderboard">
          <div className="aquarium-card-heading">
            <h2>Family helpers</h2>
            <div className="segmented-control compact-segmented" aria-label="Leaderboard range">
              <button
                type="button"
                className={leaderboardRange === 'today' ? 'selected' : ''}
                onClick={() => setLeaderboardRange('today')}
              >
                Today
              </button>
              <button
                type="button"
                className={leaderboardRange === 'yesterday' ? 'selected' : ''}
                onClick={() => setLeaderboardRange('yesterday')}
              >
                Yesterday
              </button>
              <button
                type="button"
                className={leaderboardRange === 'allTime' ? 'selected' : ''}
                onClick={() => setLeaderboardRange('allTime')}
              >
                All Time
              </button>
            </div>
          </div>
          <div className="aquarium-helper-list">
            {leaderboard.map((helper, index) => (
              <span key={helper.member_id} className="aquarium-helper-row">
                <strong>{index + 1}. {helper.member_name}</strong>
                <span>{helper.completed_count}</span>
              </span>
            ))}
          </div>
        </section>

        <section className="aquarium-event-card">
          <h2>Latest ripples</h2>
          <div className="aquarium-event-list">
            {aquarium.events.length === 0 && <p>No feedings yet.</p>}
            {aquarium.events.slice(0, 3).map((event) => (
              <span key={event.id}>{event.message}</span>
            ))}
          </div>
        </section>

        <button type="button" className="primary-action aquarium-record-action" onClick={onRecord}>
          Record a chore
        </button>
        <button type="button" className="secondary-action aquarium-record-action" onClick={onFriends}>
          Aquarium friends
        </button>
        <button type="button" className="danger-action aquarium-record-action" onClick={onPanic}>
          {aquarium.state.panic_mode ? `🚨 Panic active — ${aquarium.state.panic_chores_needed} chore${aquarium.state.panic_chores_needed === 1 ? '' : 's'} to go` : '🚨 Panic mode'}
        </button>
        <button type="button" className="secondary-action aquarium-record-action" onClick={onEverythingGood}>
          {aquarium.state.everything_good_until ? '✅ Everything good active' : '✅ Everything good'}
        </button>
        {testMode && (
          <button type="button" className="secondary-action aquarium-text-action" onClick={onTextMode} disabled={textModeSubmitting}>
            {textModeSubmitting ? 'Texting' : 'Test Text'}
          </button>
        )}
        <button type="button" className="aquarium-debug-link" onClick={onDebug}>
          Fish mood math
        </button>
      </aside>
    </section>
  )
}

export function AquariumFriendsView({
  aquarium,
}: {
  aquarium: AquariumData | null
}) {
  const discoveredSpecies = new Set(aquarium?.creatures.map((creature) => creature.species_id) ?? [])
  const creaturesBySpecies = new Map<string, AquariumCreature[]>()

  for (const creature of aquarium?.creatures ?? []) {
    creaturesBySpecies.set(creature.species_id, [...(creaturesBySpecies.get(creature.species_id) ?? []), creature])
  }

  return (
    <section className="screen aquarium-friends-screen">
      <div className="screen-heading">
        <p className="eyebrow">Family Aquarium</p>
        <h1>Aquarium friends</h1>
      </div>

      <div className="aquarium-friends-grid">
        {aquariumSpecies.map((speciesId) => {
          const discovered = discoveredSpecies.has(speciesId)
          const creatures = creaturesBySpecies.get(speciesId) ?? []
          const newestCreature = creatures[creatures.length - 1]

          return (
            <article key={speciesId} className={`aquarium-friend-card${discovered ? '' : ' locked'}`}>
              <div className="aquarium-friend-art">
                {discovered ? <CreatureArt speciesId={speciesId} mood="content" /> : <span>?</span>}
              </div>
              <div>
                <h2>{discovered ? displaySpecies(speciesId) : 'Undiscovered friend'}</h2>
                {discovered ? (
                  <p>
                    {creatures.length} discovered · newest is {newestCreature?.growth_stage ?? 'baby'} ·{' '}
                    {newestCreature ? formatDiscoveryDate(newestCreature.created_at) : 'recently found'}
                  </p>
                ) : (
                  <p>Keep feeding the aquarium to discover this friend.</p>
                )}
              </div>
            </article>
          )
        })}
      </div>
    </section>
  )
}

const starterClownfish: AquariumCreature = {
  id: 1,
  species_id: 'clownfish',
  growth_stage: 'baby',
  created_at: '',
  updated_at: '',
}

function AquariumScene({
  creatures,
  eggs,
  mood,
  events,
  fishTextActiveUntil,
  onTestFeedReady,
  onTestHookReady,
}: {
  creatures: AquariumCreature[]
  eggs: AquariumEgg[]
  mood: AquariumMood
  events: AquariumEvent[]
  fishTextActiveUntil: string | null
  onTestFeedReady: (handler: () => void) => void
  onTestHookReady: (handler: () => void) => void
}) {
  const tankRef = useRef<HTMLDivElement | null>(null)
  const phoneRef = useRef<HTMLDivElement | null>(null)
  const hookRef = useRef<HTMLDivElement | null>(null)
  const spriteRefs = useRef(new Map<number, HTMLDivElement>())
  const swimmersRef = useRef(new Map<number, Swimmer>())
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)
  const latestEventIdRef = useRef<number | null>(null)
  const fishTextActiveUntilRef = useRef<number | null>(null)
  const fishTextWasActiveRef = useRef(false)
  const feedingFrenzyRef = useRef<FeedingFrenzy | null>(null)
  const manualFishHookRef = useRef<ManualFishHookDrop | null>(null)
  const hookHappySoundPlayedRef = useRef(false)
  const bubbleTimeoutsRef = useRef<number[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [bursts, setBursts] = useState<BubbleBurst[]>([])
  const [food, setFood] = useState<FallingFood[]>([])
  const [ambientBubbles, setAmbientBubbles] = useState<AmbientBubble[]>([])
  const [hearts, setHearts] = useState<FloatingHeart[]>([])
  const [feedNotice, setFeedNotice] = useState('')

  // Browsers block audio until the page is touched once; warming the audio
  // context and MP3 elements on first interaction makes delayed sounds work.
  useEffect(() => {
    const unlock = () => {
      getAudioContext()
      unlockHtmlAudio()
    }
    window.addEventListener('pointerdown', unlock, { passive: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    const activeUntil = fishTextActiveUntil ? parseUtcLikeTimestamp(fishTextActiveUntil) : null
    const isActive = activeUntil !== null && Date.now() < activeUntil
    fishTextActiveUntilRef.current = activeUntil
    if (isActive && !fishTextWasActiveRef.current) {
      playAudioFrom(cellPhoneBuzzAudioSources, 0.42)
    }
    fishTextWasActiveRef.current = isActive
  }, [fishTextActiveUntil])

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      playAudioFrom(tankBubbleAudioSources, 0.18)
    }, 7 * 60 * 1000)

    return () => window.clearInterval(intervalId)
  }, [])

  // Hungry fish calls stay sparse so the shared display does not get noisy.
  useEffect(() => {
    if (!hungryMoods.has(mood)) return undefined

    const intervalId = window.setInterval(() => {
      playAudioFrom(hungryFishAudioSources, 0.32)
    }, 8 * 60 * 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [mood])

  useEffect(() => {
    if (!tankRef.current) return undefined

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width)
      const height = Math.floor(entry.contentRect.height)
      setSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    })

    observer.observe(tankRef.current)
    return () => observer.disconnect()
  }, [])

  const startFeedingAnimation = useCallback((message: string, seedId: number) => {
    if (size.width <= 0 || size.height <= 0) return

    const centerX = randomBetween(size.width * 0.38, size.width * 0.62)
    const surfaceY = Math.max(34, size.height * 0.12)
    const now = performance.now()
    feedingFrenzyRef.current = {
      startedAt: now,
      until: now + 5600,
      centerX,
      surfaceY,
    }

    setFeedNotice(message)
    playAudioFrom(fishFeedingAudioSources, 0.48)
    const noticeTimeout = window.setTimeout(() => setFeedNotice(''), 3600)
    bubbleTimeoutsRef.current.push(noticeTimeout)
    const happySoundTimeout = window.setTimeout(() => {
      playAudioFrom(fishHappyNowAudioSources, 0.44)
    }, 9000)
    bubbleTimeoutsRef.current.push(happySoundTimeout)

    const foodDrops = Array.from({ length: 34 }, (_, index) => ({
      id: seedId * 1000 + index,
      x: centerX + randomBetween(-size.width * 0.24, size.width * 0.24),
      y: randomBetween(-26, 24),
      targetY: randomBetween(size.height * 0.14, size.height * 0.38),
      size: randomBetween(5, 10),
      delayMs: index * 34 + randomBetween(0, 110),
      driftX: randomBetween(-34, 34),
    }))
    setFood((current) => [...current, ...foodDrops].slice(-70))

    for (const swimmer of swimmersRef.current.values()) {
      swimmer.targetX = centerX + randomBetween(-size.width * 0.18, size.width * 0.18)
      swimmer.targetY = surfaceY + randomBetween(0, size.height * 0.16)
      swimmer.pauseUntil = 0
      swimmer.moodBoostUntil = now + 5800
      swimmer.speed = randomBetween(0.12, 0.18)
    }

    const foodTimeout = window.setTimeout(() => {
      setFood((current) => current.filter((item) => !foodDrops.some((drop) => drop.id === item.id)))
    }, 5200)
    bubbleTimeoutsRef.current.push(foodTimeout)
  }, [size.height, size.width])

  useEffect(() => {
    onTestFeedReady(() => startFeedingAnimation('Test feeding time!', Date.now()))
    return () => onTestFeedReady(() => undefined)
  }, [onTestFeedReady, startFeedingAnimation])

  const startFishHookTest = useCallback(() => {
    manualFishHookRef.current = {
      startedAt: performance.now(),
      hasWorm: Math.random() < 0.2,
    }
  }, [])

  useEffect(() => {
    onTestHookReady(startFishHookTest)
    return () => onTestHookReady(() => undefined)
  }, [onTestHookReady, startFishHookTest])

  useEffect(() => {
    const eventIds = events.map((event) => event.id)
    if (eventIds.length === 0 || size.width <= 0 || size.height <= 0) return

    const newestId = Math.max(...eventIds)
    if (latestEventIdRef.current === null) {
      latestEventIdRef.current = newestId
      return
    }

    const newEvents = events.filter((event) => event.id > (latestEventIdRef.current ?? 0))
    latestEventIdRef.current = newestId

    if (newEvents.length === 0) return

    const newBursts = newEvents.filter((event) => event.event_type !== 'fed').flatMap((event) =>
      Array.from({ length: event.event_type === 'hatched' ? 18 : 10 }, (_, index) => ({
        id: event.id * 100 + index,
        x: randomBetween(size.width * 0.18, size.width * 0.82),
        y: randomBetween(size.height * 0.35, size.height * 0.84),
        size: randomBetween(10, event.event_type === 'hatched' ? 26 : 20),
      })),
    )

    const latestFedEvent = newEvents.find((event) => event.event_type === 'fed')
    if (latestFedEvent) {
      startFeedingAnimation(latestFedEvent.message, latestFedEvent.id)
    }

    const latestResetEvent = newEvents.find((event) => event.event_type === 'mood_reset')
    if (latestResetEvent) {
      setFeedNotice('The fish are happy again! 🎉')
      playFeedChime()
      const noticeTimeout = window.setTimeout(() => setFeedNotice(''), 4200)
      bubbleTimeoutsRef.current.push(noticeTimeout)

      const celebrationHearts = Array.from({ length: 16 }, (_, index) => ({
        id: latestResetEvent.id * 10_000 + index + 50_000,
        x: randomBetween(size.width * 0.08, size.width * 0.92),
        y: randomBetween(size.height * 0.18, size.height * 0.82),
        size: randomBetween(18, 38),
        delayMs: index * 110,
      }))
      setHearts((current) => [...current, ...celebrationHearts].slice(-24))
      const heartsTimeout = window.setTimeout(() => {
        setHearts((current) => current.filter((heart) => !celebrationHearts.some((ch) => ch.id === heart.id)))
      }, 4500)
      bubbleTimeoutsRef.current.push(heartsTimeout)

      for (const swimmer of swimmersRef.current.values()) {
        swimmer.moodBoostUntil = performance.now() + 6000
      }
    }

    if (newBursts.length > 0) {
      setBursts((current) => [...current, ...newBursts].slice(-36))
      const timeoutId = window.setTimeout(() => {
        setBursts((current) => current.filter((burst) => !newBursts.some((newBurst) => newBurst.id === burst.id)))
      }, 2600)
      bubbleTimeoutsRef.current.push(timeoutId)
    }
  }, [events, size.height, size.width, startFeedingAnimation])

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return undefined

    const activeIds = new Set(creatures.map((creature) => creature.id))
    for (const id of swimmersRef.current.keys()) {
      if (!activeIds.has(id)) swimmersRef.current.delete(id)
    }

    for (const creature of creatures) {
      if (swimmersRef.current.has(creature.id)) continue

      const spriteSize = getCreatureSize(creature, size.width)
      const start = pickCreatureTarget(creature, size.width, size.height, spriteSize)
      const target = pickCreatureTarget(creature, size.width, size.height, spriteSize)
      swimmersRef.current.set(creature.id, {
        id: creature.id,
        x: start.x,
        y: start.y,
        targetX: target.x,
        targetY: target.y,
        speed: randomBetween(0.018, 0.042),
        facing: target.x >= start.x ? 1 : -1,
        pauseUntil: 0,
        moodBoostUntil: 0,
        bobOffset: randomBetween(0, Math.PI * 2),
      })
    }

    const tick = (time: number) => {
      const lastTime = lastTimeRef.current || time
      const delta = Math.min(time - lastTime, 48)
      lastTimeRef.current = time

      const phone = phoneRef.current
      const phoneUntilMs = fishTextActiveUntilRef.current
      const fishTextActive = phoneUntilMs !== null && Date.now() < phoneUntilMs
      const phoneSize = getPhoneBubbleSize(size.width)
      const phonePosition = fishTextActive
        ? getPhoneTextPosition(size.width, size.height, phoneSize, phoneUntilMs, time)
        : null
      if (manualFishHookRef.current && time - manualFishHookRef.current.startedAt >= fishHookLowerMs + fishHookHoldMs + fishHookRetractMs) {
        manualFishHookRef.current = null
      }
      const hookPosition = getFishHookPosition(size.width, size.height, time, manualFishHookRef.current)
      const hook = hookRef.current
      const feedingFrenzy = feedingFrenzyRef.current && time < feedingFrenzyRef.current.until ? feedingFrenzyRef.current : null
      if (feedingFrenzyRef.current && time >= feedingFrenzyRef.current.until) {
        feedingFrenzyRef.current = null
      }
      if (hookPosition.visible && hookPosition.hasWorm) {
        if (!hookHappySoundPlayedRef.current) {
          playAudioFrom(fishHookHappyAudioSources, 0.42)
          hookHappySoundPlayedRef.current = true
        }
      } else {
        hookHappySoundPlayedRef.current = false
      }

      if (phone && phonePosition) {
        const jitterX = Math.sin(time / 22) * 3.2
        const jitterRotation = Math.sin(time / 18) * 5
        phone.classList.add('texting')
        phone.style.width = `${phoneSize}px`
        phone.style.height = `${phoneSize}px`
        phone.style.transform = `translate3d(${phonePosition.x - phoneSize / 2 + jitterX}px, ${phonePosition.y - phoneSize / 2}px, 0) rotate(${jitterRotation}deg)`
      } else if (phone) {
        phone.classList.remove('texting')
        phone.style.removeProperty('width')
        phone.style.removeProperty('height')
        phone.style.removeProperty('transform')
      }

      if (hook && hookPosition.visible) {
        hook.classList.add('lowered')
        hook.classList.toggle('baited', hookPosition.hasWorm)
        hook.style.height = `${Math.max(0, hookPosition.y)}px`
        hook.style.transform = `translate3d(${hookPosition.x - 22}px, 0, 0)`
      } else if (hook) {
        hook.classList.remove('lowered')
        hook.classList.remove('baited')
        hook.style.removeProperty('height')
        hook.style.removeProperty('transform')
      }

      for (const [index, creature] of creatures.entries()) {
        const swimmer = swimmersRef.current.get(creature.id)
        const sprite = spriteRefs.current.get(creature.id)
        if (!swimmer || !sprite) continue
        const creatureArt = sprite.firstElementChild instanceof HTMLElement ? sprite.firstElementChild : null

        if (creature.species_id === 'clam') {
          // The clam is rooted to the sea floor: no swimming, no flipping, no
          // wiggling. It just sits where it settled and runs its own open/close
          // and googly-eye animation internally.
          const clamSize = getCreatureSize(creature, size.width)
          sprite.style.width = `${clamSize}px`
          sprite.style.height = `${clamSize}px`
          sprite.style.transform = `translate3d(${swimmer.x - clamSize / 2}px, ${swimmer.y - clamSize / 2}px, 0)`
          if (creatureArt) creatureArt.style.transform = 'none'
          continue
        }

        const spriteSize = getCreatureSize(creature, size.width)
        const canJoinFeeding = creature.species_id !== 'crab'
        if (feedingFrenzy && canJoinFeeding) {
          const feedingTarget = getFeedingFrenzyTarget(feedingFrenzy, index, creatures.length, spriteSize, size.width, size.height, time)
          swimmer.targetX = feedingTarget.x
          swimmer.targetY = feedingTarget.y
          swimmer.pauseUntil = 0

          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const step = Math.min(distance, Math.max(0.72, swimmer.speed * 7.4) * delta)
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            swimmer.facing = dx >= 0 ? 1 : -1
          }
          swimmer.moodBoostUntil = time + 280
        } else if (phonePosition) {
          const huddle = getPhoneHuddleTarget(phonePosition, index, creatures.length, spriteSize, phoneSize, time)
          swimmer.targetX = Math.min(Math.max(huddle.x, spriteSize * 0.55), size.width - spriteSize * 0.55)
          swimmer.targetY = Math.min(Math.max(huddle.y, spriteSize * 0.62), size.height - spriteSize * 0.9)
          swimmer.pauseUntil = 0

          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const step = Math.min(distance, Math.max(0.088, swimmer.speed * 3.1) * delta)
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            swimmer.facing = dx >= 0 ? 1 : -1
          }
          swimmer.moodBoostUntil = time + 240
        } else if (creature.species_id !== 'crab' && hookPosition.visible && hookPosition.attraction > 0) {
          const huddle = getFishHookCuriousTarget(hookPosition, index, creatures.length, spriteSize, time)
          swimmer.targetX = Math.min(Math.max(huddle.x, spriteSize * 0.55), size.width - spriteSize * 0.55)
          swimmer.targetY = Math.min(Math.max(huddle.y, spriteSize * 0.62), size.height - spriteSize * 0.9)
          swimmer.pauseUntil = 0

          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const step = Math.min(distance, Math.max(0.062, swimmer.speed * 2.35) * delta * hookPosition.attraction)
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            swimmer.facing = dx >= 0 ? 1 : -1
          }
          swimmer.moodBoostUntil = time + 160
        } else if (time >= swimmer.pauseUntil) {
          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)

          if (distance < 5) {
            const next = pickCreatureTarget(creature, size.width, size.height, spriteSize)
            swimmer.targetX = next.x
            swimmer.targetY = next.y
            swimmer.facing = next.x >= swimmer.x ? 1 : -1
            swimmer.speed = randomBetween(0.018, 0.042)
            if (creature.species_id === 'crab') {
              // Crabs settle in and hang out, lingering much longer when
              // they've reached one of the algae clusters at the edges.
              const nearAlgae = swimmer.x < size.width * 0.2 || swimmer.x > size.width * 0.8
              swimmer.pauseUntil = time + (nearAlgae ? randomBetween(3200, 6000) : randomBetween(900, 2000))
            } else {
              swimmer.pauseUntil = time + randomBetween(mood === 'sad' ? 520 : 120, mood === 'happy' ? 700 : 1500)
            }
          } else {
            const boost = time < swimmer.moodBoostUntil ? 1.8 : 1
            const step = swimmer.speed * moodSpeed[mood] * boost * delta
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            if (creature.species_id === 'seahorse') {
              swimmer.y += Math.sin(time / 850 + swimmer.bobOffset) * 0.08 * delta
            }
            swimmer.facing = dx >= 0 ? 1 : -1
          }
        }

        sprite.style.width = `${spriteSize}px`
        sprite.style.height = `${spriteSize}px`
        const floatY = creature.species_id === 'seahorse' ? Math.sin(time / 900 + swimmer.bobOffset) * 8 : 0
        const feedingTilt = feedingFrenzy && canJoinFeeding ? -45 + Math.sin(time / 90 + swimmer.bobOffset) * 8 : 0
        const wiggle = time < swimmer.moodBoostUntil ? Math.sin(time / (feedingFrenzy ? 58 : 140) + swimmer.bobOffset) * (feedingFrenzy ? 10 : 5) : 0
        const droop = mood === 'sad' ? 9 : mood === 'very_hungry' ? 4 : 0
        sprite.style.transform = `translate3d(${swimmer.x - spriteSize / 2}px, ${swimmer.y - spriteSize / 2 + floatY}px, 0)`
        if (creatureArt) {
          creatureArt.style.transform = `scaleX(${swimmer.facing}) rotate(${feedingTilt + wiggle + droop}deg)`
        }
      }

      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)
    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }
    }
  }, [creatures, mood, size.height, size.width])

  useEffect(() => {
    if (size.width <= 0) return undefined

    const bubbleInterval = window.setInterval(() => {
      const bubble: AmbientBubble = {
        id: Date.now() + Math.round(Math.random() * 1000),
        x: randomBetween(size.width * 0.08, size.width * 0.92),
        size: randomBetween(7, 18),
        durationMs: randomBetween(4200, 7200),
      }
      setAmbientBubbles((current) => [...current, bubble].slice(-18))
      const timeoutId = window.setTimeout(() => {
        setAmbientBubbles((current) => current.filter((item) => item.id !== bubble.id))
      }, bubble.durationMs)
      bubbleTimeoutsRef.current.push(timeoutId)
    }, 1800)

    return () => window.clearInterval(bubbleInterval)
  }, [size.width])

  useEffect(
    () => () => {
      for (const timeoutId of bubbleTimeoutsRef.current) {
        window.clearTimeout(timeoutId)
      }
    },
    [],
  )

  const creatureSummary = useMemo(
    () => creatures.map((creature) => `${creature.growth_stage} ${displaySpecies(creature.species_id)}`).join(', '),
    [creatures],
  )

  return (
    <div ref={tankRef} className="aquarium-tank" aria-label={`Aquarium with ${creatureSummary}`}>
      <div className="aquarium-light" />
      <div className="aquarium-sand" />
      <div className="aquarium-rock rock-one" />
      <div className="aquarium-rock rock-two" />
      <div className="leafy-plant leafy-plant-tall" aria-hidden="true">
        <TallPlant />
      </div>
      <div className="seaweed seaweed-one"><span /><span /><span /></div>
      <div className="seaweed seaweed-two"><span /><span /><span /></div>
      <div className="bubble-stream stream-one"><span /><span /><span /><span /></div>
      <div className="bubble-stream stream-two"><span /><span /><span /></div>
      <div ref={hookRef} className="aquarium-fish-hook" aria-hidden="true">
        <span className="fish-hook-line" />
        <svg className="fish-hook-art" viewBox="0 0 54 64" aria-hidden="true">
          <path className="fish-hook-shank" d="M28 5 C28 16 25 28 21 39" />
          <path className="fish-hook-bend" d="M21 39 C16 53 29 63 42 54 C49 49 48 39 39 36" />
          <path className="fish-hook-point" d="M39 36 L47 29" />
          <path className="fish-hook-barb" d="M39 36 L33 35" />
          <circle className="fish-hook-eye" cx="28" cy="5" r="3.6" />
          <circle className="fish-hook-glint" cx="42" cy="49" r="2.8" />
          <g className="fish-hook-worm">
            <path className="worm-body" d="M22 34 C29 27 40 27 47 34 C53 40 50 49 42 50 C36 51 30 47 29 42 C28 38 30 35 34 34 C37 33 40 35 42 38" />
            <circle className="worm-face" cx="47" cy="36" r="5" />
            <circle className="worm-eye" cx="45.4" cy="34.9" r="0.9" />
            <circle className="worm-eye" cx="48.8" cy="34.9" r="0.9" />
            <path className="worm-smile" d="M44.7 37.5 Q47.1 40 49.7 37.5" />
          </g>
        </svg>
      </div>

      {feedNotice && <div className="aquarium-feed-notice">{feedNotice}</div>}

      <AquariumPhoneBubble
        nodeRef={(node) => {
          phoneRef.current = node
        }}
      />

      {creatures.map((creature) => (
        <div
          key={creature.id}
          ref={(node) => {
            if (node) {
              spriteRefs.current.set(creature.id, node)
            } else {
              spriteRefs.current.delete(creature.id)
            }
          }}
          className={`aquarium-creature aquarium-creature-${creature.species_id}`}
          aria-label={`${creature.growth_stage} ${displaySpecies(creature.species_id)}`}
        >
          <div className="aquarium-creature-art">
            <CreatureArt speciesId={creature.species_id} mood={mood} />
          </div>
        </div>
      ))}

      {eggs.map((egg) => (
        <div key={egg.id} className="aquarium-egg" aria-label={`${displaySpecies(egg.species_id)} egg`}>
          <span />
        </div>
      ))}

      {food.map((drop) => (
        <span
          key={drop.id}
          className="aquarium-food-particle"
          style={
            {
              left: drop.x,
              top: drop.y,
              '--food-target-y': `${drop.targetY - drop.y}px`,
              '--food-drift-x': `${drop.driftX}px`,
              width: drop.size,
              height: drop.size,
              animationDelay: `${drop.delayMs}ms`,
            } as CSSProperties
          }
        />
      ))}

      {hearts.map((heart) => (
        <span
          key={heart.id}
          className="aquarium-heart"
          style={
            {
              left: heart.x,
              top: heart.y,
              fontSize: heart.size,
              animationDelay: `${heart.delayMs}ms`,
            } as CSSProperties
          }
        >
          ♥
        </span>
      ))}

      {bursts.map((burst) => (
        <span
          key={burst.id}
          className="aquarium-burst-bubble"
          style={
            {
              left: burst.x,
              top: burst.y,
              width: burst.size,
              height: burst.size,
            } as CSSProperties
          }
        />
      ))}

      {ambientBubbles.map((bubble) => (
        <span
          key={bubble.id}
          className="aquarium-random-bubble"
          style={
            {
              left: bubble.x,
              bottom: randomBetween(8, 18),
              width: bubble.size,
              height: bubble.size,
              animationDuration: `${bubble.durationMs}ms`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  )
}

function pickCreatureTarget(creature: AquariumCreature, width: number, height: number, spriteSize: number) {
  if (creature.species_id === 'crab') {
    // The crab walks along the sandy floor and likes to amble over to the
    // algae/seaweed on the left (~5%) and right (~6%) edges to hang out.
    const minX = spriteSize * 0.7
    const maxX = Math.max(minX, width - spriteSize * 0.7)
    const clampX = (value: number) => Math.min(Math.max(value, minX), maxX)
    const floorY = randomBetween(height * 0.8, height * 0.86)
    const roll = Math.random()

    if (roll < 0.45) {
      // Left algae cluster.
      return { x: clampX(width * 0.1 + randomBetween(-spriteSize * 0.15, spriteSize * 0.35)), y: floorY }
    }
    if (roll < 0.9) {
      // Right algae cluster.
      return { x: clampX(width * 0.9 + randomBetween(-spriteSize * 0.35, spriteSize * 0.15)), y: floorY }
    }
    // Occasionally wander the open floor between the plants.
    return { x: randomBetween(minX, maxX), y: floorY }
  }

  if (creature.species_id === 'clam') {
    // The clam settles onto the sandy floor and stays put, parked between the
    // plants rather than tucked against the algae at the very edges.
    const minX = spriteSize * 0.8
    const maxX = Math.max(minX, width - spriteSize * 0.8)
    const x = randomBetween(width * 0.3, width * 0.7)
    return { x: Math.min(Math.max(x, minX), maxX), y: height * 0.85 }
  }

  if (creature.species_id === 'seahorse') {
    const target = pickTarget(width, height, spriteSize)
    return { ...target, y: Math.max(spriteSize, target.y - randomBetween(18, 70)) }
  }

  return pickTarget(width, height, spriteSize)
}

function parseUtcLikeTimestamp(value: string) {
  return Date.parse(value.includes('T') ? value : `${value.replace(' ', 'T')}Z`)
}

function getPhoneBubbleSize(tankWidth: number) {
  return Math.round(Math.min(Math.max(tankWidth * 0.09, 58), 96))
}

function getPhoneTextPosition(width: number, height: number, phoneSize: number, activeUntilMs: number, time: number) {
  const remainingMs = Math.max(0, activeUntilMs - Date.now())
  const progress = Math.max(0, Math.min(1, 1 - remainingMs / 60_000))
  const drift = progress * Math.PI * 2
  const left = phoneSize * 1.05
  const right = Math.max(left, width - phoneSize * 1.05)
  const top = phoneSize * 1.05
  const bottom = Math.max(top, height * 0.68)
  const x = width * (0.5 + Math.sin(drift) * 0.22 + Math.sin(drift * 2.4) * 0.06)
  const y = height * (0.38 + Math.cos(drift + 0.7) * 0.12 + Math.sin(time / 1900) * 0.025)

  return {
    x: Math.min(Math.max(x, left), right),
    y: Math.min(Math.max(y, top), bottom),
  }
}

function getPhoneHuddleTarget(
  phonePosition: { x: number; y: number },
  index: number,
  creatureCount: number,
  spriteSize: number,
  phoneSize: number,
  time: number,
) {
  const angle = time / 1650 + index * ((Math.PI * 2) / Math.max(1, creatureCount))
  const radius = Math.max(spriteSize * 0.58, phoneSize * 0.72) + (index % 2) * 12

  return {
    x: phonePosition.x + Math.cos(angle) * radius + Math.sin(time / 740 + index) * 7,
    y: phonePosition.y + Math.sin(angle) * radius * 0.7 + Math.cos(time / 820 + index) * 6,
  }
}

function smoothStep(value: number) {
  return value * value * (3 - 2 * value)
}

function getFishHookPosition(width: number, height: number, time: number, manualDrop: ManualFishHookDrop | null = null): FishHookPosition {
  const phase = manualDrop ? time - manualDrop.startedAt : Date.now() % fishHookCycleMs
  const activeMs = fishHookLowerMs + fishHookHoldMs + fishHookRetractMs
  if (phase >= activeMs) {
    return { visible: false, x: 0, y: 0, attraction: 0, hasWorm: false }
  }

  const targetY = height * 0.6
  const x = width * 0.58 + Math.sin(time / 2600) * Math.min(34, width * 0.04)
  let progress = 1

  if (phase < fishHookLowerMs) {
    progress = smoothStep(phase / fishHookLowerMs)
  } else if (phase > fishHookLowerMs + fishHookHoldMs) {
    progress = 1 - smoothStep((phase - fishHookLowerMs - fishHookHoldMs) / fishHookRetractMs)
  }

  return {
    visible: true,
    x,
    y: targetY * progress,
    attraction: manualDrop?.hasWorm ? Math.min(1, progress * 1.35) : 0,
    hasWorm: manualDrop?.hasWorm ?? false,
  }
}

function getFishHookCuriousTarget(
  hookPosition: { x: number; y: number },
  index: number,
  creatureCount: number,
  spriteSize: number,
  time: number,
) {
  const angle = time / 1700 + index * ((Math.PI * 2) / Math.max(1, creatureCount))
  const radius = spriteSize * (0.74 + (index % 3) * 0.12)

  return {
    x: hookPosition.x + Math.cos(angle) * radius + Math.sin(time / 810 + index) * 8,
    y: hookPosition.y + spriteSize * 0.42 + Math.sin(angle) * radius * 0.48 + Math.cos(time / 920 + index) * 7,
  }
}

function getFeedingFrenzyTarget(
  frenzy: FeedingFrenzy,
  index: number,
  creatureCount: number,
  spriteSize: number,
  width: number,
  height: number,
  time: number,
) {
  const elapsed = time - frenzy.startedAt
  const sideSweep = Math.sin(elapsed / 180 + index * 1.7) * Math.min(width * 0.24, 145)
  const orbitAngle = elapsed / 210 + index * ((Math.PI * 2) / Math.max(1, creatureCount))
  const orbitX = Math.cos(orbitAngle) * (spriteSize * 0.32 + (index % 3) * 11)
  const orbitY = Math.sin(orbitAngle) * spriteSize * 0.2
  const minX = spriteSize * 0.58
  const maxX = Math.max(minX, width - spriteSize * 0.58)
  const minY = spriteSize * 0.56
  const maxY = Math.max(minY, height * 0.24)

  return {
    x: Math.min(Math.max(frenzy.centerX + sideSweep + orbitX, minX), maxX),
    y: Math.min(Math.max(frenzy.surfaceY + (index % 4) * 13 + orbitY, minY), maxY),
  }
}

export function CreatureArt({ speciesId, mood }: { speciesId: string; mood: AquariumMood }) {
  if (speciesId === 'angelfish') return <Angelfish mood={mood} />
  if (speciesId === 'seahorse') return <Seahorse mood={mood} />
  if (speciesId === 'crab') return <Crab mood={mood} />
  if (speciesId === 'pufferfish') return <Pufferfish mood={mood} />
  if (speciesId === 'starfish') return <Starfish mood={mood} />
  if (speciesId === 'clam') return <Clam mood={mood} />
  return <Clownfish mood={mood} />
}

function AquariumPhoneBubble({ nodeRef }: { nodeRef: (node: HTMLDivElement | null) => void }) {
  return (
    <div ref={nodeRef} className="aquarium-phone-bubble" role="img" aria-label="A phone floating in a bubble">
      <svg viewBox="0 0 104 104" aria-hidden="true">
        <circle className="phone-bubble-shell" cx="52" cy="52" r="46" />
        <circle className="phone-bubble-shine" cx="36" cy="30" r="12" />
        <rect className="phone-body" x="34" y="19" width="36" height="66" rx="9" />
        <rect className="phone-screen" x="38" y="25" width="28" height="51" rx="5" />
        <rect className="message-app-tile" x="43" y="34" width="18" height="18" rx="5" />
        <path className="message-app-bubble" d="M48 42 C48 39 51 37 54 37 C58 37 61 39 61 42 C61 45 58 47 54 47 L50 50 L51 47 C49 46 48 44 48 42 Z" />
        <circle className="phone-speaker" cx="52" cy="22" r="1.8" />
        <circle className="phone-home" cx="52" cy="80" r="2.5" />
      </svg>
    </div>
  )
}

function Face({ mood, x = 64, y = 50 }: { mood: AquariumMood; x?: number; y?: number }) {
  const mouth =
    mood === 'happy' || mood === 'content'
      ? `M ${x - 9} ${y + 13} Q ${x} ${y + 22} ${x + 9} ${y + 13}`
      : mood === 'sad' || mood === 'very_hungry'
        ? `M ${x - 9} ${y + 20} Q ${x} ${y + 10} ${x + 9} ${y + 20}`
        : `M ${x - 8} ${y + 16} L ${x + 8} ${y + 16}`
  const crying = mood === 'sad' || mood === 'very_hungry'

  return (
    <>
      <g className="creature-eyes">
        <circle cx={x - 16} cy={y} r="4.5" fill="#24313f" />
        <circle cx={x + 16} cy={y} r="4.5" fill="#24313f" />
      </g>
      {crying && (
        <g className="creature-tears">
          <ellipse cx={x - 16} cy={y + 9} rx="2.6" ry="4" fill="#7dd3fc" />
          <ellipse cx={x + 16} cy={y + 9} rx="2.6" ry="4" fill="#7dd3fc" />
        </g>
      )}
      <path d={mouth} fill="none" stroke="#24313f" strokeLinecap="round" strokeWidth="4" />
    </>
  )
}

function Clownfish({ mood }: { mood: AquariumMood }) {
  return (
    <svg viewBox="0 0 128 96" role="img" aria-hidden="true">
      <path d="M12 48 L35 25 L35 71 Z" fill="#f97316" stroke="#0f4d5c" strokeWidth="4" />
      <ellipse cx="68" cy="48" rx="45" ry="30" fill="#fb923c" stroke="#0f4d5c" strokeWidth="4" />
      <path d="M51 22 C43 36 43 60 51 76" fill="none" stroke="#fff7ed" strokeWidth="11" />
      <path d="M84 21 C76 35 76 61 84 77" fill="none" stroke="#fff7ed" strokeWidth="11" />
      <path d="M67 18 C58 8 46 12 43 26" fill="#fdba74" stroke="#0f4d5c" strokeWidth="4" />
      <path d="M68 78 C57 91 46 87 43 72" fill="#fdba74" stroke="#0f4d5c" strokeWidth="4" />
      <Face mood={mood} x={86} y={43} />
    </svg>
  )
}

function Angelfish({ mood }: { mood: AquariumMood }) {
  return (
    <svg viewBox="0 0 128 112" role="img" aria-hidden="true">
      <path d="M19 56 L41 37 L41 75 Z" fill="#7dd3fc" stroke="#164e63" strokeWidth="4" />
      <path d="M53 18 C99 20 116 56 73 97 C48 86 38 58 53 18 Z" fill="#fef08a" stroke="#164e63" strokeWidth="4" />
      <path d="M63 20 C54 45 55 70 67 93" fill="none" stroke="#38bdf8" strokeWidth="7" />
      <path d="M78 27 C70 47 71 65 82 83" fill="none" stroke="#fb7185" strokeWidth="6" />
      <Face mood={mood} x={88} y={52} />
    </svg>
  )
}

function Seahorse({ mood }: { mood: AquariumMood }) {
  // Flat, golden, left-facing seahorse: serrated dorsal ridge, coronet, curled tail.
  const isSad = mood === 'sad' || mood === 'very_hungry'
  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      {/* serrated back ridge */}
      <path d="M74.3 43.6 L82.3 41.9 L77.5 49.8 Z" fill="#f3a838" />
      <path d="M77.9 50.9 L85.6 52.4 L78.9 57.9 Z" fill="#f3a838" />
      <path d="M78.9 59.1 L85.4 63.5 L78.0 66.1 Z" fill="#f3a838" />
      <path d="M77.8 67.3 L82.8 74.0 L76.6 74.2 Z" fill="#f3a838" />
      <path d="M76.3 75.5 L79.5 83.3 L74.5 82.2 Z" fill="#f3a838" />
      <path d="M74.1 83.4 L75.3 91.5 L71.2 89.8 Z" fill="#f3a838" />
      <path d="M70.6 90.9 L70.0 98.5 L66.4 96.5 Z" fill="#f3a838" />
      {/* coronet */}
      <path d="M50.5 32 L55 25 L59.5 32 Z" fill="#f3a838" />
      <path d="M56.5 30 L61 21.5 L65.5 30 Z" fill="#f3a838" />
      <path d="M62.5 32 L67 25 L71.5 32 Z" fill="#f3a838" />
      {/* curled tail (forward curl) */}
      <path d="M68.9 95.2 L69.2 97.4 L69.4 99.6 L69.2 101.7 L68.8 103.8 L68.2 105.8 L67.3 107.7 L66.2 109.5 L64.9 111.1 L63.5 112.6 L61.9 113.8 L60.3 114.8 L58.5 115.7 L56.6 116.3 L54.8 116.6 L52.9 116.8 L51.0 116.7 L49.2 116.4 L47.4 115.9 L45.8 115.2 L44.2 114.3 L42.8 113.2 L41.6 112.0 L40.5 110.7 L39.6 109.3 L38.9 107.8 L38.3 106.3 L38.0 104.7 L37.8 103.1 L37.9 101.5 L38.1 100.0 L38.5 98.5 L39.1 97.1 L39.8 95.8 L40.6 94.6 L41.6 93.6 L42.7 92.7 L43.8 91.9 L45.0 91.3 L46.3 90.8 L47.6 90.5 L48.9 90.4 L50.2 90.4 L51.4 90.6 L52.6 90.9 L53.7 91.4 L54.8 91.9 L55.7 92.6 L56.5 93.4 L57.3 94.2 L57.9 95.1 L58.4 96.1 L58.7 97.1 L58.9 98.1 L59.0 99.1 L59.0 100.1 L58.9 101.0 L58.6 101.9 L58.3 102.7 L57.8 103.5 L57.3 104.2 L56.7 104.8 L56.1 105.4 L55.4 105.8 L54.7 106.1 L51.9 102.2 L52.1 102.2 L52.3 102.1 L52.6 102.0 L52.8 101.9 L53.0 101.7 L53.2 101.5 L53.3 101.3 L53.5 101.0 L53.6 100.7 L53.6 100.4 L53.7 100.0 L53.6 99.7 L53.6 99.3 L53.4 98.9 L53.3 98.6 L53.0 98.2 L52.7 97.9 L52.4 97.6 L52.0 97.3 L51.6 97.1 L51.2 97.0 L50.7 96.9 L50.2 96.8 L49.6 96.8 L49.1 96.9 L48.6 97.0 L48.1 97.3 L47.5 97.5 L47.1 97.9 L46.6 98.3 L46.2 98.8 L45.9 99.3 L45.6 99.9 L45.4 100.6 L45.3 101.2 L45.2 101.9 L45.3 102.6 L45.4 103.3 L45.6 104.0 L45.9 104.7 L46.3 105.4 L46.7 106.0 L47.3 106.6 L47.9 107.1 L48.6 107.5 L49.4 107.8 L50.2 108.1 L51.0 108.3 L51.9 108.3 L52.8 108.3 L53.6 108.2 L54.5 107.9 L55.4 107.6 L56.2 107.1 L57.0 106.5 L57.7 105.8 L58.3 105.1 L58.8 104.2 L59.3 103.3 L59.6 102.4 L59.8 101.3 L59.9 100.3 L59.9 99.2 L59.7 98.2 Z" fill="#f3a838" />
      {/* body + head + snout */}
      <path d="M31 49 C37 45 43 43 49 42 C54 35 58 27 65 27 C72 28 75 34 74 43 C79 50 80 57 78 66 C76 80 73 90 66 97 C62 102 57 101 56 95 C53 85 49 77 46 68 C45 63 45 59 45 56 C44 55 39 55 34 55 C32 55 31 54 31 53 C28 53 28 49 31 49 Z" fill="#f3a838" />
      {/* lighter belly panel */}
      <path d="M45 57 C48 57 50 61 51 67 C52 76 54 83 57 89 C55 89 53 86 51 81 C47 73 45 64 45 60 C44 58 44 57 45 57 Z" fill="#f8ce58" />
      {/* segment ridges */}
      <path d="M48 61 C54 61 59 63 62 67" fill="none" stroke="#e89224" strokeWidth="2.3" strokeLinecap="round" opacity="0.5" />
      <path d="M49 71 C55 71 60 73 63 77" fill="none" stroke="#e89224" strokeWidth="2.3" strokeLinecap="round" opacity="0.5" />
      <path d="M51 81 C56 81 60 83 62 86" fill="none" stroke="#e89224" strokeWidth="2.3" strokeLinecap="round" opacity="0.5" />
      {/* eye */}
      <rect x="58" y="37" width="6" height="6" rx="1" fill="#3c3c3c" />
      {isSad && (
        <g className="creature-tears">
          <ellipse cx="61" cy="48" rx="2.4" ry="3.6" fill="#7dd3fc" />
        </g>
      )}
    </svg>
  )
}

// A lush aquarium plant: stems gather to a point at the base and fan into an open, ragged top.
type PlantLeaf = { x: number; y: number; ang: number; ln: number; wd: number; fill: string; sc: string; sw: number }

function buildTallPlant(): { stems: string[]; leaves: PlantLeaf[] } {
  const baseY = 372
  const cx = 90
  const maxLen = 300
  // ragged stem heights (fraction of maxLen) -> open, uneven top
  const heights = [0.74, 0.92, 0.66, 0.99, 0.83, 0.7, 0.95, 0.78]
  const stemCount = heights.length

  const cub = (p0: number[], p1: number[], p2: number[], p3: number[], n: number) => {
    const out: { x: number; y: number }[] = []
    for (let i = 0; i <= n; i += 1) {
      const t = i / n
      const mt = 1 - t
      out.push({
        x: mt * mt * mt * p0[0] + 3 * mt * mt * t * p1[0] + 3 * mt * t * t * p2[0] + t * t * t * p3[0],
        y: mt * mt * mt * p0[1] + 3 * mt * mt * t * p1[1] + 3 * mt * t * t * p2[1] + t * t * t * p3[1],
      })
    }
    return out
  }

  // stems gather to a point at the base and fan outward toward the open top
  const stems: { pts: { x: number; y: number }[] }[] = []
  for (let s = 0; s < stemCount; s += 1) {
    const frac = (s / (stemCount - 1) - 0.5) * 2
    const length = maxLen * heights[s]
    const tipx = cx + frac * 56
    const basex = cx + frac * 4
    const pts = cub(
      [basex, baseY],
      [basex + frac * 7, baseY - length * 0.5],
      [tipx - frac * 5, baseY - length * 0.82],
      [tipx, baseY - length],
      44,
    )
    stems.push({ pts })
  }

  const stemPaths = stems.map(
    ({ pts }) => 'M ' + pts.map((p) => `${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' L '),
  )

  const leaves: PlantLeaf[] = []
  const emit = (
    fill: string,
    sc: string,
    sw: number,
    sizeMul: number,
    wdR: number,
    step: number,
    phase: number,
    angOut: number,
  ) => {
    for (const { pts } of stems) {
      for (let i = 3 + phase; i < pts.length - 3; i += step) {
        const p = pts[i]
        const a = pts[i - 1]
        const b = pts[i + 1]
        const tang = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI
        const t = i / pts.length
        const ln = (15 + 4 * (1 - t)) * sizeMul
        const wd = ln * wdR
        for (const side of [-1, 1]) {
          leaves.push({ x: p.x, y: p.y, ang: tang + side * angOut, ln, wd, fill, sc, sw })
        }
      }
    }
  }

  emit('#236b29', '#184a20', 0.5, 1.18, 0.52, 2, 0, 42) // dark back layer
  emit('#2f8a33', '#1f5a26', 0.5, 1.0, 0.5, 2, 1, 34) // mid layer
  emit('#58bb3b', '#2c7030', 0.45, 0.8, 0.46, 3, 1, 28) // bright front layer

  // leafy tip clusters (each stem ends openly at its own height)
  for (const { pts } of stems) {
    const tip = pts[pts.length - 1]
    const a = pts[pts.length - 3]
    const tang = (Math.atan2(tip.y - a.y, tip.x - a.x) * 180) / Math.PI
    const cluster: [number, number][] = [
      [-18, 0.9],
      [0, 1.15],
      [18, 0.9],
    ]
    for (const [da, dl] of cluster) {
      leaves.push({ x: tip.x, y: tip.y, ang: tang + da, ln: 15 * dl, wd: 6 * dl, fill: '#62c23e', sc: '#2c7030', sw: 0.5 })
    }
  }

  // gathered base tuft -> point at the bottom
  for (const da of [-30, -10, 10, 30]) {
    leaves.push({ x: cx, y: baseY - 3, ang: 90 + da, ln: 12, wd: 5, fill: '#1f7a2c', sc: '#14532d', sw: 0.6 })
  }

  return { stems: stemPaths, leaves }
}

function TallPlant() {
  const { stems, leaves } = useMemo(() => buildTallPlant(), [])
  return (
    <svg className="leafy-plant-svg" viewBox="0 0 180 380" preserveAspectRatio="xMidYMax meet" aria-hidden="true">
      {stems.map((d, i) => (
        <path key={`s${i}`} d={d} fill="none" stroke="#1c6b2b" strokeWidth={3} strokeLinecap="round" opacity={0.9} />
      ))}
      {leaves.map((l, i) => (
        <path
          key={`l${i}`}
          d={`M0 0 Q ${(l.ln * 0.45).toFixed(1)} ${(-l.wd).toFixed(1)} ${l.ln.toFixed(1)} 0 Q ${(l.ln * 0.45).toFixed(1)} ${l.wd.toFixed(1)} 0 0 Z`}
          transform={`translate(${l.x.toFixed(1)} ${l.y.toFixed(1)}) rotate(${l.ang.toFixed(1)})`}
          fill={l.fill}
          stroke={l.sc}
          strokeWidth={l.sw}
        />
      ))}
    </svg>
  )
}

function Crab({ mood }: { mood: AquariumMood }) {
  return (
    <svg viewBox="0 0 128 96" role="img" aria-hidden="true">
      <ellipse cx="64" cy="56" rx="36" ry="24" fill="#fb7185" stroke="#7f1d1d" strokeWidth="4" />
      <path d="M28 46 L11 28 M100 46 L117 28" stroke="#7f1d1d" strokeLinecap="round" strokeWidth="7" />
      <circle cx="10" cy="25" r="10" fill="#fda4af" stroke="#7f1d1d" strokeWidth="4" />
      <circle cx="118" cy="25" r="10" fill="#fda4af" stroke="#7f1d1d" strokeWidth="4" />
      <path d="M43 77 L31 91 M55 80 L49 94 M73 80 L79 94 M85 77 L97 91" stroke="#7f1d1d" strokeLinecap="round" strokeWidth="5" />
      <Face mood={mood} x={64} y={45} />
    </svg>
  )
}

function Pufferfish({ mood }: { mood: AquariumMood }) {
  return (
    <svg viewBox="0 0 128 112" role="img" aria-hidden="true">
      <path d="M14 56 L32 40 L32 72 Z" fill="#fde68a" stroke="#854d0e" strokeWidth="4" />
      <circle cx="70" cy="56" r="39" fill="#facc15" stroke="#854d0e" strokeWidth="4" />
      <path d="M49 20 L54 32 M84 18 L80 31 M101 43 L88 46 M100 75 L87 69 M51 91 L56 79" stroke="#854d0e" strokeLinecap="round" strokeWidth="5" />
      <Face mood={mood} x={78} y={50} />
    </svg>
  )
}

function Starfish({ mood }: { mood: AquariumMood }) {
  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <path
        d="M64 14 L78 47 L115 43 L87 67 L98 103 L64 84 L30 103 L41 67 L13 43 L50 47 Z"
        fill="#f59e0b"
        stroke="#92400e"
        strokeLinejoin="round"
        strokeWidth="5"
      />
      <Face mood={mood} x={64} y={60} />
    </svg>
  )
}
function Clam({ mood }: { mood: AquariumMood }) {
  return (
    <svg viewBox="0 0 128 96" role="img" aria-hidden="true">
      <path d="M16 62 Q64 14 112 62 Z" fill="#fbcfe8" stroke="#9d174d" strokeWidth="4" />
      <path d="M12 62 Q64 86 116 62 Z" fill="#f9a8d4" stroke="#9d174d" strokeWidth="4" />
      <path d="M40 60 Q64 30 88 60" fill="none" stroke="#9d174d" strokeWidth="2" opacity="0.5" />
      <path d="M52 61 Q64 40 76 61" fill="none" stroke="#9d174d" strokeWidth="2" opacity="0.5" />
      <circle cx="64" cy="60" r="7" fill="#fdf2f8" stroke="#fbcfe8" strokeWidth="2" />
      <Face mood={mood} x={64} y={58} />
    </svg>
  )
}
