import assert from 'node:assert/strict'
import test from 'node:test'

import {
  getTankReactionSpeed,
  getTankReactionTarget,
  registerTankTap,
} from '../src/components/aquarium/tankInteraction.ts'

function buildTapSequence(count, firstAt = 1_000, interval = 800) {
  let interaction = null
  for (let tap = 0; tap < count; tap += 1) {
    interaction = registerTankTap(interaction, 300 + tap * 5, 220 + tap * 3, firstAt + tap * interval)
  }
  return interaction
}

test('taps progress from a brief startle into steadily stronger curiosity', () => {
  const first = buildTapSequence(1)
  const second = buildTapSequence(2)
  const third = buildTapSequence(3)
  const fourth = buildTapSequence(4)
  const fifth = buildTapSequence(5)
  const sixth = buildTapSequence(6)
  const seventh = registerTankTap(sixth, 360, 260, 6_000)

  assert.equal(first.mode, 'startled')
  assert.equal(second.mode, 'wary')
  assert.equal(third.mode, 'curious')
  assert.equal(fourth.mode, 'curious')
  assert.equal(fifth.mode, 'engaged')
  assert.equal(sixth.mode, 'engaged')
  assert.equal(seventh.mode, 'engaged')
  assert.equal(seventh.tapCount, 6)
  assert.equal(first.interest, 0)
  assert.equal(seventh.interest, 1)
  assert.deepEqual([seventh.x, seventh.y], [360, 260])
})

test('interest lingers and cools gradually instead of resetting after a short pause', () => {
  const engaged = buildTapSequence(6)
  const stillEngaged = registerTankTap(engaged, 300, 220, engaged.lastTapAt + 3_100)
  const cooledToCurious = registerTankTap(engaged, 300, 220, engaged.lastTapAt + 9_100)
  const forgotten = registerTankTap(engaged, 300, 220, engaged.lastTapAt + 18_001)

  assert.equal(stillEngaged.mode, 'engaged')
  assert.equal(stillEngaged.tapCount, 6)
  assert.equal(cooledToCurious.mode, 'curious')
  assert.equal(cooledToCurious.tapCount, 4)
  assert.equal(forgotten.mode, 'startled')
  assert.equal(forgotten.tapCount, 1)
})

test('reaction activity is short while tap memory remains available to the next knock', () => {
  const first = registerTankTap(null, 100, 120, 1_000)
  const engaged = buildTapSequence(6, 1_000, 600)

  assert.equal(first.activeUntil, 1_420)
  assert.equal(first.memoryUntil, 19_000)
  assert.equal(engaged.activeUntil, engaged.lastTapAt + 4_200)
  assert.equal(engaged.memoryUntil, engaged.lastTapAt + 18_000)
})

test('the first tap causes a modest distance-sensitive flinch, not a dash to the wall', () => {
  const interaction = registerTankTap(null, 300, 250, 1_000)
  const nearby = { x: 430, y: 250, bobOffset: 0 }
  const far = { x: 680, y: 250, bobOffset: 0 }
  const nearbyTarget = getTankReactionTarget(interaction, nearby, 0, 4, 100, 800, 500, 1_000)
  const farTarget = getTankReactionTarget(interaction, far, 0, 4, 100, 800, 500, 1_000)

  assert.ok(nearbyTarget.x > nearby.x)
  assert.ok(nearbyTarget.x < 742)
  assert.ok(nearbyTarget.x - nearby.x < 100)
  assert.ok(nearbyTarget.x - nearby.x > farTarget.x - far.x)
})

test('a wary fish approaches the tap but maintains a cautious standoff', () => {
  const interaction = buildTapSequence(2)
  const swimmer = { x: 700, y: 220, bobOffset: 0.3 }
  const target = getTankReactionTarget(interaction, swimmer, 0, 5, 100, 800, 500, 1_600)
  const originalDistance = Math.hypot(swimmer.x - interaction.x, swimmer.y - interaction.y)
  const targetDistance = Math.hypot(target.x - interaction.x, target.y - interaction.y)

  assert.ok(targetDistance < originalDistance)
  assert.ok(targetDistance > 150)
})

test('continued taps gather fish progressively closer and keep bottom dwellers on the floor', () => {
  const curious = buildTapSequence(3)
  const engaged = buildTapSequence(6)
  const swimmer = { x: 700, y: 400, bobOffset: 1.2 }
  const curiousDistances = Array.from({ length: 5 }, (_, index) => {
    const target = getTankReactionTarget(curious, swimmer, index, 5, 100, 800, 500, 1_500)
    return Math.hypot(target.x - curious.x, target.y - curious.y)
  })
  const engagedDistances = Array.from({ length: 5 }, (_, index) => {
    const target = getTankReactionTarget(engaged, swimmer, index, 5, 100, 800, 500, 1_500)
    return Math.hypot(target.x - engaged.x, target.y - engaged.y)
  })
  const crabTarget = getTankReactionTarget(engaged, swimmer, 1, 5, 100, 800, 500, 1_500, true)
  const curiousAverage = curiousDistances.reduce((sum, distance) => sum + distance, 0) / curiousDistances.length
  const engagedAverage = engagedDistances.reduce((sum, distance) => sum + distance, 0) / engagedDistances.length

  assert.ok(engagedAverage < curiousAverage)
  assert.ok(Math.max(...engagedDistances) < 145)
  assert.equal(crabTarget.y, 408)
})

test('a fish directly under the tap gets a finite deterministic flinch target', () => {
  const interaction = registerTankTap(null, 300, 250, 1_000)
  const swimmer = { x: 300, y: 250, bobOffset: 0.4 }
  const target = getTankReactionTarget(interaction, swimmer, 2, 5, 90, 800, 500, 1_000)

  assert.ok(Number.isFinite(target.x))
  assert.ok(Number.isFinite(target.y))
  assert.notDeepEqual(target, { x: swimmer.x, y: swimmer.y })
})

test('mood scales the complete reaction speed, including its safety floor', () => {
  const happy = getTankReactionSpeed('startled', 0.001, 1.5)
  const content = getTankReactionSpeed('startled', 0.001, 1)
  const sad = getTankReactionSpeed('startled', 0.001, 0.27)

  assert.equal(happy, 0.075 * 1.5)
  assert.equal(content, 0.075)
  assert.equal(sad, 0.075 * 0.27)
  assert.ok(happy > content && content > sad)
  assert.ok(getTankReactionSpeed('engaged', 0.02) > getTankReactionSpeed('curious', 0.02))
  assert.ok(getTankReactionSpeed('startled', 0.02) > getTankReactionSpeed('wary', 0.02))
  assert.equal(getTankReactionSpeed('engaged', 0.03, -1), 0)
})
