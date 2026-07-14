import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from 'react'
import {
  CreatureArt,
  aquariumSpeciesIds,
  aquariumSpeciesLabels,
  isAquariumSpecies,
  type AquariumMood,
} from './CreatureArt'
import {
  fishHookActiveMs,
  getAutomaticFishHookCycle,
  getFishHookPosition,
  type AutomaticFishHookCycle,
  type ManualFishHookDrop,
} from './fishHook'
import {
  getTankReactionSpeed,
  getTankReactionTarget,
  registerTankTap,
  type TankInteraction,
} from './tankInteraction'
import { getTankMoodBehavior } from './tankMood'

export { CreatureArt } from './CreatureArt'
export type { AquariumMood } from './CreatureArt'
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

type BubbleBurst = {
  id: number
  x: number
  y: number
  size: number
  tone?: 'gold' | 'murk'
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

type TankSurpriseKind = 'disco-pearl' | 'old-boot'

type TankSurprise = {
  id: number
  kind: TankSurpriseKind
  startedAt: number
  until: number
}

export type AquariumHookCapture = {
  creature: AquariumCreature
  message: string
}

type TankPointerStart = {
  pointerId: number
  clientX: number
  clientY: number
  localY: number
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

const mournAudioSources = [
  '/sounds/bugs/bug-mourn-cry-1.mp3',
  '/sounds/bugs/bug-mourn-cry-2.mp3',
  '/sounds/bugs/bug-mourn-cry-3.mp3',
  '/sounds/bugs/bug-mourn-cry-4.mp3',
]

const unlockableAudioSources = [
  ...tankBubbleAudioSources,
  ...fishFeedingAudioSources,
  ...cellPhoneBuzzAudioSources,
  ...hungryFishAudioSources,
  ...fishHappyNowAudioSources,
  ...fishHookHappyAudioSources,
  ...mournAudioSources,
]

const htmlAudioCache = new Map<string, HTMLAudioElement>()
let htmlAudioUnlocked = false
let htmlAudioUnlockInFlight = false

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
  if (htmlAudioUnlocked || htmlAudioUnlockInFlight) return
  htmlAudioUnlockInFlight = true
  let unlockedCount = 0
  let settledCount = 0

  for (const source of unlockableAudioSources) {
    const audio = getHtmlAudio(source)
    const originalMuted = audio.muted
    const originalVolume = audio.volume
    audio.muted = true
    audio.volume = 0
    void audio.play()
      .then(() => {
        unlockedCount += 1
        audio.pause()
        audio.currentTime = 0
        audio.muted = originalMuted
        audio.volume = originalVolume
      })
      .catch(() => {
        audio.muted = originalMuted
        audio.volume = originalVolume
      })
      .finally(() => {
        settledCount += 1
        if (settledCount !== unlockableAudioSources.length) return
        htmlAudioUnlocked = unlockedCount > 0
        htmlAudioUnlockInFlight = false
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

const aquariumSpecies = aquariumSpeciesIds

const moodLabels: Record<AquariumMood, string> = {
  happy: '😄 HAPPY',
  content: '🙂 CONTENT',
  peckish: '😐 PECKISH',
  hungry: '😟 HUNGRY',
  very_hungry: '😫 VERY HUNGRY',
  sad: '🚨 STARVING',
}

const subtleMoodLabels: Record<AquariumMood, string> = {
  happy: 'Happy',
  content: 'Content',
  peckish: 'Peckish',
  hungry: 'Hungry',
  very_hungry: 'Very hungry',
  sad: 'Needs care',
}

const aquariumMoodValues = new Set<AquariumMood>(['happy', 'content', 'peckish', 'hungry', 'very_hungry', 'sad'])

function isAquariumMood(value: string | null): value is AquariumMood {
  return value !== null && aquariumMoodValues.has(value as AquariumMood)
}

const sparkleField = Array.from({ length: 26 }, (_, index) => ({
  id: index,
  x: 4 + ((index * 37) % 92),
  y: 5 + ((index * 53) % 82),
  size: 7 + ((index * 11) % 15),
  delayMs: -((index * 317) % 3200),
  durationMs: 1500 + ((index * 191) % 1700),
}))

const murkField = Array.from({ length: 14 }, (_, index) => ({
  id: index,
  x: 3 + ((index * 29) % 94),
  y: 12 + ((index * 47) % 74),
  size: 16 + ((index * 17) % 38),
  delayMs: -((index * 431) % 5600),
}))

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function getCreatureSize(creature: AquariumCreature, tankWidth: number) {
  const baseSize = creature.growth_stage === 'adult' ? 110 : 74
  const responsiveSize = tankWidth > 0 ? tankWidth * (creature.growth_stage === 'adult' ? 0.12 : 0.085) : baseSize
  const size = Math.round(Math.min(Math.max(responsiveSize, baseSize * 0.82), baseSize * 1.22))
  // The clam is a chunky bottom-dweller — a touch bigger than the fish.
  if (creature.species_id === 'clam') return Math.round(size * 1.14)
  if (creature.species_id === 'happy-jellyfish') return Math.round(size * 1.08)
  if (creature.species_id === 'benny-fish') return Math.round(size * 1.05)
  return size
}

function getCreatureCruiseSpeed(speciesId: string) {
  return speciesId === 'happy-jellyfish' ? randomBetween(0.012, 0.026) : randomBetween(0.018, 0.042)
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
  return isAquariumSpecies(speciesId) ? aquariumSpeciesLabels[speciesId] : 'Aquarium friend'
}

function formatPercent(value: number, max: number) {
  if (max <= 0) return 0
  return Math.max(0, Math.min(100, Math.round((value / max) * 100)))
}

function formatDiscoveryDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}Z`))
}

export function AquariumView({
  aquarium,
  immersive,
  onRecord,
  onEnterImmersive,
  onExitImmersive,
  onHookTake,
  onHookCaptureFinished,
  fishTextActiveUntil,
  testMode,
}: {
  aquarium: AquariumData | null
  immersive: boolean
  fishTextActiveUntil: string | null
  onRecord: () => void
  onEnterImmersive: () => void
  onExitImmersive: () => void
  onHookTake: (cycleKey: string) => Promise<AquariumHookCapture | null>
  onHookCaptureFinished: (capture: AquariumHookCapture) => void
  testMode: boolean
}) {
  const [leaderboardRange, setLeaderboardRange] = useState<AquariumLeaderboardRange>('today')
  const testFeedHandlerRef = useRef<() => void>(() => undefined)
  const testHookHandlerRef = useRef<() => void>(() => undefined)
  const testSurpriseHandlerRef = useRef<() => void>(() => undefined)
  const setTestFeedHandler = useCallback((handler: () => void) => {
    testFeedHandlerRef.current = handler
  }, [])
  const setTestHookHandler = useCallback((handler: () => void) => {
    testHookHandlerRef.current = handler
  }, [])
  const setTestSurpriseHandler = useCallback((handler: () => void) => {
    testSurpriseHandlerRef.current = handler
  }, [])

  useEffect(() => {
    if (!immersive) return undefined
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [immersive])

  if (!aquarium) {
    return (
      <section className={`screen aquarium-screen${immersive ? ' aquarium-immersive' : ''}`}>
        {immersive && (
          <button type="button" className="aquarium-immersive-exit" onClick={onExitImmersive} aria-label="Exit full-screen aquarium">
            <span aria-hidden="true">⌃</span>
            Exit tank
          </button>
        )}
        <section className="aquarium-loading-panel">
          <h1>Family Aquarium</h1>
          <p>Filling the tank...</p>
        </section>
      </section>
    )
  }

  const foodPercent = formatPercent(aquarium.state.food_reserve, aquarium.state.max_food_reserve)
  const requestedTestMood = testMode ? new URLSearchParams(window.location.search).get('tankMood') : null
  const tankMood = isAquariumMood(requestedTestMood) ? requestedTestMood : aquarium.state.mood
  const leaderboard = aquarium.leaderboard[leaderboardRange] ?? []
  const pendingEggs = aquarium.eggs ?? []
  const milestoneRemainder = aquarium.state.total_chore_completions % aquarium.state.creature_unlock_interval
  const nextMilestoneRemaining =
    milestoneRemainder === 0
      ? aquarium.state.creature_unlock_interval
      : aquarium.state.creature_unlock_interval - milestoneRemainder
  const displayCreatures = aquarium.creatures.length > 0 ? aquarium.creatures : [starterClownfish]

  return (
    <section className={`screen aquarium-screen aquarium-mood-${tankMood}${immersive ? ' aquarium-immersive' : ''}`}>
      <section className="aquarium-stage">
        <AquariumScene
          creatures={displayCreatures}
          eggs={pendingEggs}
          mood={tankMood}
          events={aquarium.events}
          fishTextActiveUntil={fishTextActiveUntil}
          immersive={immersive}
          onExitImmersive={onExitImmersive}
          onHookTake={onHookTake}
          onHookCaptureFinished={onHookCaptureFinished}
          onTestFeedReady={setTestFeedHandler}
          onTestHookReady={setTestHookHandler}
          onTestSurpriseReady={setTestSurpriseHandler}
        />
        <div className="aquarium-mood-chip" aria-live="polite" aria-label={`Aquarium mood: ${moodLabels[tankMood]}`}>
          <span aria-hidden="true" />
          <strong>{subtleMoodLabels[tankMood]}</strong>
        </div>
        {immersive && (
          <>
            <button type="button" className="aquarium-immersive-exit" onClick={onExitImmersive} aria-label="Exit full-screen aquarium">
              <span aria-hidden="true">⌃</span>
              Exit tank
            </button>
            <div className="aquarium-immersive-hint" aria-hidden="true">
              Tap the water to play · tap the top edge or swipe up to leave
            </div>
          </>
        )}
        {testMode && !immersive && (
          <div className="aquarium-test-actions">
            <button type="button" className="secondary-action" onClick={() => testFeedHandlerRef.current()}>
              Test feed fish
            </button>
            <button type="button" className="secondary-action" onClick={() => testHookHandlerRef.current()}>
              Test fish hook
            </button>
            <button type="button" className="secondary-action" onClick={() => testSurpriseHandlerRef.current()}>
              Test tank surprise
            </button>
          </div>
        )}

        <div className="aquarium-status-strip" aria-live="polite">
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

        <div className="aquarium-action-grid">
          <button type="button" className="secondary-action aquarium-enter-immersive" onClick={onEnterImmersive}>
            Full tank
          </button>
          <button type="button" className="primary-action" onClick={onRecord}>
            Record a chore
          </button>
        </div>

        <details className="aquarium-side-details">
          <summary>Family helpers</summary>
          <div className="aquarium-details-content">
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
            <div className="aquarium-helper-list">
              {leaderboard.map((helper, index) => (
                <span key={helper.member_id} className="aquarium-helper-row">
                  <strong>{index + 1}. {helper.member_name}</strong>
                  <span>{helper.completed_count}</span>
                </span>
              ))}
            </div>
          </div>
        </details>

        <details className="aquarium-side-details">
          <summary>Latest activity</summary>
          <div className="aquarium-details-content aquarium-event-list">
            {aquarium.events.length === 0 && <p>Quiet water.</p>}
            {aquarium.events.slice(0, 3).map((event) => <span key={event.id}>{event.message}</span>)}
          </div>
        </details>

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
  immersive,
  onExitImmersive,
  onHookTake,
  onHookCaptureFinished,
  onTestFeedReady,
  onTestHookReady,
  onTestSurpriseReady,
}: {
  creatures: AquariumCreature[]
  eggs: AquariumEgg[]
  mood: AquariumMood
  events: AquariumEvent[]
  fishTextActiveUntil: string | null
  immersive: boolean
  onExitImmersive: () => void
  onHookTake: (cycleKey: string) => Promise<AquariumHookCapture | null>
  onHookCaptureFinished: (capture: AquariumHookCapture) => void
  onTestFeedReady: (handler: () => void) => void
  onTestHookReady: (handler: () => void) => void
  onTestSurpriseReady: (handler: () => void) => void
}) {
  const tankRef = useRef<HTMLDivElement | null>(null)
  const phoneRef = useRef<HTMLDivElement | null>(null)
  const hookRef = useRef<HTMLDivElement | null>(null)
  const spriteRefs = useRef(new Map<number, HTMLDivElement>())
  const swimmersRef = useRef(new Map<number, Swimmer>())
  const tankInteractionRef = useRef<TankInteraction | null>(null)
  const tankInteractionWasActiveRef = useRef(false)
  const tankPointerStartRef = useRef<TankPointerStart | null>(null)
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)
  const latestEventIdRef = useRef<number | null>(null)
  const fishTextActiveUntilRef = useRef<number | null>(null)
  const fishTextWasActiveRef = useRef(false)
  const feedingFrenzyRef = useRef<FeedingFrenzy | null>(null)
  const tankSurpriseRef = useRef<TankSurprise | null>(null)
  const manualFishHookRef = useRef<ManualFishHookDrop | null>(null)
  const automaticFishHookRef = useRef<AutomaticFishHookCycle | null>(null)
  const hookSoundPlayedRef = useRef(false)
  const hookTakeRequestedCyclesRef = useRef(new Set<string>())
  const hookCaptureRef = useRef<AquariumHookCapture | null>(null)
  const sceneMountedRef = useRef(true)
  const onHookTakeRef = useRef(onHookTake)
  const onHookCaptureFinishedRef = useRef(onHookCaptureFinished)
  const bubbleTimeoutsRef = useRef(new Set<number>())
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [bursts, setBursts] = useState<BubbleBurst[]>([])
  const [food, setFood] = useState<FallingFood[]>([])
  const [ambientBubbles, setAmbientBubbles] = useState<AmbientBubble[]>([])
  const [hearts, setHearts] = useState<FloatingHeart[]>([])
  const [feedNotice, setFeedNotice] = useState('')
  const [tankSurprise, setTankSurprise] = useState<TankSurprise | null>(null)

  useEffect(() => {
    onHookTakeRef.current = onHookTake
    onHookCaptureFinishedRef.current = onHookCaptureFinished
  }, [onHookCaptureFinished, onHookTake])

  useEffect(() => {
    sceneMountedRef.current = true
    return () => {
      sceneMountedRef.current = false
      if (hookCaptureRef.current) {
        const capture = hookCaptureRef.current
        hookCaptureRef.current = null
        onHookCaptureFinishedRef.current(capture)
      }
    }
  }, [])

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
    let timeoutId = 0
    const schedule = () => {
      const delay = mood === 'happy' ? randomBetween(2, 4) * 60_000 : randomBetween(5, 9) * 60_000
      timeoutId = window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          playAudioFrom(tankBubbleAudioSources, mood === 'happy' ? 0.24 : 0.16)
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => window.clearTimeout(timeoutId)
  }, [mood])

  // The full mood scale has a voice: delighted chirps at the top, increasingly
  // tired complaints and low moans as the tank falls toward panic.
  useEffect(() => {
    const behavior = getTankMoodBehavior(mood)
    if (behavior.vocalStyle === 'quiet') return undefined

    let timeoutId = 0
    let firstCall = true
    const schedule = () => {
      const normalDelay = randomBetween(behavior.vocalIntervalMinMs, behavior.vocalIntervalMaxMs)
      const delay = firstCall
        ? Math.min(normalDelay, mood === 'sad' ? randomBetween(8_000, 18_000) : mood === 'happy' ? randomBetween(16_000, 32_000) : normalDelay)
        : normalDelay
      firstCall = false
      timeoutId = window.setTimeout(() => {
        if (document.visibilityState === 'visible') {
          if (behavior.vocalStyle === 'delight') {
            playAudioFrom(fishHookHappyAudioSources, behavior.vocalVolume)
          } else if (behavior.vocalStyle === 'moan' && Math.random() < 0.42) {
            playAudioFrom(mournAudioSources, behavior.vocalVolume)
          } else {
            playAudioFrom(hungryFishAudioSources, behavior.vocalVolume)
          }
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => window.clearTimeout(timeoutId)
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

  const triggerTankTap = useCallback((x: number, y: number) => {
    tankInteractionRef.current = registerTankTap(tankInteractionRef.current, x, y, performance.now())
  }, [])

  const handleTankPointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return
    const target = event.target
    if (target instanceof Element && target.closest('[data-aquarium-control]')) return

    const rect = event.currentTarget.getBoundingClientRect()
    tankPointerStartRef.current = {
      pointerId: event.pointerId,
      clientX: event.clientX,
      clientY: event.clientY,
      localY: event.clientY - rect.top,
    }
    event.currentTarget.setPointerCapture(event.pointerId)
  }, [])

  const handleTankPointerUp = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    const start = tankPointerStartRef.current
    if (!start || start.pointerId !== event.pointerId) return
    tankPointerStartRef.current = null

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId)
    }

    const rect = event.currentTarget.getBoundingClientRect()
    const deltaX = event.clientX - start.clientX
    const deltaY = event.clientY - start.clientY
    const travel = Math.hypot(deltaX, deltaY)
    const topExitDepth = Math.max(54, rect.height * 0.07)
    const bottomExitDepth = Math.max(84, rect.height * 0.16)

    if (immersive && start.localY <= topExitDepth && travel <= 24) {
      onExitImmersive()
      return
    }

    if (
      immersive
      && start.localY >= rect.height - bottomExitDepth
      && deltaY <= -72
      && Math.abs(deltaY) > Math.abs(deltaX) * 1.15
    ) {
      onExitImmersive()
      return
    }

    if (travel > 24) return
    const x = Math.min(Math.max(event.clientX - rect.left, 0), rect.width)
    const y = Math.min(Math.max(event.clientY - rect.top, 0), rect.height)
    triggerTankTap(x, y)
  }, [immersive, onExitImmersive, triggerTankTap])

  const handleTankPointerCancel = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
    if (tankPointerStartRef.current?.pointerId === event.pointerId) {
      tankPointerStartRef.current = null
    }
  }, [])

  const handleTankKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Escape' && immersive) {
      event.preventDefault()
      onExitImmersive()
      return
    }
    if (event.key !== 'Enter' && event.key !== ' ') return
    event.preventDefault()
    triggerTankTap(size.width / 2, size.height / 2)
  }, [immersive, onExitImmersive, size.height, size.width, triggerTankTap])

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
    bubbleTimeoutsRef.current.add(noticeTimeout)
    const happySoundTimeout = window.setTimeout(() => {
      playAudioFrom(fishHappyNowAudioSources, 0.44)
    }, 9000)
    bubbleTimeoutsRef.current.add(happySoundTimeout)

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
    bubbleTimeoutsRef.current.add(foodTimeout)
  }, [size.height, size.width])

  useEffect(() => {
    onTestFeedReady(() => startFeedingAnimation('Test feeding time!', Date.now()))
    return () => onTestFeedReady(() => undefined)
  }, [onTestFeedReady, startFeedingAnimation])

  const startTankSurprise = useCallback((forcedKind?: TankSurpriseKind) => {
    if (size.width <= 0 || size.height <= 0) return
    const kind = forcedKind ?? (mood === 'happy' ? 'disco-pearl' : 'old-boot')
    const now = performance.now()
    const surprise: TankSurprise = {
      id: Date.now(),
      kind,
      startedAt: now,
      until: now + 9_500,
    }
    tankSurpriseRef.current = surprise
    setTankSurprise(surprise)

    const isTreasure = kind === 'disco-pearl'
    setFeedNotice(isTreasure ? 'A disco pearl! The whole tank is celebrating. ✨' : 'Oh no. The mystery chest had an old boot in it.')
    if (isTreasure) {
      playFeedChime()
      playAudioFrom(fishHookHappyAudioSources, 0.42)
    } else {
      playAudioFrom(mournAudioSources, 0.38)
    }

    const surpriseBursts: BubbleBurst[] = Array.from({ length: isTreasure ? 30 : 18 }, (_, index) => ({
      id: surprise.id * 100 + index,
      x: randomBetween(size.width * 0.24, size.width * 0.76),
      y: randomBetween(size.height * 0.36, size.height * 0.82),
      size: randomBetween(isTreasure ? 10 : 16, isTreasure ? 28 : 46),
      tone: isTreasure ? 'gold' : 'murk',
    }))
    setBursts((current) => [...current, ...surpriseBursts].slice(-44))

    const surpriseHearts: FloatingHeart[] = isTreasure
      ? Array.from({ length: 12 }, (_, index) => ({
        id: surprise.id * 1000 + index,
        x: randomBetween(size.width * 0.16, size.width * 0.84),
        y: randomBetween(size.height * 0.25, size.height * 0.72),
        size: randomBetween(17, 31),
        delayMs: index * 120,
      }))
      : []
    if (surpriseHearts.length > 0) {
      setHearts((current) => [...current, ...surpriseHearts].slice(-24))
    }

    for (const swimmer of swimmersRef.current.values()) {
      swimmer.pauseUntil = 0
      if (isTreasure) {
        swimmer.moodBoostUntil = now + 9_200
        swimmer.speed = randomBetween(0.09, 0.16)
      }
    }

    const clearTimeoutId = window.setTimeout(() => {
      if (tankSurpriseRef.current?.id === surprise.id) {
        tankSurpriseRef.current = null
        setTankSurprise(null)
        setFeedNotice('')
      }
      setBursts((current) => current.filter((burst) => !surpriseBursts.some((item) => item.id === burst.id)))
      if (surpriseHearts.length > 0) {
        setHearts((current) => current.filter((heart) => !surpriseHearts.some((item) => item.id === heart.id)))
      }
      bubbleTimeoutsRef.current.delete(clearTimeoutId)
    }, 9_500)
    bubbleTimeoutsRef.current.add(clearTimeoutId)
  }, [mood, size.height, size.width])

  useEffect(() => {
    onTestSurpriseReady(() => startTankSurprise(mood === 'happy' || mood === 'content' ? 'disco-pearl' : 'old-boot'))
    return () => onTestSurpriseReady(() => undefined)
  }, [mood, onTestSurpriseReady, startTankSurprise])

  useEffect(() => {
    if (mood !== 'happy' && mood !== 'very_hungry' && mood !== 'sad') return undefined

    let timeoutId = 0
    let firstEvent = true
    const schedule = () => {
      const delay = firstEvent
        ? (mood === 'happy' ? randomBetween(25_000, 50_000) : randomBetween(35_000, 70_000))
        : (mood === 'happy' ? randomBetween(3, 5) : randomBetween(2.5, 4.5)) * 60_000
      firstEvent = false
      timeoutId = window.setTimeout(() => {
        if (document.visibilityState === 'visible' && !tankSurpriseRef.current) {
          startTankSurprise(mood === 'happy' ? 'disco-pearl' : 'old-boot')
        }
        schedule()
      }, delay)
    }
    schedule()
    return () => window.clearTimeout(timeoutId)
  }, [mood, startTankSurprise])

  const startFishHookTest = useCallback(() => {
    manualFishHookRef.current = {
      startedAt: performance.now(),
      hasWorm: mood === 'peckish' ? false : mood === 'happy' || mood === 'content' ? Math.random() < 0.2 : true,
      canTakeFish: false,
    }
  }, [mood])

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
      bubbleTimeoutsRef.current.add(noticeTimeout)

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
      bubbleTimeoutsRef.current.add(heartsTimeout)

      for (const swimmer of swimmersRef.current.values()) {
        swimmer.moodBoostUntil = performance.now() + 6000
      }
    }

    if (newBursts.length > 0) {
      setBursts((current) => [...current, ...newBursts].slice(-36))
      const timeoutId = window.setTimeout(() => {
        setBursts((current) => current.filter((burst) => !newBursts.some((newBurst) => newBurst.id === burst.id)))
      }, 2600)
      bubbleTimeoutsRef.current.add(timeoutId)
    }
  }, [events, size.height, size.width, startFeedingAnimation])

  useEffect(() => {
    if (size.width <= 0 || size.height <= 0) return undefined
    const moodBehavior = getTankMoodBehavior(mood)

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
        speed: getCreatureCruiseSpeed(creature.species_id),
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
      if (manualFishHookRef.current && time - manualFishHookRef.current.startedAt >= fishHookActiveMs) {
        manualFishHookRef.current = null
      }
      const wallClockTime = Date.now()
      automaticFishHookRef.current = getAutomaticFishHookCycle(wallClockTime, mood, automaticFishHookRef.current)
      const hookPosition = getFishHookPosition(
        size.width,
        size.height,
        time,
        wallClockTime,
        automaticFishHookRef.current,
        manualFishHookRef.current,
      )
      const hook = hookRef.current
      const feedingFrenzy = feedingFrenzyRef.current && time < feedingFrenzyRef.current.until ? feedingFrenzyRef.current : null
      const activeSurprise = tankSurpriseRef.current && time < tankSurpriseRef.current.until ? tankSurpriseRef.current : null
      if (feedingFrenzyRef.current && time >= feedingFrenzyRef.current.until) {
        feedingFrenzyRef.current = null
      }
      let rememberedTankInteraction = tankInteractionRef.current
      if (rememberedTankInteraction && time >= rememberedTankInteraction.memoryUntil) {
        tankInteractionRef.current = null
        rememberedTankInteraction = null
      }
      const tankInteraction = rememberedTankInteraction && time < rememberedTankInteraction.activeUntil
        ? rememberedTankInteraction
        : null
      if (!tankInteraction && tankInteractionWasActiveRef.current) {
        for (const creature of creatures) {
          const swimmer = swimmersRef.current.get(creature.id)
          if (!swimmer || creature.species_id === 'clam') continue
          const next = pickCreatureTarget(creature, size.width, size.height, getCreatureSize(creature, size.width))
          swimmer.targetX = next.x
          swimmer.targetY = next.y
          swimmer.speed = getCreatureCruiseSpeed(creature.species_id)
          swimmer.pauseUntil = 0
        }
      }
      tankInteractionWasActiveRef.current = tankInteraction !== null

      const automaticHookCycle = automaticFishHookRef.current
      if (
        hookPosition.takeReady
        && automaticHookCycle
        && !hookTakeRequestedCyclesRef.current.has(automaticHookCycle.cycleKey)
      ) {
        const requestedCycle = automaticHookCycle
        hookTakeRequestedCyclesRef.current.add(requestedCycle.cycleKey)
        if (hookTakeRequestedCyclesRef.current.size > 48) {
          hookTakeRequestedCyclesRef.current = new Set([requestedCycle.cycleKey])
        }
        void onHookTakeRef.current(requestedCycle.cycleKey)
          .then((capture) => {
            if (!capture) return
            if (!sceneMountedRef.current) {
              onHookCaptureFinishedRef.current(capture)
              return
            }
            const cycleIsStillVisible = automaticFishHookRef.current?.cycleKey === requestedCycle.cycleKey
              && Date.now() % requestedCycle.cycleMs < fishHookActiveMs
            if (!cycleIsStillVisible) {
              onHookCaptureFinishedRef.current(capture)
              return
            }
            hookCaptureRef.current = capture
            setFeedNotice(capture.message)
            playAudioFrom(mournAudioSources, 0.46)
          })
          .catch(() => {
            // A surprise event should never interrupt the shared aquarium.
          })
      }

      if (!hookPosition.visible && hookCaptureRef.current) {
        const capture = hookCaptureRef.current
        hookCaptureRef.current = null
        onHookCaptureFinishedRef.current(capture)
        const noticeTimeout = window.setTimeout(() => setFeedNotice(''), 4_200)
        bubbleTimeoutsRef.current.add(noticeTimeout)
      }

      if (hookPosition.visible && hookPosition.hasWorm) {
        if (!hookSoundPlayedRef.current) {
          playAudioFrom(hookPosition.canTakeFish ? mournAudioSources : hungryFishAudioSources, hookPosition.canTakeFish ? 0.32 : 0.2)
          hookSoundPlayedRef.current = true
        }
      } else {
        hookSoundPlayedRef.current = false
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
        hook.classList.toggle('dangerous', hookPosition.canTakeFish)
        hook.classList.toggle('catching', hookCaptureRef.current !== null)
        hook.style.height = `${Math.max(0, hookPosition.y)}px`
        hook.style.transform = `translate3d(${hookPosition.x - 22}px, 0, 0)`
      } else if (hook) {
        hook.classList.remove('lowered')
        hook.classList.remove('baited')
        hook.classList.remove('dangerous')
        hook.classList.remove('catching')
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
        const isHookCaught = hookCaptureRef.current?.creature.id === creature.id && hookPosition.visible
        sprite.classList.toggle('hook-caught', isHookCaught)

        if (isHookCaught) {
          swimmer.targetX = hookPosition.x + 4
          swimmer.targetY = Math.min(size.height - spriteSize * 0.62, hookPosition.y + spriteSize * 0.32)
          swimmer.pauseUntil = 0
          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const step = Math.min(distance, Math.max(0.2, swimmer.speed * 6) * delta)
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            swimmer.facing = dx >= 0 ? 1 : -1
          }
          swimmer.moodBoostUntil = time + 220
        } else if (tankInteraction) {
          const reactionTarget = getTankReactionTarget(
            tankInteraction,
            swimmer,
            index,
            creatures.length,
            spriteSize,
            size.width,
            size.height,
            time,
            creature.species_id === 'crab',
          )
          swimmer.targetX = reactionTarget.x
          swimmer.targetY = reactionTarget.y
          swimmer.pauseUntil = 0

          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const step = Math.min(
              distance,
              getTankReactionSpeed(tankInteraction.mode, swimmer.speed, moodBehavior.reactionSpeedMultiplier) * delta,
            )
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            swimmer.facing = dx >= 0 ? 1 : -1
          }
          swimmer.moodBoostUntil = time + 220
        } else if (feedingFrenzy && canJoinFeeding) {
          const feedingTarget = getFeedingFrenzyTarget(feedingFrenzy, index, creatures.length, spriteSize, size.width, size.height, time)
          swimmer.targetX = feedingTarget.x
          swimmer.targetY = feedingTarget.y
          swimmer.pauseUntil = 0

          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const step = Math.min(
              distance,
              Math.max(0.72, swimmer.speed * 7.4) * moodBehavior.reactionSpeedMultiplier * delta,
            )
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            swimmer.facing = dx >= 0 ? 1 : -1
          }
          swimmer.moodBoostUntil = time + 280
        } else if (activeSurprise && canJoinFeeding) {
          const surpriseTarget = getTankSurpriseTarget(
            activeSurprise,
            index,
            creatures.length,
            spriteSize,
            size.width,
            size.height,
            time,
          )
          swimmer.targetX = surpriseTarget.x
          swimmer.targetY = surpriseTarget.y
          swimmer.pauseUntil = 0

          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const eventMultiplier = activeSurprise.kind === 'disco-pearl'
              ? Math.max(1.15, moodBehavior.reactionSpeedMultiplier)
              : moodBehavior.reactionSpeedMultiplier * 0.58
            const step = Math.min(distance, Math.max(0.12, swimmer.speed * 5.4) * eventMultiplier * delta)
            swimmer.x += (dx / distance) * step
            swimmer.y += (dy / distance) * step
            swimmer.facing = dx >= 0 ? 1 : -1
          }
          if (activeSurprise.kind === 'disco-pearl') swimmer.moodBoostUntil = time + 260
        } else if (phonePosition) {
          const huddle = getPhoneHuddleTarget(phonePosition, index, creatures.length, spriteSize, phoneSize, time)
          swimmer.targetX = Math.min(Math.max(huddle.x, spriteSize * 0.55), size.width - spriteSize * 0.55)
          swimmer.targetY = Math.min(Math.max(huddle.y, spriteSize * 0.62), size.height - spriteSize * 0.9)
          swimmer.pauseUntil = 0

          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)
          if (distance > 1) {
            const step = Math.min(
              distance,
              Math.max(0.088, swimmer.speed * 3.1) * moodBehavior.reactionSpeedMultiplier * delta,
            )
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
            const step = Math.min(
              distance,
              Math.max(0.062, swimmer.speed * 2.35)
                * moodBehavior.reactionSpeedMultiplier
                * delta
                * hookPosition.attraction,
            )
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
            swimmer.speed = getCreatureCruiseSpeed(creature.species_id)
            if (creature.species_id === 'crab') {
              // Crabs settle in and hang out, lingering much longer when
              // they've reached one of the algae clusters at the edges.
              const nearAlgae = swimmer.x < size.width * 0.2 || swimmer.x > size.width * 0.8
              swimmer.pauseUntil = time + (nearAlgae ? randomBetween(3200, 6000) : randomBetween(900, 2000))
            } else {
              swimmer.pauseUntil = time + randomBetween(moodBehavior.pauseMinMs, moodBehavior.pauseMaxMs)
            }
          } else {
            const boost = time < swimmer.moodBoostUntil ? 1.8 : 1
            const step = swimmer.speed * moodBehavior.cruiseSpeedMultiplier * boost * delta
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
        const isJellyfish = creature.species_id === 'happy-jellyfish'
        const floatY = isJellyfish
          ? Math.sin(time / 720 + swimmer.bobOffset) * 10
          : creature.species_id === 'seahorse'
            ? Math.sin(time / 900 + swimmer.bobOffset) * 8
            : 0
        const feedingTilt = !tankInteraction && feedingFrenzy && canJoinFeeding && !isJellyfish
          ? -45 + Math.sin(time / 90 + swimmer.bobOffset) * 8
          : 0
        const reactionIsFast = tankInteraction?.mode === 'engaged' || Boolean(feedingFrenzy)
        const reactionWiggle = tankInteraction?.mode === 'engaged'
          ? 10
          : tankInteraction?.mode === 'startled'
            ? 5
            : tankInteraction?.mode === 'wary'
              ? 3
              : 5.5
        const wiggle = time < swimmer.moodBoostUntil
          ? Math.sin(time / (reactionIsFast ? 58 : 140) + swimmer.bobOffset)
            * (isJellyfish ? 2.5 : feedingFrenzy ? 10 : reactionWiggle)
            * Math.max(0.35, moodBehavior.reactionSpeedMultiplier)
          : 0
        const droop = mood === 'sad' ? (isJellyfish ? 3 : 9) : mood === 'very_hungry' ? (isJellyfish ? 2 : 4) : 0
        sprite.style.transform = `translate3d(${swimmer.x - spriteSize / 2}px, ${swimmer.y - spriteSize / 2 + floatY}px, 0)`
        if (creatureArt) {
          const facing = isJellyfish ? 1 : swimmer.facing
          creatureArt.style.transform = `scaleX(${facing}) rotate(${feedingTilt + wiggle + droop}deg)`
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
    const behavior = getTankMoodBehavior(mood)

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
        bubbleTimeoutsRef.current.delete(timeoutId)
      }, bubble.durationMs)
      bubbleTimeoutsRef.current.add(timeoutId)
    }, behavior.bubbleIntervalMs)

    return () => window.clearInterval(bubbleInterval)
  }, [mood, size.width])

  useEffect(
    () => () => {
      for (const timeoutId of bubbleTimeoutsRef.current) {
        window.clearTimeout(timeoutId)
      }
      bubbleTimeoutsRef.current.clear()
    },
    [],
  )

  const creatureSummary = useMemo(
    () => creatures.map((creature) => `${creature.growth_stage} ${displaySpecies(creature.species_id)}`).join(', '),
    [creatures],
  )

  return (
    <div
      ref={tankRef}
      className="aquarium-tank"
      role="group"
      tabIndex={0}
      aria-label={`Interactive aquarium with ${creatureSummary}. Tap the water repeatedly to gain the fish's curiosity and draw them closer.${immersive ? ' Tap the top edge or swipe up from the bottom to exit.' : ''}`}
      onPointerDown={handleTankPointerDown}
      onPointerUp={handleTankPointerUp}
      onPointerCancel={handleTankPointerCancel}
      onKeyDown={handleTankKeyDown}
    >
      <div className="aquarium-light" />
      {mood === 'happy' && (
        <div className="aquarium-sparkle-field" aria-hidden="true">
          {sparkleField.map((sparkle) => (
            <span
              key={sparkle.id}
              style={
                {
                  '--sparkle-x': `${sparkle.x}%`,
                  '--sparkle-y': `${sparkle.y}%`,
                  '--sparkle-size': `${sparkle.size}px`,
                  '--sparkle-delay': `${sparkle.delayMs}ms`,
                  '--sparkle-duration': `${sparkle.durationMs}ms`,
                } as CSSProperties
              }
            >✦</span>
          ))}
        </div>
      )}
      {(mood === 'very_hungry' || mood === 'sad') && (
        <div className="aquarium-murk-field" aria-hidden="true">
          {murkField.map((mote) => (
            <span
              key={mote.id}
              style={
                {
                  '--murk-x': `${mote.x}%`,
                  '--murk-y': `${mote.y}%`,
                  '--murk-size': `${mote.size}px`,
                  '--murk-delay': `${mote.delayMs}ms`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      )}
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

      {tankSurprise && (
        <div
          className={`aquarium-tank-surprise aquarium-tank-surprise-${tankSurprise.kind}`}
          role="img"
          aria-label={tankSurprise.kind === 'disco-pearl' ? 'A mystery chest revealing a sparkling disco pearl' : 'A mystery chest revealing an old boot and murky water'}
        >
          <svg viewBox="0 0 180 180" aria-hidden="true">
            <ellipse className="surprise-shadow" cx="90" cy="153" rx="63" ry="13" />
            <g className="surprise-chest">
              <path className="surprise-chest-lid" d="M38 88 C42 54 62 39 90 39 C118 39 138 54 142 88 Z" />
              <path className="surprise-chest-band" d="M86 40 H96 V88 H86 Z" />
              <path className="surprise-chest-body" d="M34 86 H146 L137 151 H43 Z" />
              <path className="surprise-chest-rim" d="M31 83 H149 V99 H31 Z" />
              <rect className="surprise-chest-lock" x="79" y="91" width="23" height="27" rx="5" />
            </g>
            {tankSurprise.kind === 'disco-pearl' ? (
              <g className="surprise-disco-pearl">
                <path className="surprise-ray" d="M90 51 V9 M63 58 L43 20 M117 58 L138 20 M51 77 L14 61 M129 77 L167 61" />
                <circle className="surprise-pearl-glow" cx="90" cy="64" r="31" />
                <circle className="surprise-pearl" cx="90" cy="64" r="21" />
                <path className="surprise-pearl-grid" d="M69 61 H111 M72 50 H108 M74 74 H106 M83 44 V84 M97 44 V84" />
              </g>
            ) : (
              <g className="surprise-old-boot">
                <path d="M76 30 H111 L106 72 C116 76 130 85 141 99 C145 105 140 115 131 116 H69 C57 116 51 106 58 98 L78 78 Z" />
                <path className="boot-patch" d="M87 43 H103 L100 62 H84 Z" />
                <path className="boot-lace" d="M80 68 L104 77 M76 77 L112 89" />
              </g>
            )}
          </svg>
        </div>
      )}

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
          className={`aquarium-burst-bubble${burst.tone ? ` aquarium-burst-${burst.tone}` : ''}`}
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

  if (creature.species_id === 'happy-jellyfish') {
    const minY = spriteSize * 0.92
    const maxY = Math.max(minY, height * 0.68)
    return {
      x: randomBetween(spriteSize * 0.7, Math.max(spriteSize * 0.7, width - spriteSize * 0.7)),
      y: randomBetween(minY, maxY),
    }
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

function getTankSurpriseTarget(
  surprise: TankSurprise,
  index: number,
  creatureCount: number,
  spriteSize: number,
  width: number,
  height: number,
  time: number,
) {
  const centerX = width * 0.5
  const centerY = height * 0.7
  const elapsed = time - surprise.startedAt
  const minX = spriteSize * 0.58
  const maxX = Math.max(minX, width - spriteSize * 0.58)
  const minY = spriteSize * 0.62
  const maxY = Math.max(minY, height - spriteSize * 1.1)

  if (surprise.kind === 'disco-pearl') {
    const angle = elapsed / 260 + index * ((Math.PI * 2) / Math.max(1, creatureCount))
    const radius = Math.min(width * 0.24, 115) + (index % 3) * 16
    return {
      x: Math.min(Math.max(centerX + Math.cos(angle) * radius, minX), maxX),
      y: Math.min(Math.max(centerY - 28 + Math.sin(angle) * radius * 0.46, minY), maxY),
    }
  }

  const retreatSide = index % 2 === 0 ? -1 : 1
  return {
    x: Math.min(Math.max(centerX + retreatSide * width * 0.42, minX), maxX),
    y: Math.min(Math.max(height * (0.28 + (index % 4) * 0.12), minY), maxY),
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
