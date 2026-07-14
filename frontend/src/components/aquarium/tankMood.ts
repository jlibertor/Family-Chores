export type TankMood = 'happy' | 'content' | 'peckish' | 'hungry' | 'very_hungry' | 'sad'

export type TankVocalStyle = 'delight' | 'quiet' | 'complaint' | 'moan'

export type TankMoodBehavior = {
  cruiseSpeedMultiplier: number
  reactionSpeedMultiplier: number
  pauseMinMs: number
  pauseMaxMs: number
  bubbleIntervalMs: number
  vocalIntervalMinMs: number
  vocalIntervalMaxMs: number
  vocalVolume: number
  vocalStyle: TankVocalStyle
  sparkleIntensity: number
  gloomIntensity: number
}

export const tankMoodBehaviors: Readonly<Record<TankMood, TankMoodBehavior>> = {
  happy: {
    cruiseSpeedMultiplier: 1.75,
    reactionSpeedMultiplier: 1.5,
    pauseMinMs: 80,
    pauseMaxMs: 320,
    bubbleIntervalMs: 700,
    vocalIntervalMinMs: 45_000,
    vocalIntervalMaxMs: 90_000,
    vocalVolume: 0.34,
    vocalStyle: 'delight',
    sparkleIntensity: 1,
    gloomIntensity: 0,
  },
  content: {
    cruiseSpeedMultiplier: 1.1,
    reactionSpeedMultiplier: 1,
    pauseMinMs: 280,
    pauseMaxMs: 850,
    bubbleIntervalMs: 1_100,
    vocalIntervalMinMs: 210_000,
    vocalIntervalMaxMs: 330_000,
    vocalVolume: 0.16,
    vocalStyle: 'quiet',
    sparkleIntensity: 0.18,
    gloomIntensity: 0,
  },
  peckish: {
    cruiseSpeedMultiplier: 0.82,
    reactionSpeedMultiplier: 0.82,
    pauseMinMs: 750,
    pauseMaxMs: 1_500,
    bubbleIntervalMs: 1_450,
    vocalIntervalMinMs: 180_000,
    vocalIntervalMaxMs: 300_000,
    vocalVolume: 0.18,
    vocalStyle: 'complaint',
    sparkleIntensity: 0,
    gloomIntensity: 0.12,
  },
  hungry: {
    cruiseSpeedMultiplier: 0.58,
    reactionSpeedMultiplier: 0.62,
    pauseMinMs: 1_400,
    pauseMaxMs: 2_800,
    bubbleIntervalMs: 1_950,
    vocalIntervalMinMs: 105_000,
    vocalIntervalMaxMs: 190_000,
    vocalVolume: 0.23,
    vocalStyle: 'complaint',
    sparkleIntensity: 0,
    gloomIntensity: 0.35,
  },
  very_hungry: {
    cruiseSpeedMultiplier: 0.34,
    reactionSpeedMultiplier: 0.42,
    pauseMinMs: 2_600,
    pauseMaxMs: 4_800,
    bubbleIntervalMs: 2_650,
    vocalIntervalMinMs: 45_000,
    vocalIntervalMaxMs: 90_000,
    vocalVolume: 0.31,
    vocalStyle: 'moan',
    sparkleIntensity: 0,
    gloomIntensity: 0.7,
  },
  sad: {
    cruiseSpeedMultiplier: 0.18,
    reactionSpeedMultiplier: 0.27,
    pauseMinMs: 4_200,
    pauseMaxMs: 7_200,
    bubbleIntervalMs: 3_600,
    vocalIntervalMinMs: 20_000,
    vocalIntervalMaxMs: 45_000,
    vocalVolume: 0.42,
    vocalStyle: 'moan',
    sparkleIntensity: 0,
    gloomIntensity: 1,
  },
}

export function getTankMoodBehavior(mood: TankMood): TankMoodBehavior {
  return tankMoodBehaviors[mood]
}
