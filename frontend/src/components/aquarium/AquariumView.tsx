import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties } from 'react'

export type AquariumMood = 'happy' | 'content' | 'hungry' | 'very_hungry' | 'sad'
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

const cryAudioSources = [
  '/sounds/bugs/bug-mourn-cry-1.mp3',
  '/sounds/bugs/bug-mourn-cry-2.mp3',
  '/sounds/bugs/bug-mourn-cry-3.mp3',
  '/sounds/bugs/bug-mourn-cry-4.mp3',
]

// Periodic pleas when the tank is ignored. Sadder moods cry more
// often and a little louder, but never alarm-level on the kitchen tablet.
const cryBehavior: Record<AquariumMood, { minMs: number; maxMs: number; volume: number } | null> = {
  happy: null,
  content: null,
  hungry: { minMs: 60_000, maxMs: 120_000, volume: 0.22 },
  very_hungry: { minMs: 25_000, maxMs: 55_000, volume: 0.35 },
  sad: { minMs: 12_000, maxMs: 28_000, volume: 0.5 },
}

function playCry(volume: number) {
  const source = cryAudioSources[Math.floor(Math.random() * cryAudioSources.length)]
  const audio = new Audio(source)
  audio.volume = volume
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

const aquariumSpecies = ['clownfish', 'angelfish', 'seahorse', 'crab', 'pufferfish', 'starfish'] as const

const speciesLabels: Record<string, string> = {
  clownfish: 'Clownfish',
  angelfish: 'Angelfish',
  seahorse: 'Seahorse',
  crab: 'Crab',
  pufferfish: 'Pufferfish',
  starfish: 'Starfish',
}

const moodLabels: Record<AquariumMood, string> = {
  happy: 'Happy',
  content: 'Content',
  hungry: 'Hungry',
  very_hungry: 'Very Hungry',
  sad: 'Resting',
}

const moodSpeed: Record<AquariumMood, number> = {
  happy: 1.12,
  content: 0.88,
  hungry: 0.68,
  very_hungry: 0.48,
  sad: 0.28,
}

const fishHookCycleMs = 40_000
const fishHookLowerMs = 3_600
const fishHookHoldMs = 20_000
const fishHookRetractMs = 3_400

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function getCreatureSize(creature: AquariumCreature, tankWidth: number) {
  const baseSize = creature.growth_stage === 'adult' ? 110 : 74
  const responsiveSize = tankWidth > 0 ? tankWidth * (creature.growth_stage === 'adult' ? 0.12 : 0.085) : baseSize
  return Math.round(Math.min(Math.max(responsiveSize, baseSize * 0.82), baseSize * 1.22))
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

function formatDiscoveryDate(value: string) {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(`${value}Z`))
}

export function AquariumView({
  aquarium,
  onRecord,
  onFriends,
  onPanic,
  onTextMode,
  textModeSubmitting,
  fishTextActiveUntil,
}: {
  aquarium: AquariumData | null
  fishTextActiveUntil: string | null
  onRecord: () => void
  onFriends: () => void
  onPanic: () => void
  onTextMode: () => void
  textModeSubmitting: boolean
}) {
  const [leaderboardRange, setLeaderboardRange] = useState<AquariumLeaderboardRange>('today')

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

  return (
    <section className={`screen aquarium-screen aquarium-mood-${aquarium.state.mood}`}>
      <section className="aquarium-stage">
        <AquariumScene
          creatures={aquarium.creatures.length > 0 ? aquarium.creatures : [starterClownfish]}
          eggs={pendingEggs}
          mood={aquarium.state.mood}
          events={aquarium.events}
          fishTextActiveUntil={fishTextActiveUntil}
        />

        <div className="aquarium-status-strip" aria-live="polite">
          <div>
            <span>Mood</span>
            <strong>{moodLabels[aquarium.state.mood]}</strong>
          </div>
          <div>
            <span>Food</span>
            <strong>
              {aquarium.state.food_reserve}/{aquarium.state.max_food_reserve}
            </strong>
          </div>
          <div>
            <span>Friends</span>
            <strong>{aquarium.creatures.length + pendingEggs.length}</strong>
          </div>
        </div>
      </section>

      <aside className="aquarium-side-panel">
        <section className="aquarium-summary">
          <p className="eyebrow">Family Aquarium</p>
          <h1>{moodLabels[aquarium.state.mood]}</h1>
          <p>{aquarium.state.mood_message}</p>
        </section>

        <section className="aquarium-food-card">
          <div className="aquarium-card-heading">
            <h2>Food reserve</h2>
            <strong>{foodPercent}%</strong>
          </div>
          <div className="aquarium-food-meter" aria-label={`Food reserve ${foodPercent}%`}>
            <span style={{ width: `${foodPercent}%` }} />
          </div>
          <p>
            Last fed{' '}
            {aquarium.state.hours_since_fed <= 1
              ? 'less than an hour ago'
              : aquarium.state.hours_since_fed < 24
                ? `${aquarium.state.hours_since_fed} hours ago`
                : `${Math.floor(aquarium.state.hours_since_fed / 24)} day${aquarium.state.hours_since_fed >= 48 ? 's' : ''} ago`}
            . Uses {aquarium.state.daily_food_consumption} food each day. Next friend in {nextMilestoneRemaining}{' '}
            chore{nextMilestoneRemaining === 1 ? '' : 's'}.
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
        <button type="button" className="secondary-action aquarium-text-action" onClick={onTextMode} disabled={textModeSubmitting}>
          {textModeSubmitting ? 'texting' : 'text'}
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
}: {
  creatures: AquariumCreature[]
  eggs: AquariumEgg[]
  mood: AquariumMood
  events: AquariumEvent[]
  fishTextActiveUntil: string | null
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
  const bubbleTimeoutsRef = useRef<number[]>([])
  const [size, setSize] = useState({ width: 0, height: 0 })
  const [bursts, setBursts] = useState<BubbleBurst[]>([])
  const [food, setFood] = useState<FallingFood[]>([])
  const [ambientBubbles, setAmbientBubbles] = useState<AmbientBubble[]>([])
  const [hearts, setHearts] = useState<FloatingHeart[]>([])
  const [feedNotice, setFeedNotice] = useState('')

  // Browsers block audio until the page is touched once; warming the audio
  // context on the first interaction makes cries and chimes work afterward.
  useEffect(() => {
    const unlock = () => getAudioContext()
    window.addEventListener('pointerdown', unlock, { passive: true })
    return () => window.removeEventListener('pointerdown', unlock)
  }, [])

  useEffect(() => {
    fishTextActiveUntilRef.current = fishTextActiveUntil ? parseUtcLikeTimestamp(fishTextActiveUntil) : null
  }, [fishTextActiveUntil])

  // Periodic soft cries while the tank is hungry or sad.
  useEffect(() => {
    const behavior = cryBehavior[mood]
    if (!behavior) return undefined

    let cancelled = false
    let timeoutId = 0

    const scheduleNext = (delayMs: number) => {
      timeoutId = window.setTimeout(() => {
        if (cancelled) return
        playCry(behavior.volume)
        scheduleNext(randomBetween(behavior.minMs, behavior.maxMs))
      }, delayMs)
    }

    scheduleNext(randomBetween(behavior.minMs * 0.25, behavior.minMs * 0.75))

    return () => {
      cancelled = true
      window.clearTimeout(timeoutId)
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

    const newBursts = newEvents.flatMap((event) =>
      Array.from({ length: event.event_type === 'hatched' ? 18 : 10 }, (_, index) => ({
        id: event.id * 100 + index,
        x: randomBetween(size.width * 0.18, size.width * 0.82),
        y: randomBetween(size.height * 0.35, size.height * 0.84),
        size: randomBetween(10, event.event_type === 'hatched' ? 26 : 20),
      })),
    )

    const latestFedEvent = newEvents.find((event) => event.event_type === 'fed')
    if (latestFedEvent) {
      setFeedNotice(latestFedEvent.message)
      playFeedChime()
      const noticeTimeout = window.setTimeout(() => setFeedNotice(''), 3600)
      bubbleTimeoutsRef.current.push(noticeTimeout)

      const newHearts = Array.from({ length: 9 }, (_, index) => ({
        id: latestFedEvent.id * 10_000 + index,
        x: randomBetween(size.width * 0.2, size.width * 0.8),
        y: randomBetween(size.height * 0.3, size.height * 0.7),
        size: randomBetween(16, 30),
        delayMs: index * 160,
      }))
      setHearts((current) => [...current, ...newHearts].slice(-18))
      const heartsTimeout = window.setTimeout(() => {
        setHearts((current) => current.filter((heart) => !newHearts.some((newHeart) => newHeart.id === heart.id)))
      }, 3800)
      bubbleTimeoutsRef.current.push(heartsTimeout)

      const foodDrops = Array.from({ length: 7 }, (_, index) => ({
        id: latestFedEvent.id * 1000 + index,
        x: randomBetween(size.width * 0.32, size.width * 0.68),
        y: randomBetween(18, 48),
        targetY: randomBetween(size.height * 0.38, size.height * 0.62),
      }))
      setFood((current) => [...current, ...foodDrops].slice(-16))

      const foodTarget = foodDrops[0]
      for (const swimmer of swimmersRef.current.values()) {
        swimmer.targetX = foodTarget.x + randomBetween(-52, 52)
        swimmer.targetY = foodTarget.targetY + randomBetween(-26, 26)
        swimmer.pauseUntil = 0
        swimmer.moodBoostUntil = performance.now() + 4500
      }

      const foodTimeout = window.setTimeout(() => {
        setFood((current) => current.filter((item) => !foodDrops.some((drop) => drop.id === item.id)))
      }, 4200)
      bubbleTimeoutsRef.current.push(foodTimeout)
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

    setBursts((current) => [...current, ...newBursts].slice(-36))
    const timeoutId = window.setTimeout(() => {
      setBursts((current) => current.filter((burst) => !newBursts.some((newBurst) => newBurst.id === burst.id)))
    }, 2600)
    bubbleTimeoutsRef.current.push(timeoutId)
  }, [events, size.height, size.width])

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
      const hookPosition = getFishHookPosition(size.width, size.height, time)
      const hook = hookRef.current

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
        hook.style.height = `${Math.max(0, hookPosition.y)}px`
        hook.style.transform = `translate3d(${hookPosition.x - 22}px, 0, 0)`
      } else if (hook) {
        hook.classList.remove('lowered')
        hook.style.removeProperty('height')
        hook.style.removeProperty('transform')
      }

      for (const [index, creature] of creatures.entries()) {
        const swimmer = swimmersRef.current.get(creature.id)
        const sprite = spriteRefs.current.get(creature.id)
        if (!swimmer || !sprite) continue

        const spriteSize = getCreatureSize(creature, size.width)
        if (phonePosition) {
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
        } else if (hookPosition.visible && hookPosition.attraction > 0) {
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
        const wiggle = time < swimmer.moodBoostUntil ? Math.sin(time / 140 + swimmer.bobOffset) * 5 : 0
        const droop = mood === 'sad' ? 9 : mood === 'very_hungry' ? 4 : 0
        sprite.style.transform = `translate3d(${swimmer.x - spriteSize / 2}px, ${swimmer.y - spriteSize / 2 + floatY}px, 0) scaleX(${swimmer.facing}) rotate(${wiggle + droop}deg)`
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
      <div className="seaweed seaweed-one"><span /><span /><span /></div>
      <div className="seaweed seaweed-two"><span /><span /><span /></div>
      <div className="bubble-stream stream-one"><span /><span /><span /><span /></div>
      <div className="bubble-stream stream-two"><span /><span /><span /></div>
      <div ref={hookRef} className="aquarium-fish-hook" aria-hidden="true">
        <span className="fish-hook-line" />
        <svg className="fish-hook-art" viewBox="0 0 48 58" aria-hidden="true">
          <path className="fish-hook-shank" d="M30 4 C28 13 25 23 21 32" />
          <path className="fish-hook-bend" d="M21 32 C15 45 26 55 38 48 C47 43 44 30 33 31" />
          <path className="fish-hook-point" d="M33 31 L42 22" />
          <path className="fish-hook-barb" d="M33 31 L24 29" />
          <circle className="fish-hook-eye" cx="30" cy="4" r="3.6" />
          <circle className="fish-hook-glint" cx="39" cy="43" r="2.8" />
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
          <CreatureArt speciesId={creature.species_id} mood={mood} />
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

function getFishHookPosition(width: number, height: number, time: number) {
  const phase = time % fishHookCycleMs
  const activeMs = fishHookLowerMs + fishHookHoldMs + fishHookRetractMs
  if (phase >= activeMs) {
    return { visible: false, x: 0, y: 0, attraction: 0 }
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
    attraction: Math.min(1, progress * 1.35),
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

function CreatureArt({ speciesId, mood }: { speciesId: string; mood: AquariumMood }) {
  if (speciesId === 'angelfish') return <Angelfish mood={mood} />
  if (speciesId === 'seahorse') return <Seahorse mood={mood} />
  if (speciesId === 'crab') return <Crab mood={mood} />
  if (speciesId === 'pufferfish') return <Pufferfish mood={mood} />
  if (speciesId === 'starfish') return <Starfish mood={mood} />
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
  return (
    <svg viewBox="0 0 128 128" role="img" aria-hidden="true">
      <path
        d="M76 18 C49 15 38 45 56 60 C31 70 37 111 70 112 C91 113 97 91 80 82 C72 78 65 85 70 92 C75 99 86 95 83 84"
        fill="none"
        stroke="#0f766e"
        strokeLinecap="round"
        strokeWidth="24"
      />
      <path d="M76 18 C93 25 100 37 92 48 L113 45 L94 60" fill="#5eead4" stroke="#0f766e" strokeWidth="4" />
      <path d="M54 63 L33 53 L41 78 Z" fill="#99f6e4" stroke="#0f766e" strokeWidth="4" />
      <circle cx="80" cy="38" r="4.5" fill="#24313f" />
      {(mood === 'sad' || mood === 'very_hungry') && (
        <g className="creature-tears">
          <ellipse cx="80" cy="47" rx="2.6" ry="4" fill="#7dd3fc" />
        </g>
      )}
      <path
        d={
          mood === 'sad' || mood === 'very_hungry'
            ? 'M74 52 Q82 47 90 52'
            : mood === 'happy' || mood === 'content'
              ? 'M74 49 Q82 56 90 49'
              : 'M75 52 L89 52'
        }
        fill="none"
        stroke="#24313f"
        strokeLinecap="round"
        strokeWidth="4"
      />
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
