export type AvatarCategory = 'animal' | 'fantasy' | 'object' | 'food'

export type AvatarDefinition = {
  id: string
  displayName: string
  file: string
  category: AvatarCategory
}

export const avatars: AvatarDefinition[] = [
  { id: 'boston-terrier', displayName: 'Boston Terrier', file: '/avatars/boston-terrier.svg', category: 'animal' },
  { id: 'black-cat', displayName: 'Black Cat', file: '/avatars/black-cat.svg', category: 'animal' },
  { id: 'white-bunny', displayName: 'White Bunny', file: '/avatars/white-bunny.svg', category: 'animal' },
  { id: 'goldfish', displayName: 'Goldfish', file: '/avatars/goldfish.svg', category: 'animal' },
  { id: 'slime-green', displayName: 'Green Slime', file: '/avatars/slime-green.svg', category: 'fantasy' },
  { id: 'star-face', displayName: 'Star Face', file: '/avatars/star-face.svg', category: 'object' },
  { id: 'crab', displayName: 'Crab', file: '/avatars/crab.svg', category: 'animal' },
  { id: 'rock-creature', displayName: 'Rock Creature', file: '/avatars/rock-creature.svg', category: 'fantasy' },
  { id: 'duck', displayName: 'Duck', file: '/avatars/duck.svg', category: 'animal' },
  { id: 'bat', displayName: 'Bat', file: '/avatars/bat.svg', category: 'animal' },
  { id: 'fox', displayName: 'Fox', file: '/avatars/fox.svg', category: 'animal' },
  { id: 'bee', displayName: 'Bee', file: '/avatars/bee.svg', category: 'animal' },
  { id: 'frog-wizard', displayName: 'Frog Wizard', file: '/avatars/frog-wizard.svg', category: 'fantasy' },
  { id: 'otter', displayName: 'Otter', file: '/avatars/otter.svg', category: 'animal' },
  { id: 'turtle', displayName: 'Turtle', file: '/avatars/turtle.svg', category: 'animal' },
  { id: 'frog', displayName: 'Frog', file: '/avatars/frog.svg', category: 'animal' },
  { id: 'penguin', displayName: 'Penguin', file: '/avatars/penguin.svg', category: 'animal' },
  { id: 'taco-face', displayName: 'Taco Face', file: '/avatars/taco-face.svg', category: 'food' },
  { id: 'mushroom-person', displayName: 'Mushroom Person', file: '/avatars/mushroom-person.svg', category: 'fantasy' },
  { id: 'axolotl', displayName: 'Axolotl', file: '/avatars/axolotl.svg', category: 'animal' },
]

export const defaultAvatarId = 'star-face'

export function getAvatar(id: string | null | undefined) {
  return avatars.find((avatar) => avatar.id === id) ?? avatars.find((avatar) => avatar.id === defaultAvatarId) ?? avatars[0]
}
