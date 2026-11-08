// The game lives in its own binary. All the mod knows of it is what the binary
// answers: pictures, Buttons, and a state it hands back unread.

// A Button as the core wants it: what a press asks for, and whether gold covers it.
// wanted: the line the lesson waits to be bought; its price blinks.
export type Choice = { key: string; label: string; price?: string; count?: number; out?: number | null; lit: boolean; wanted?: boolean }

// The Buttons of one stretch of a scene.
// What a piece of news touches: the board colours it as the status line's column.
export type Tone = 'gold' | 'army' | 'mana' | 'kin' | 'orcs' | 'totem'
// cat: in the lesson, the step whose cat shows from this row on, 0 for none.
export type Row = { at: number; buttons: { hire: Choice[]; forms: Choice[] }; news?: string; tone?: Tone | null; cat?: number }

// A card of the draft.
export type Offer = { key: string; label: string; text: string }

// What the core counts Claude's work against, to say what it comes to.
export type Base = { fury: number; totems: number; usedErrors: number; usedCompactions: number }

// What the row over the field says.
export type Flash = { said: string; threat: string; grew?: 'fury' | 'totem' | '' }

// Where a click on a still picture means something: whole percents across, whole rows down.
// Its light under the pointer: drop half rows below its top, tall rows high.
export type Zone = { key: string; left: number; right: number; top: number; bottom: number; drop?: number; tall?: number }

// What the core answers: a toast alone, or a screen.
export type Answer = {
  toast?: string
  screen?: 'title' | 'settings' | 'mode' | 'draft' | 'spin' | 'over' | 'battle' | 'dice'
  // The plates of the title and the settings, where they stand.
  zones?: Zone[]
  state?: string
  steps?: number
  // How long the die rolls over the stopped battle, in steps.
  roll?: number
  // Seconds a picture plays: a click in that time shows all of it.
  reveal?: number
  layers?: string[]
  // The fog over the field while the match opens, a plain picture, and the step it is gone by.
  fog?: string
  fogGone?: number | null
  // The lesson's pictures of the cat and his words, by step, for the rows that call them.
  cats?: Record<string, string>
  // The hire bar's picture: it stands all match.
  bar?: string
  rows?: Row[]
  fellAt?: number | null
  // A match that ended, once: its start, the player's orders and Claude's work.
  record?: object
  // Steps the scene stands on its first frame, under the still before it.
  lead?: number
  // false: the scene before goes at once instead of lying over this one while it loads.
  cover?: boolean
  hud?: string
  short?: string
  alt?: string
  offer?: Offer[]
  canContinue?: boolean
  base?: Base
}

// The pictures that never change and how Claude's tokens turn into work.
export type Art = { backdrop: string; title: string; rates: { workPerOutput: number; workPerInput: number }; words?: Record<string, string>; lang?: string }

// A scene's layers and what they say, for as long as a frame shows them.
export type Picture = { layers: string[]; alt: string }

// What the band shows now. at is the clock time its scene began.
export type View = {
  id: number
  screen: 'title' | 'settings' | 'mode' | 'draft' | 'spin' | 'over' | 'battle' | 'dice'
  zones: Zone[]
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

// What $.store keeps under one key; at is when, by the clock, and a game saved before
// 2026-11-03 has none.
export type Stored = { state: string; work: Work; at?: number }

// The size of the clear layer that hears a click on a picture.
export type TitleProps = { columns: number; rows: number; zones?: Zone[] }
export type DraftProps = { columns: number; rows: number; cards: number }

// What the clear layer over the hire bar shows: each bay's price, how many the line
// holds, and its upgrade's price.
export type Bay = { price: string; count: number; lit: boolean; up: { price: string; lit: boolean } | null; out: number | null; wanted?: boolean }
export type HireProps = { columns: number; bays: Bay[] }

// The plates in the band's corner: what a click on each asks for.
export type CornerProps = { columns: number; plates: { key: string; label: string }[] }

// The words on the row's board: what they say, in what colour, and how they fade, if
// they do. The same words lit again bring a new stamp.
export type BoardProps = { columns: number; text: string; color: string; stamp: number; fade: { holdMs: number; fadeMs: number } | null }

declare module 'claude-code' {
  interface PluginState {
    'banners-of-lore': {
      isLoaded: Shaped<boolean>
      isFolded: boolean
      flash: Shaped<Flash>
      news: string
      newsTone: Tone
      fog: string
      cat: string
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
