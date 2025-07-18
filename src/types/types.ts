export interface Boss {
  name: string
  slug: string
  hp: number
  optional: string
  resistance: string[]
  weakness: string[]
  imunity: string[]
  weapons: string[]
}

export type Bosses = Boss[]