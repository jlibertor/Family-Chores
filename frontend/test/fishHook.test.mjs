import assert from 'node:assert/strict'
import test from 'node:test'

import {
  fishHookActiveMs,
  fishHookLowerMs,
  getAutomaticFishHookCycle,
  getFishHookPosition,
  getFishHookProfile,
} from '../src/components/aquarium/fishHook.ts'

test('hook profiles follow the mood-specific cadence and probability rules', () => {
  assert.equal(getFishHookProfile('happy'), null)
  assert.equal(getFishHookProfile('content'), null)
  assert.deepEqual(getFishHookProfile('peckish'), {
    cycleMs: 15 * 60_000,
    wormChance: 0,
    captureChance: 0,
  })
  assert.deepEqual(getFishHookProfile('hungry'), {
    cycleMs: 10 * 60_000,
    wormChance: 0.75,
    captureChance: 0,
  })
  assert.deepEqual(getFishHookProfile('very_hungry'), {
    cycleMs: 7 * 60_000,
    wormChance: 1,
    captureChance: 0.1,
  })
  assert.deepEqual(getFishHookProfile('sad'), {
    cycleMs: 5 * 60_000,
    wormChance: 1,
    captureChance: 0.25,
  })
})

test('happy and content moods disable automatic hook cycles', () => {
  assert.equal(getAutomaticFishHookCycle(1_000, 'happy', null), null)
  assert.equal(getAutomaticFishHookCycle(1_000, 'content', null), null)
})

test('automatic cycle results stay stable by mood and time slot', () => {
  const cycleMs = getFishHookProfile('hungry').cycleMs
  let randomCalls = 0
  const baitedCycle = getAutomaticFishHookCycle(cycleMs * 10, 'hungry', null, () => {
    randomCalls += 1
    return 0.749
  })
  const sameCycle = getAutomaticFishHookCycle(
    cycleMs * 10 + cycleMs - 1,
    'hungry',
    baitedCycle,
    () => {
      randomCalls += 1
      return 0.99
    },
  )

  assert.equal(baitedCycle.cycleKey, 'hungry:10')
  assert.equal(baitedCycle.hasWorm, true)
  assert.strictEqual(sameCycle, baitedCycle)
  assert.equal(randomCalls, 1)

  const moodChanged = getAutomaticFishHookCycle(cycleMs * 10, 'very_hungry', baitedCycle, () => {
    randomCalls += 1
    return 0.95
  })
  assert.notEqual(moodChanged.cycleKey, baitedCycle.cycleKey)
  assert.equal(moodChanged.mood, 'very_hungry')
  assert.equal(moodChanged.canTakeFish, true)
  assert.equal(randomCalls, 1)
})

test('worm boundaries are exclusive and severe hooks defer capture odds to the server', () => {
  const hungryCycleMs = getFishHookProfile('hungry').cycleMs
  assert.equal(
    getAutomaticFishHookCycle(hungryCycleMs, 'hungry', null, () => 0.749_999).hasWorm,
    true,
  )
  assert.equal(
    getAutomaticFishHookCycle(hungryCycleMs, 'hungry', null, () => 0.75).hasWorm,
    false,
  )

  const veryHungryCycleMs = getFishHookProfile('very_hungry').cycleMs
  const severeHook = getAutomaticFishHookCycle(veryHungryCycleMs, 'very_hungry', null, () => 0.99)
  assert.equal(severeHook.hasWorm, true)
  assert.equal(severeHook.canTakeFish, true)
})

test('peckish hooks are always unbaited and sad hooks are always baited', () => {
  let peckishRandomCalls = 0
  const peckish = getAutomaticFishHookCycle(0, 'peckish', null, () => {
    peckishRandomCalls += 1
    return 0
  })
  const sad = getAutomaticFishHookCycle(0, 'sad', null, () => 0.99)

  assert.equal(peckish.hasWorm, false)
  assert.equal(peckish.canTakeFish, false)
  assert.equal(peckishRandomCalls, 0)
  assert.equal(sad.hasWorm, true)
  assert.equal(sad.canTakeFish, true)
})

test('capture-ready state is limited to the hold at full hook depth', () => {
  const cycle = {
    cycleKey: 'sad:10',
    cycleId: 10,
    mood: 'sad',
    cycleMs: 5 * 60_000,
    hasWorm: true,
    canTakeFish: true,
  }
  const lowering = getFishHookPosition(1_000, 600, 0, cycle.cycleMs * 10 + fishHookLowerMs - 1, cycle)
  const holding = getFishHookPosition(1_000, 600, 0, cycle.cycleMs * 10 + fishHookLowerMs, cycle)
  const hidden = getFishHookPosition(1_000, 600, 0, cycle.cycleMs * 10 + fishHookActiveMs, cycle)

  assert.equal(lowering.canTakeFish, true)
  assert.equal(lowering.takeReady, false)
  assert.equal(holding.takeReady, true)
  assert.deepEqual(hidden, {
    visible: false,
    x: 0,
    y: 0,
    attraction: 0,
    hasWorm: false,
    canTakeFish: false,
    takeReady: false,
  })
})

test('manual test drops work even when automatic hooks are disabled', () => {
  const position = getFishHookPosition(
    1_000,
    600,
    fishHookLowerMs,
    0,
    null,
    { startedAt: 0, hasWorm: true, canTakeFish: true },
  )

  assert.equal(position.visible, true)
  assert.equal(position.hasWorm, true)
  assert.equal(position.attraction, 1)
  assert.equal(position.takeReady, true)
})
