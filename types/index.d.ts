// The game lives in its own binary. All the mod knows of it is what the binary
// answers: pictures, Buttons, and a state it hands back unread.

// A Button as the core wants it: what a press asks for, and whether gold covers it.
export type Choice = { key: string; label: string; price?: string; count?: number; lit: boolean }

// The Buttons of one stretch of a scene.
export type Row = { at: number; buttons: { hire: Choice[]; forms: Choice[] } }

// A card of the draft.
export type Offer = { key: string; label: string; text: string }

// What the core counts Claude's work against, to say what it comes to.
export type Base = { fury: number; totems: number; usedErrors: number; usedCompactions: number }

// What the row over the field says.
export type Flash = { said: string; threat: string }

// What the core answers: a toast alone, or a screen.
export type Answer = {
  toast?: string
  screen?: 'title' | 'mode' | 'draft' | 'spin' | 'over' | 'battle' | 'dice'
  state?: string
  steps?: number
  // How long the die rolls over the stopped battle, in steps.
  roll?: number
  // Seconds a picture plays: a click in that time shows all of it.
  reveal?: number
  layers?: string[]
  // The hire bar's picture: it stands all match.
  bar?: string
  rows?: Row[]
  fellAt?: number | null
  // A match that ended, once: its start, the player's orders and Claude's work.
  record?: object
  // Steps the scene stands on its first frame, under the still before it.
  lead?: number
  hud?: string
  short?: string
  alt?: string
  offer?: Offer[]
  canContinue?: boolean
  base?: Base
}

// The pictures that never change and how Claude's tokens turn into work.
export type Art = { backdrop: string; title: string; rates: { workPerOutput: number; workPerInput: number } }

// A scene's layers and what they say, for as long as a frame shows them.
export type Picture = { layers: string[]; alt: string }

// What the band shows now. at is the clock time its scene began.
export type View = {
  id: number
  screen: 'title' | 'mode' | 'draft' | 'spin' | 'over' | 'battle' | 'dice'
  steps: number
  roll: number
  reveal: number
  at: number
  hud: string
  short: string
  alt: string
  canContinue: boolean
  offer: Offer[]
  base: Base
}

// Claude's work so far, as running totals.
export type Work = { work: number; errors: number; compactions: number; tokens: number; lines: number[] }

// What $.store keeps under one key.
export type Stored = { state: string; work: Work }

// The size of the clear layer that hears a click on a picture.
export type TitleProps = { columns: number; rows: number }
export type DraftProps = { columns: number; rows: number; cards: number }

// What the clear layer over the hire bar shows: each bay's price, how many the line
// holds, and its upgrade's price.
export type Bay = { price: string; count: number; lit: boolean; up: { price: string; lit: boolean } | null }
export type HireProps = { columns: number; bays: Bay[] }

// The plates in the band's corner: what a click on each asks for.
export type CornerProps = { columns: number; plates: { key: string; label: string }[] }

declare module 'claude-code' {
  interface PluginState {
    'banners-of-lore': {
      isLoaded: Shaped<boolean>
      isFolded: boolean
      flash: Shaped<Flash>
      failure: string
      state: string
      view: Shaped<View>
      cover: number
      stand: number
      buttons: Shaped<Row['buttons']>
      progress: Shaped<Work>
    }
  }
}
