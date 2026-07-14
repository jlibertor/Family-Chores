import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getTankMoodBehavior,
  tankMoodBehaviors,
} from '../src/components/aquarium/tankMood.ts'

const moods = ['happy', 'content', 'peckish', 'hungry', 'very_hungry', 'sad']

test('every aquarium mood has a centralized behavior profile', () => {
  assert.deepEqual(Object.keys(tankMoodBehaviors), moods)
  for (const mood of moods) {
    assert.strictEqual(getTankMoodBehavior(mood), tankMoodBehaviors[mood])
  }
})

test('motion becomes strongly slower and more lethargic as the tank worsens', () => {
  const behaviors = moods.map(getTankMoodBehavior)

  for (let index = 1; index < behaviors.length; index += 1) {
    const better = behaviors[index - 1]
    const worse = behaviors[index]
    assert.ok(better.cruiseSpeedMultiplier > worse.cruiseSpeedMultiplier)
    assert.ok(better.reactionSpeedMultiplier > worse.reactionSpeedMultiplier)
    assert.ok(better.pauseMinMs < worse.pauseMinMs)
    assert.ok(better.pauseMaxMs < worse.pauseMaxMs)
    assert.ok(better.bubbleIntervalMs < worse.bubbleIntervalMs)
  }

  assert.ok(behaviors[0].cruiseSpeedMultiplier >= behaviors.at(-1).cruiseSpeedMultiplier * 9)
  assert.ok(behaviors[0].reactionSpeedMultiplier >= behaviors.at(-1).reactionSpeedMultiplier * 5)
})

test('visual atmosphere moves monotonically from sparkle to gloom', () => {
  const behaviors = moods.map(getTankMoodBehavior)

  for (let index = 1; index < behaviors.length; index += 1) {
    const better = behaviors[index - 1]
    const worse = behaviors[index]
    assert.ok(better.sparkleIntensity >= worse.sparkleIntensity)
    assert.ok(better.gloomIntensity <= worse.gloomIntensity)
  }

  assert.equal(behaviors[0].sparkleIntensity, 1)
  assert.equal(behaviors[0].gloomIntensity, 0)
  assert.equal(behaviors.at(-1).sparkleIntensity, 0)
  assert.equal(behaviors.at(-1).gloomIntensity, 1)
})

test('the emotional extremes use delight and moan ambience', () => {
  const happy = getTankMoodBehavior('happy')
  const sad = getTankMoodBehavior('sad')

  assert.equal(happy.vocalStyle, 'delight')
  assert.equal(sad.vocalStyle, 'moan')
  assert.ok(sad.vocalVolume > happy.vocalVolume)
  assert.ok(sad.vocalIntervalMaxMs <= happy.vocalIntervalMinMs)
})
