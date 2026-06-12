export type BugObituary = {
  bugName: string
  wifeName: string
  childNames: string[]
  hobbies: string[]
  lifeGoal: string
  retirementDream: string
  message: string
}

export const oldManBugNames = [
  'Walter',
  'Howard',
  'Eugene',
  'Clarence',
  'Harold',
  'Milton',
  'Stanley',
  'Bernard',
  'Leonard',
  'Norman',
  'Gerald',
  'Herbert',
  'Clyde',
  'Arthur',
  'Edgar',
  'Franklin',
  'Mortimer',
  'Lester',
  'Wallace',
  'Chester',
  'Irving',
  'Melvin',
  'Horace',
  'Elmer',
]

export const oldLadyBugNames = [
  'Mildred',
  'Agnes',
  'Beatrice',
  'Dorothy',
  'Edith',
  'Florence',
  'Gertrude',
  'Harriet',
  'Ethel',
  'Mabel',
  'Pearl',
  'Gladys',
  'Ruth',
  'Marjorie',
  'Bernice',
  'Esther',
  'Winifred',
  'Irene',
  'Lois',
  'Doris',
  'Phyllis',
  'Hazel',
  'Thelma',
  'Opal',
]

export const childBugNames = [
  'Timmy',
  'Susan',
  'Bobby',
  'Linda',
  'Gary',
  'Nancy',
  'Tommy',
  'Patty',
  'Billy',
  'Barbara',
  'Jimmy',
  'Debbie',
  'Ricky',
  'Sally',
  'Kenny',
  'Donna',
  'Larry',
  'Cindy',
  'Ronnie',
  'Peggy',
  'Joey',
  'Wendy',
  'Danny',
  'Janet',
]

export const bugHobbies = [
  'swimming',
  'biking',
  'hanging out with his friends',
  'collecting tiny stamps',
  'polishing pebbles',
  'watching clouds',
  'building model trains',
  'feeding ducks at the park',
  'organizing his button collection',
  'doing crossword puzzles',
  'playing miniature golf',
  'reading mystery novels',
  'listening to smooth jazz',
  'watering his tomato plants',
  'telling long stories at dinner',
  'birdwatching',
  'making tiny pancakes',
  'taking scenic walks',
  'playing cards on Thursdays',
  'maintaining his immaculate lawn',
  'sitting in his favorite chair',
  'complaining about the thermostat',
]

export const bugLifeGoals = [
  'traveling to China next year',
  'finally visiting the Grand Canyon',
  'opening a tiny sandwich shop',
  'learning to play the accordion',
  'finishing his memoirs',
  'winning the neighborhood chili cook-off',
  'buying a little boat',
  'seeing the northern lights',
  'taking a cross-country train ride',
  'building a backyard gazebo',
  'learning conversational French',
  'restoring an old bicycle',
  'starting a very small jazz band',
  'perfecting his banana bread recipe',
  'visiting every national park',
  'getting better at watercolor painting',
  'teaching his grandchildren how to fish',
  'becoming treasurer of the bug club',
  'finally cleaning out the garage',
  'taking Mildred on a cruise',
  'buying a red convertible',
  'retiring somewhere with good soup',
]

export const bugRetirementDreams = [
  'spending more time with his dog in retirement',
  'watching sunsets from a porch swing',
  'taking slow walks with his wife every morning',
  'learning how to make proper biscuits',
  'finally reading all the books on his shelf',
  'building birdhouses for the neighborhood',
  'drinking coffee without being interrupted',
  'visiting the library every Tuesday',
  'growing prize-winning tomatoes',
  'napping in a very specific chair',
  'teaching his children the family card game',
  'moving closer to the ocean',
  'buying matching tracksuits with his wife',
  'hosting Sunday dinners',
  'learning to use the new television remote',
  'getting really into puzzles',
  'taking his dog to the park twice a day',
  'joining a bowling league',
  'perfecting his spaghetti sauce',
  'finally labeling all the boxes in the attic',
  'wearing socks with sandals without judgment',
  'spending quiet mornings with his newspaper',
]

function pickOne<T>(items: T[], rng: () => number) {
  return items[Math.floor(rng() * items.length)]
}

function pickUnique<T>(items: T[], count: number, rng: () => number) {
  const available = [...items]
  const selected: T[] = []

  while (selected.length < count && available.length > 0) {
    const index = Math.floor(rng() * available.length)
    const [item] = available.splice(index, 1)
    selected.push(item)
  }

  return selected
}

export function formatList(items: string[]) {
  if (items.length <= 1) return items[0] ?? ''
  if (items.length === 2) return `${items[0]} and ${items[1]}`

  return `${items.slice(0, -1).join(', ')}, and ${items[items.length - 1]}`
}

export function buildObituary(obituary: Omit<BugObituary, 'message'>) {
  return `You have killed a bug. His name was ${obituary.bugName}.

${obituary.bugName} enjoyed ${formatList(obituary.hobbies)}. He was looking forward to ${obituary.lifeGoal} and ${obituary.retirementDream}.

He is survived by his wife, ${obituary.wifeName}, and his three children, ${formatList(obituary.childNames)}.`
}

export function generateBugObituary(rng = Math.random): BugObituary {
  const obituary = {
    bugName: pickOne(oldManBugNames, rng),
    wifeName: pickOne(oldLadyBugNames, rng),
    childNames: pickUnique(childBugNames, 3, rng),
    hobbies: pickUnique(bugHobbies, rng() > 0.45 ? 3 : 2, rng),
    lifeGoal: pickOne(bugLifeGoals, rng),
    retirementDream: pickOne(bugRetirementDreams, rng),
  }

  return {
    ...obituary,
    message: buildObituary(obituary),
  }
}
