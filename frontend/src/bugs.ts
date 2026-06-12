export type BugRarity = 'common' | 'uncommon' | 'rare'
export type BugFamily = 'orb' | 'fuzzy' | 'squiggle' | 'star' | 'blob' | 'alien' | 'noodle' | 'spiky'

export type BugDefinition = {
  id: string
  displayName: string
  file: string
  rarity: BugRarity
  family: BugFamily
}

export const bugDefinitions: BugDefinition[] = [
  { id: 'blue-orb-bug', displayName: 'Blue Orb Bug', file: '/bugs/blue-orb-bug.svg', rarity: 'common', family: 'orb' },
  { id: 'red-scallop-bug', displayName: 'Red Scallop Bug', file: '/bugs/red-scallop-bug.svg', rarity: 'common', family: 'blob' },
  { id: 'yellow-triangle-bug', displayName: 'Yellow Triangle Bug', file: '/bugs/yellow-triangle-bug.svg', rarity: 'common', family: 'spiky' },
  { id: 'starfish-bug', displayName: 'Starfish Bug', file: '/bugs/starfish-bug.svg', rarity: 'uncommon', family: 'star' },
  { id: 'blue-noodle-bug', displayName: 'Blue Noodle Bug', file: '/bugs/blue-noodle-bug.svg', rarity: 'common', family: 'noodle' },
  { id: 'black-spike-bug', displayName: 'Black Spike Bug', file: '/bugs/black-spike-bug.svg', rarity: 'rare', family: 'spiky' },
  { id: 'blue-map-bug', displayName: 'Blue Map Bug', file: '/bugs/blue-map-bug.svg', rarity: 'uncommon', family: 'blob' },
  { id: 'bubble-cluster-bug', displayName: 'Bubble Cluster Bug', file: '/bugs/bubble-cluster-bug.svg', rarity: 'common', family: 'orb' },
  { id: 'green-giggle-bug', displayName: 'Green Giggle Bug', file: '/bugs/green-giggle-bug.svg', rarity: 'common', family: 'blob' },
  { id: 'purple-fuzz-bug', displayName: 'Purple Fuzz Bug', file: '/bugs/purple-fuzz-bug.svg', rarity: 'uncommon', family: 'fuzzy' },
  { id: 'orange-beetle-bug', displayName: 'Orange Beetle Bug', file: '/bugs/orange-beetle-bug.svg', rarity: 'common', family: 'orb' },
  { id: 'pink-doodle-bug', displayName: 'Pink Doodle Bug', file: '/bugs/pink-doodle-bug.svg', rarity: 'common', family: 'squiggle' },
  { id: 'teal-goober-bug', displayName: 'Teal Goober Bug', file: '/bugs/teal-goober-bug.svg', rarity: 'common', family: 'blob' },
  { id: 'gold-speckle-bug', displayName: 'Gold Speckle Bug', file: '/bugs/gold-speckle-bug.svg', rarity: 'rare', family: 'orb' },
  { id: 'red-wheel-bug', displayName: 'Red Wheel Bug', file: '/bugs/red-wheel-bug.svg', rarity: 'uncommon', family: 'squiggle' },
  { id: 'tiny-wing-bug', displayName: 'Tiny Wing Bug', file: '/bugs/tiny-wing-bug.svg', rarity: 'common', family: 'alien' },
  { id: 'moon-blob-bug', displayName: 'Moon Blob Bug', file: '/bugs/moon-blob-bug.svg', rarity: 'common', family: 'blob' },
  { id: 'three-eye-bug', displayName: 'Three Eye Bug', file: '/bugs/three-eye-bug.svg', rarity: 'uncommon', family: 'alien' },
  { id: 'long-leg-bug', displayName: 'Long Leg Bug', file: '/bugs/long-leg-bug.svg', rarity: 'common', family: 'noodle' },
  { id: 'squiggle-shell-bug', displayName: 'Squiggle Shell Bug', file: '/bugs/squiggle-shell-bug.svg', rarity: 'common', family: 'squiggle' },
  { id: 'round-eye-bug', displayName: 'Round Eye Bug', file: '/bugs/round-eye-bug.svg', rarity: 'common', family: 'orb' },
  { id: 'jelly-dot-bug', displayName: 'Jelly Dot Bug', file: '/bugs/jelly-dot-bug.svg', rarity: 'common', family: 'blob' },
  { id: 'spotted-heart-bug', displayName: 'Spotted Heart Bug', file: '/bugs/spotted-heart-bug.svg', rarity: 'uncommon', family: 'blob' },
  { id: 'tiny-horn-bug', displayName: 'Tiny Horn Bug', file: '/bugs/tiny-horn-bug.svg', rarity: 'common', family: 'spiky' },
]

export function getBugDefinition(id: string | null | undefined) {
  return bugDefinitions.find((bug) => bug.id === id) ?? bugDefinitions[0]
}
