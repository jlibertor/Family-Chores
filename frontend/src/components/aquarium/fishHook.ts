export type FishHookMood = 'happy' | 'content' | 'peckish' | 'hungry' | 'very_hungry' | 'sad'

export type FishHookProfile = {
  cycleMs: number
  wormChance: number
  captureChance: number
}

const minuteMs = 60_000

export const fishHookProfiles: Readonly<Record<FishHookMood, FishHookProfile | null>> = {
  happy: null,
  content: null,
  peckish: { cycleMs: 15 * minuteMs, wormChance: 0, captureChance: 0 },
  hungry: { cycleMs: 10 * minuteMs, wormChance: 0.75, captureChance: 0 },
  very_hungry: { cycleMs: 7 * minuteMs, wormChance: 1, captureChance: 0.1 },
  sad: { cycleMs: 5 * minuteMs, wormChance: 1, captureChance: 0.25 },
}

// Kept as the default/longest active interval for callers that need a reference value.
export const fishHookCycleMs = 15 * minuteMs
export const fishHookLowerMs = 3_600
export const fishHookHoldMs = 20_000
export const fishHookRetractMs = 3_400
export const fishHookActiveMs = fishHookLowerMs + fishHookHoldMs + fishHookRetractMs

export type ManualFishHookDrop = {
  startedAt: number
  hasWorm: boolean
  canTakeFish?: boolean
}

export type AutomaticFishHookCycle = {
  cycleKey: string
  cycleId: number
  mood: FishHookMood
  cycleMs: number
  hasWorm: boolean
  canTakeFish: boolean
}

export type FishHookPosition = {
  visible: boolean
  x: number
  y: number
  attraction: number
  hasWorm: boolean
  canTakeFish: boolean
  takeReady: boolean
}

export function getFishHookProfile(mood: FishHookMood): FishHookProfile | null {
  return fishHookProfiles[mood]
}

export function getAutomaticFishHookCycle(
  wallClockTime: number,
  mood: FishHookMood,
  currentCycle: AutomaticFishHookCycle | null,
  random: () => number = Math.random,
): AutomaticFishHookCycle | null {
  const profile = getFishHookProfile(mood)
  if (!profile) return null

  const cycleId = Math.floor(wallClockTime / profile.cycleMs)
  const cycleKey = `${mood}:${cycleId}`
  if (currentCycle?.cycleKey === cycleKey) return currentCycle

  const hasWorm = profile.wormChance >= 1
    || (profile.wormChance > 0 && random() < profile.wormChance)
  // The Worker owns the authoritative capture roll. The client only marks
  // severe baited hooks as capable of asking for that idempotent server result.
  const canTakeFish = hasWorm && profile.captureChance > 0

  return {
    cycleKey,
    cycleId,
    mood,
    cycleMs: profile.cycleMs,
    hasWorm,
    canTakeFish,
  }
}

function smoothStep(value: number) {
  return value * value * (3 - 2 * value)
}

function hiddenFishHook(): FishHookPosition {
  return {
    visible: false,
    x: 0,
    y: 0,
    attraction: 0,
    hasWorm: false,
    canTakeFish: false,
    takeReady: false,
  }
}

export function getFishHookPosition(
  width: number,
  height: number,
  animationTime: number,
  wallClockTime: number,
  automaticCycle: AutomaticFishHookCycle | null,
  manualDrop: ManualFishHookDrop | null = null,
): FishHookPosition {
  if (!manualDrop && !automaticCycle) return hiddenFishHook()

  const phase = manualDrop
    ? animationTime - manualDrop.startedAt
    : wallClockTime % (automaticCycle?.cycleMs ?? fishHookCycleMs)
  if (phase < 0 || phase >= fishHookActiveMs) return hiddenFishHook()

  const targetY = height * 0.6
  const x = width * 0.58 + Math.sin(animationTime / 2600) * Math.min(34, width * 0.04)
  let progress = 1

  if (phase < fishHookLowerMs) {
    progress = smoothStep(phase / fishHookLowerMs)
  } else if (phase > fishHookLowerMs + fishHookHoldMs) {
    progress = 1 - smoothStep((phase - fishHookLowerMs - fishHookHoldMs) / fishHookRetractMs)
  }

  const hasWorm = manualDrop?.hasWorm ?? automaticCycle?.hasWorm ?? false
  const canTakeFish = manualDrop?.canTakeFish ?? automaticCycle?.canTakeFish ?? false

  return {
    visible: true,
    x,
    y: targetY * progress,
    attraction: hasWorm ? Math.min(1, progress * 1.35) : 0,
    hasWorm,
    canTakeFish,
    takeReady: canTakeFish
      && phase >= fishHookLowerMs
      && phase < fishHookLowerMs + fishHookHoldMs,
  }
}
