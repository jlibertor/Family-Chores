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
  event_type: 'fed' | 'hatched'
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

// Quiet, periodic pleas when the tank is ignored. Sadder moods cry more
// often and a little louder, but never alarm-level on the kitchen tablet.
const cryBehavior: Record<AquariumMood, { minMs: number; maxMs: number; volume: number } | null> = {
  happy: null,
  content: null,
  hungry: { minMs: 180_000, maxMs: 320_000, volume: 0.18 },
  very_hungry: { minMs: 90_000, maxMs: 170_000, volume: 0.3 },
  sad: { minMs: 45_000, maxMs: 95_000, volume: 0.42 },
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
}: {
  aquarium: AquariumData | null
  onRecord: () => void
  onFriends: () => void
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
  const yesterdayRows = aquarium.leaderboard.yesterday ?? []
  const yesterdayCompletions = aquarium.yesterdayCompletions ?? []
  const yesterdayTotal = yesterdayRows.reduce((sum, row) => sum + row.completed_count, 0)
  const yesterdaySlackers = yesterdayRows.filter((row) => row.completed_count === 0)
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

        <section className={`aquarium-yesterday-card${yesterdayTotal === 0 ? ' all-skipped' : ''}`}>
          <div className="aquarium-card-heading">
            <h2>Yesterday</h2>
            <strong>{yesterdayTotal === 0 ? 'Fish went hungry' : `${yesterdayTotal} chore${yesterdayTotal === 1 ? '' : 's'}`}</strong>
          </div>
          {yesterdayTotal === 0 ? (
            <p className="aquarium-yesterday-warning">Nobody fed the fish yesterday. They cried all night.</p>
          ) : (
            <div className="aquarium-helper-list">
              {yesterdayRows.map((row) => (
                <span key={row.member_id} className={`aquarium-helper-row${row.completed_count === 0 ? ' skipped' : ''}`}>
                  <strong>{row.member_name}</strong>
                  <span>{row.completed_count === 0 ? 'no chores' : row.completed_count}</span>
                </span>
              ))}
            </div>
          )}
          {yesterdayTotal > 0 && yesterdaySlackers.length > 0 && (
            <p className="aquarium-yesterday-warning">
              {yesterdaySlackers.map((row) => row.member_name).join(', ')} did nothing yesterday.
            </p>
          )}
          {yesterdayCompletions.length > 0 && (
            <p className="aquarium-yesterday-detail">
              {yesterdayCompletions.map((item) => `${item.member_name}: ${item.chore_name}`).join(' · ')}
            </p>
          )}
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
}: {
  creatures: AquariumCreature[]
  eggs: AquariumEgg[]
  mood: AquariumMood
  events: AquariumEvent[]
}) {
  const tankRef = useRef<HTMLDivElement | null>(null)
  const spriteRefs = useRef(new Map<number, HTMLDivElement>())
  const swimmersRef = useRef(new Map<number, Swimmer>())
  const frameRef = useRef<number | null>(null)
  const lastTimeRef = useRef(0)
  const latestEventIdRef = useRef<number | null>(null)
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

      for (const creature of creatures) {
        const swimmer = swimmersRef.current.get(creature.id)
        const sprite = spriteRefs.current.get(creature.id)
        if (!swimmer || !sprite) continue

        const spriteSize = getCreatureSize(creature, size.width)
        if (time >= swimmer.pauseUntil) {
          const dx = swimmer.targetX - swimmer.x
          const dy = swimmer.targetY - swimmer.y
          const distance = Math.hypot(dx, dy)

          if (distance < 5) {
            const next = pickCreatureTarget(creature, size.width, size.height, spriteSize)
            swimmer.targetX = next.x
            swimmer.targetY = next.y
            swimmer.facing = next.x >= swimmer.x ? 1 : -1
            swimmer.speed = randomBetween(0.018, 0.042)
            swimmer.pauseUntil = time + randomBetween(mood === 'sad' ? 520 : 120, mood === 'happy' ? 700 : 1500)
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

      {feedNotice && <div className="aquarium-feed-notice">{feedNotice}</div>}

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
    return {
      x: randomBetween(spriteSize * 0.7, Math.max(spriteSize, width - spriteSize * 0.7)),
      y: randomBetween(height * 0.76, height * 0.86),
    }
  }

  if (creature.species_id === 'seahorse') {
    const target = pickTarget(width, height, spriteSize)
    return { ...target, y: Math.max(spriteSize, target.y - randomBetween(18, 70)) }
  }

  return pickTarget(width, height, spriteSize)
}

function CreatureArt({ speciesId, mood }: { speciesId: string; mood: AquariumMood }) {
  if (speciesId === 'angelfish') return <Angelfish mood={mood} />
  if (speciesId === 'seahorse') return <Seahorse mood={mood} />
  if (speciesId === 'crab') return <Crab mood={mood} />
  if (speciesId === 'pufferfish') return <Pufferfish mood={mood} />
  if (speciesId === 'starfish') return <Starfish mood={mood} />
  return <Clownfish mood={mood} />
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
