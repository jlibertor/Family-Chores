import { useEffect, useMemo, useRef, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import Matter from 'matter-js'
import { generateBugObituary } from '../../lib/bugs/bugObituaries'

export type ActiveBugViewModel = {
  earnedBugId: string
  bugId: string
  displayName: string
  file: string
  earnedAt: string
  expiresAt: string
}

type BugPhysicsBoxProps = {
  bugs: ActiveBugViewModel[]
  onExplodeBug: (earnedBugId: string) => Promise<void> | void
}

type BugBody = {
  id: string
  body: Matter.Body
  size: number
}

type ExplodingBug = {
  earnedBugId: string
  displayName: string
  file: string
  x: number
  y: number
  size: number
}

const wallThickness = 80
const bugBoxDebugMode = true
const clickImpulseMultiplier = 2
const bugSickWarningClickCount = 115
const bugDeathClickCount = 150
const bugSickWarningMessage = 'The bugs are feeling sick.'
const bounceSounds = [
  { file: '/sounds/bugs/bug-bounce-boing.mp3', weight: 3 },
  { file: '/sounds/bugs/bug-bounce-bloop.mp3', weight: 3 },
  { file: '/sounds/bugs/bug-bounce-squeak.mp3', weight: 3 },
  { file: '/sounds/bugs/bug-bounce-pop.mp3', weight: 3 },
  { file: '/sounds/bugs/bug-bounce-wobble-rare.mp3', weight: 1 },
  { file: '/sounds/bugs/bug-bounce-giggle-rare.mp3', weight: 1 },
]
const mournSounds = [
  '/sounds/bugs/bug-mourn-cry-1.mp3',
  '/sounds/bugs/bug-mourn-cry-2.mp3',
  '/sounds/bugs/bug-mourn-cry-3.mp3',
  '/sounds/bugs/bug-mourn-cry-4.mp3',
]

function randomBetween(min: number, max: number) {
  return min + Math.random() * (max - min)
}

function getSpriteSize(width: number) {
  if (width <= 0) return 108
  return Math.min(Math.max(width * 0.16, 88), 120)
}

function randomInt(min: number, max: number) {
  return Math.floor(randomBetween(min, max + 1))
}

function getExplosionThreshold() {
  return bugDeathClickCount
}

function chooseBounceSound() {
  const totalWeight = bounceSounds.reduce((total, sound) => total + sound.weight, 0)
  let roll = Math.random() * totalWeight

  for (const sound of bounceSounds) {
    roll -= sound.weight
    if (roll <= 0) return sound.file
  }

  return bounceSounds[0].file
}

function playSound(file: string, volume = 0.45) {
  const audio = new Audio(file)
  audio.volume = volume
  void audio.play().catch(() => undefined)
}

function chooseMournSound() {
  return mournSounds[randomInt(0, mournSounds.length - 1)]
}

export function BugPhysicsBox({ bugs, onExplodeBug }: BugPhysicsBoxProps) {
  const containerRef = useRef<HTMLDivElement | null>(null)
  const spriteRefs = useRef(new Map<string, HTMLElement>())
  const bugBodiesRef = useRef<BugBody[]>([])
  const engineRef = useRef<Matter.Engine | null>(null)
  const frameRef = useRef<number | null>(null)
  const pendingBounceRef = useRef(false)
  const explosionClickCountRef = useRef(0)
  const explosionCountRef = useRef(0)
  const currentThresholdRef = useRef<number | null>(null)
  const shakeTimeoutRef = useRef<number | null>(null)
  const explosionTimeoutRef = useRef<number | null>(null)
  const mournTimeoutRef = useRef<number | null>(null)
  const [boxSize, setBoxSize] = useState({ width: 0, height: 0 })
  const [explodingBug, setExplodingBug] = useState<ExplodingBug | null>(null)
  const [sadMode, setSadMode] = useState(false)
  const [sadShake, setSadShake] = useState(false)
  const [easterEggMessage, setEasterEggMessage] = useState('')
  const [debugClickCount, setDebugClickCount] = useState(0)
  const [debugThreshold, setDebugThreshold] = useState(8)
  const [debugExplosionNumber, setDebugExplosionNumber] = useState(1)
  const spriteSize = getSpriteSize(boxSize.width)

  const reducedMotion = useMemo(
    () => window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false,
    [],
  )
  const visibleBugs = useMemo(
    () => bugs.filter((bug) => bug.earnedBugId !== explodingBug?.earnedBugId),
    [bugs, explodingBug],
  )

  if (currentThresholdRef.current === null) {
    currentThresholdRef.current = getExplosionThreshold()
  }

  useEffect(() => {
    setDebugThreshold(currentThresholdRef.current ?? getExplosionThreshold())
  }, [])

  useEffect(() => {
    if (!containerRef.current) return undefined

    const observer = new ResizeObserver(([entry]) => {
      const width = Math.floor(entry.contentRect.width)
      const height = Math.floor(entry.contentRect.height)
      setBoxSize((current) => (current.width === width && current.height === height ? current : { width, height }))
    })

    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    if (visibleBugs.length === 0 || boxSize.width <= 0 || boxSize.height <= 0) {
      return undefined
    }

    const engine = Matter.Engine.create({ enableSleeping: false })
    engine.gravity.y = 0.42
    engineRef.current = engine

    const { width, height } = boxSize
    const radius = spriteSize / 2
    const wallInset = spriteSize * 0.24
    const innerLeft = wallInset + radius
    const innerRight = width - wallInset - radius
    const innerWidth = Math.max(1, innerRight - innerLeft)
    const columns = Math.max(1, Math.floor(innerWidth / (spriteSize + 8)) + 1)
    const rowCount = Math.max(1, Math.ceil(visibleBugs.length / columns))
    const bottomY = height - wallInset - radius
    const topY = wallInset + radius
    const availableStackHeight = Math.max(1, bottomY - topY)
    const rowGap = rowCount > 1 ? Math.min(spriteSize + 8, availableStackHeight / (rowCount - 1)) : 0
    const bodies = visibleBugs.map((bug, index) => {
      const column = index % columns
      const row = Math.floor(index / columns)
      const xStep = innerWidth / Math.max(1, columns - 1)
      const targetX = columns === 1 ? width / 2 : innerLeft + xStep * column
      const x = Math.min(innerRight, Math.max(innerLeft, targetX + randomBetween(-8, 8)))
      const y = Math.min(bottomY, Math.max(topY, bottomY - row * rowGap + randomBetween(-4, 4)))
      const body = Matter.Bodies.circle(x, y, radius, {
        restitution: 0.88,
        friction: 0.04,
        frictionAir: 0.025,
        density: 0.001,
      })

      Matter.Body.setAngularVelocity(body, randomBetween(-0.04, 0.04))
      return { id: bug.earnedBugId, body, size: spriteSize }
    })

    const walls = [
      Matter.Bodies.rectangle(width / 2, height - wallInset + wallThickness / 2, width + wallThickness * 2, wallThickness, {
        isStatic: true,
      }),
      Matter.Bodies.rectangle(width / 2, wallInset - wallThickness / 2, width + wallThickness * 2, wallThickness, {
        isStatic: true,
      }),
      Matter.Bodies.rectangle(wallInset - wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, {
        isStatic: true,
      }),
      Matter.Bodies.rectangle(width - wallInset + wallThickness / 2, height / 2, wallThickness, height + wallThickness * 2, {
        isStatic: true,
      }),
    ]

    bugBodiesRef.current = bodies
    Matter.Composite.add(engine.world, [...walls, ...bodies.map((bug) => bug.body)])

    if (pendingBounceRef.current) {
      pendingBounceRef.current = false
      window.requestAnimationFrame(() => {
        playSound(chooseBounceSound())
        const forceScale = (reducedMotion ? 0.35 : 1) * clickImpulseMultiplier

        for (const bug of bugBodiesRef.current) {
          Matter.Body.setStatic(bug.body, false)
          Matter.Sleeping.set(bug.body, false)
          Matter.Body.applyForce(bug.body, bug.body.position, {
            x: randomBetween(-0.045, 0.045) * forceScale,
            y: randomBetween(-0.105, -0.06) * forceScale,
          })
          Matter.Body.setAngularVelocity(bug.body, randomBetween(-0.35, 0.35) * forceScale)
        }
      })
    }

    let lastTime = performance.now()
    const tick = (time: number) => {
      const delta = Math.min(time - lastTime, 32)
      lastTime = time
      Matter.Engine.update(engine, delta)

      for (const bug of bugBodiesRef.current) {
        const sprite = spriteRefs.current.get(bug.id)
        if (!sprite) continue

        const { x, y } = bug.body.position
        sprite.style.transform = `translate3d(${x - bug.size / 2}px, ${y - bug.size / 2}px, 0) rotate(${bug.body.angle}rad)`
      }

      frameRef.current = window.requestAnimationFrame(tick)
    }

    frameRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (frameRef.current !== null) {
        window.cancelAnimationFrame(frameRef.current)
        frameRef.current = null
      }

      Matter.Composite.clear(engine.world, false, true)
      Matter.Engine.clear(engine)
      bugBodiesRef.current = []
      engineRef.current = null
    }
  }, [boxSize, visibleBugs, spriteSize, reducedMotion])

  useEffect(() => () => {
    if (shakeTimeoutRef.current !== null) window.clearTimeout(shakeTimeoutRef.current)
    if (explosionTimeoutRef.current !== null) window.clearTimeout(explosionTimeoutRef.current)
    if (mournTimeoutRef.current !== null) window.clearTimeout(mournTimeoutRef.current)
  }, [])

  function bounceBody(bug: BugBody, forceScale: number) {
    Matter.Body.setStatic(bug.body, false)
    Matter.Sleeping.set(bug.body, false)
    Matter.Body.applyForce(bug.body, bug.body.position, {
      x: randomBetween(-0.045, 0.045) * forceScale,
      y: randomBetween(-0.105, -0.06) * forceScale,
    })
    Matter.Body.setAngularVelocity(bug.body, randomBetween(-0.35, 0.35) * forceScale)
  }

  function bounceBugs(playAudio = true) {
    if (bugBodiesRef.current.length === 0) {
      pendingBounceRef.current = visibleBugs.length > 0
      return
    }

    if (playAudio) playSound(chooseBounceSound())
    const forceScale = (reducedMotion ? 0.35 : 1) * clickImpulseMultiplier

    for (const bug of bugBodiesRef.current) {
      bounceBody(bug, forceScale)
    }
  }

  function bounceOneBug(earnedBugId: string) {
    const bug = bugBodiesRef.current.find((item) => item.id === earnedBugId)
    if (!bug) {
      pendingBounceRef.current = visibleBugs.length > 0
      return
    }

    playSound(chooseBounceSound())
    bounceBody(bug, (reducedMotion ? 0.35 : 1) * clickImpulseMultiplier * 2)
  }

  function triggerExplosion(bug: ActiveBugViewModel) {
    const bugBody = bugBodiesRef.current.find((item) => item.id === bug.earnedBugId)
    const position = bugBody?.body.position ?? { x: boxSize.width / 2, y: boxSize.height / 2 }
    const size = bugBody?.size ?? spriteSize

    if (bugBody && engineRef.current) {
      Matter.Composite.remove(engineRef.current.world, bugBody.body)
      bugBodiesRef.current = bugBodiesRef.current.filter((item) => item.id !== bug.earnedBugId)
    }

    setExplodingBug({
      earnedBugId: bug.earnedBugId,
      displayName: bug.displayName,
      file: bug.file,
      x: position.x,
      y: position.y,
      size,
    })
    setSadMode(true)
    setSadShake(!reducedMotion)
    const explosionCount = explosionCountRef.current
    setEasterEggMessage(
      explosionCount === 0
        ? 'You killed one of your bugs. Please be more careful.'
        : generateBugObituary().message,
    )
    explosionCountRef.current = explosionCount + 1
    currentThresholdRef.current = getExplosionThreshold()
    explosionClickCountRef.current = 0
    setDebugClickCount(0)
    setDebugThreshold(currentThresholdRef.current)
    setDebugExplosionNumber(explosionCountRef.current + 1)
    playSound('/sounds/bugs/bug-overclick-explosion.mp3', 0.55)

    if (shakeTimeoutRef.current !== null) window.clearTimeout(shakeTimeoutRef.current)
    shakeTimeoutRef.current = window.setTimeout(() => setSadShake(false), reducedMotion ? 300 : 2500)

    if (explosionTimeoutRef.current !== null) window.clearTimeout(explosionTimeoutRef.current)
    explosionTimeoutRef.current = window.setTimeout(() => setExplodingBug(null), 650)

    if (mournTimeoutRef.current !== null) window.clearTimeout(mournTimeoutRef.current)
    mournTimeoutRef.current = window.setTimeout(() => playSound(chooseMournSound(), 0.5), 1600)

    void Promise.resolve(onExplodeBug(bug.earnedBugId)).catch(() => undefined)
  }

  function handleBoxClick(clickedBugId?: string) {
    if (visibleBugs.length === 0) return

    explosionClickCountRef.current += 1
    setDebugClickCount(explosionClickCountRef.current)

    if (explosionClickCountRef.current >= bugSickWarningClickCount && easterEggMessage !== bugSickWarningMessage) {
      setEasterEggMessage(bugSickWarningMessage)
    }

    if (explosionClickCountRef.current >= (currentThresholdRef.current ?? getExplosionThreshold())) {
      triggerExplosion(visibleBugs[randomInt(0, visibleBugs.length - 1)])
      return
    }

    if (clickedBugId) {
      bounceOneBug(clickedBugId)
      return
    }

    bounceBugs()
  }

  function handleBugClick(event: MouseEvent<HTMLButtonElement>, earnedBugId: string) {
    event.stopPropagation()
    handleBoxClick(earnedBugId)
  }

  return (
    <div className="bug-play-shell">
      <div
        ref={containerRef}
        className={`bug-play-box${visibleBugs.length > 0 ? ' interactive' : ''}${sadMode ? ' sad-mode' : ''}`}
        role={visibleBugs.length > 0 ? 'button' : 'group'}
        tabIndex={visibleBugs.length > 0 ? 0 : undefined}
        aria-label={
          visibleBugs.length > 0
            ? `Bounce ${visibleBugs.length} active bugs in the Bug Box`
            : 'No active bugs in the Bug Box'
        }
        onClick={() => handleBoxClick()}
        onKeyDown={(event) => {
          if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            bounceBugs()
          }
        }}
      >
        {visibleBugs.length === 0 ? (
          <div className="bug-box-empty">
            <h2>No bugs yet.</h2>
            <p>Complete a chore to catch one!</p>
          </div>
        ) : (
          visibleBugs.map((bug) => {
            return (
              <button
                type="button"
                key={bug.earnedBugId}
                ref={(node) => {
                  if (node) {
                    spriteRefs.current.set(bug.earnedBugId, node)
                  } else {
                    spriteRefs.current.delete(bug.earnedBugId)
                  }
                }}
                className={`bug-sprite${sadMode ? ' muted' : ''}${sadShake ? ' sad-shake' : ''}`}
                aria-label={`Bounce ${bug.displayName} bug faster`}
                onClick={(event) => handleBugClick(event, bug.earnedBugId)}
                style={{ width: spriteSize, height: spriteSize }}
              >
                <img className="bug-sprite-image" src={bug.file} alt={`${bug.displayName} bug`} draggable={false} />
              </button>
            )
          })
        )}

        {explodingBug && (
          <div
            className="bug-explosion"
            aria-label={`${explodingBug.displayName} exploded`}
            style={{
              left: explodingBug.x - explodingBug.size / 2,
              top: explodingBug.y - explodingBug.size / 2,
              width: explodingBug.size,
              height: explodingBug.size,
            }}
          >
            <img src={explodingBug.file} alt="" aria-hidden="true" />
            {Array.from({ length: 10 }, (_, index) => (
              <span
                key={index}
                style={{
                  '--dx': `${Math.cos((index / 10) * Math.PI * 2) * randomBetween(32, 64)}px`,
                  '--dy': `${Math.sin((index / 10) * Math.PI * 2) * randomBetween(32, 64)}px`,
                } as CSSProperties}
              />
            ))}
          </div>
        )}
      </div>

      {easterEggMessage && (
        <section className="bug-easter-egg-message" aria-live="polite">
          <p>{easterEggMessage}</p>
        </section>
      )}

      {bugBoxDebugMode && (
        <p className="bug-debug-counter" aria-live="polite">
          Debug: {debugClickCount} / {debugThreshold} box clicks toward explosion {debugExplosionNumber}
        </p>
      )}
    </div>
  )
}
