export type TankReactionMode = 'startled' | 'wary' | 'curious' | 'engaged'

export type TankInteraction = {
  mode: TankReactionMode
  tapCount: number
  interest: number
  x: number
  y: number
  lastTapAt: number
  activeUntil: number
  memoryUntil: number
}

export type TankSwimmerPoint = {
  x: number
  y: number
  bobOffset: number
}

const maximumTapCount = 6
const interestCoolingStepMs = 3_000
const interestMemoryMs = 18_000

const reactionDurationMs: Record<TankReactionMode, number> = {
  startled: 420,
  wary: 1_350,
  curious: 2_800,
  engaged: 4_200,
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getReactionMode(tapCount: number): TankReactionMode {
  if (tapCount === 1) return 'startled'
  if (tapCount === 2) return 'wary'
  if (tapCount < 5) return 'curious'
  return 'engaged'
}

function getAwayDirection(swimmer: TankSwimmerPoint, interaction: TankInteraction, index: number) {
  let awayX = swimmer.x - interaction.x
  let awayY = swimmer.y - interaction.y
  let distance = Math.hypot(awayX, awayY)
  if (distance < 4) {
    const fallbackAngle = swimmer.bobOffset + index * 1.73
    awayX = Math.cos(fallbackAngle)
    awayY = Math.sin(fallbackAngle)
    distance = 1
  }

  return {
    x: awayX / distance,
    y: awayY / distance,
    distance,
  }
}

export function registerTankTap(
  current: TankInteraction | null,
  x: number,
  y: number,
  now: number,
): TankInteraction {
  const elapsedSinceLastTap = current === null ? Number.POSITIVE_INFINITY : Math.max(0, now - current.lastTapAt)
  const remembersVisitor = current !== null && elapsedSinceLastTap <= interestMemoryMs
  const cooledTapCount = remembersVisitor
    ? Math.max(0, current.tapCount - Math.floor(elapsedSinceLastTap / interestCoolingStepMs))
    : 0
  const tapCount = Math.min(maximumTapCount, cooledTapCount + 1)
  const interest = (tapCount - 1) / (maximumTapCount - 1)
  const mode = getReactionMode(tapCount)

  return {
    mode,
    tapCount,
    interest,
    x,
    y,
    lastTapAt: now,
    activeUntil: now + reactionDurationMs[mode],
    memoryUntil: now + interestMemoryMs,
  }
}

export function getTankReactionTarget(
  interaction: TankInteraction,
  swimmer: TankSwimmerPoint,
  index: number,
  creatureCount: number,
  spriteSize: number,
  width: number,
  height: number,
  animationTime: number,
  bottomDweller = false,
) {
  const minX = spriteSize * 0.58
  const maxX = Math.max(minX, width - spriteSize * 0.58)
  const minY = spriteSize * 0.64
  const maxY = Math.max(minY, height - spriteSize * 0.92)
  const away = getAwayDirection(swimmer, interaction, index)

  if (interaction.mode === 'startled') {
    // A knock close to a fish earns a quick flinch. Fish across the tank only
    // shuffle away, so one tap does not send the whole school to the walls.
    const proximity = clamp(1 - away.distance / (Math.max(width, height) * 0.85), 0.1, 1)
    const travel = spriteSize * (0.18 + (index % 3) * 0.03) + Math.max(width, height) * 0.06 * proximity
    const spread = (index - (creatureCount - 1) / 2) * Math.min(4, spriteSize * 0.035)
    return {
      x: clamp(swimmer.x + away.x * travel - away.y * spread, minX, maxX),
      y: bottomDweller
        ? clamp(height * 0.84, minY, maxY)
        : clamp(swimmer.y + away.y * travel + away.x * spread, minY, maxY),
    }
  }

  if (interaction.mode === 'wary') {
    // The second knock is interesting, but the fish keep a puppy-like
    // standoff and sidle toward it instead of charging or fleeing again.
    const standoff = spriteSize * (1.75 + (index % 3) * 0.16)
    const peek = Math.sin(animationTime / 480 + swimmer.bobOffset) * spriteSize * 0.12
    return {
      x: clamp(interaction.x + away.x * standoff - away.y * peek, minX, maxX),
      y: bottomDweller
        ? clamp(height * 0.84, minY, maxY)
        : clamp(interaction.y + away.y * standoff + away.x * peek, minY, maxY),
    }
  }

  // Curiosity draws the school into a loose, moving ring. Each additional tap
  // tightens the ring; fully engaged fish bustle right up to the visitor and
  // weave around one another rather than toggling back to an escape response.
  const engaged = interaction.mode === 'engaged'
  const angle = animationTime / (engaged ? 760 : 1_350)
    + index * ((Math.PI * 2) / Math.max(1, creatureCount))
    + swimmer.bobOffset * 0.15
  const baseRadius = spriteSize * (1.28 - interaction.interest * 0.36 + (index % 3) * 0.14)
  const pulse = 1 + Math.sin(animationTime / (engaged ? 230 : 410) + index * 1.9) * (engaged ? 0.16 : 0.1)
  const radius = baseRadius * pulse

  return {
    x: clamp(interaction.x + Math.cos(angle) * radius, minX, maxX),
    y: bottomDweller
      ? clamp(height * 0.84, minY, maxY)
      : clamp(interaction.y + Math.sin(angle) * radius * (engaged ? 0.82 : 0.68), minY, maxY),
  }
}

export function getTankReactionSpeed(
  mode: TankReactionMode,
  cruiseSpeed: number,
  moodMultiplier = 1,
) {
  const safeMoodMultiplier = Math.max(0, moodMultiplier)
  if (mode === 'engaged') return Math.max(0.12, cruiseSpeed * 4.6) * safeMoodMultiplier
  if (mode === 'startled') return Math.max(0.075, cruiseSpeed * 2.4) * safeMoodMultiplier
  if (mode === 'wary') return Math.max(0.07, cruiseSpeed * 2.1) * safeMoodMultiplier
  return Math.max(0.085, cruiseSpeed * 2.9) * safeMoodMultiplier
}
