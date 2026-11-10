import { atom, read, update } from 'claude-code'
import type { EngineInterface, Register, RenderElement, Timer } from 'claude-code'

import type { Answer, Art, Base, Bay, BoardProps, Choice, CornerProps, DraftProps, Flash, HireProps, Picture, Row, Stored, TitleProps, Tone, View, Work } from '../types'
import * as core from './core/core.js'

// The band above the prompt while Claude works. The game itself is the core, the Rust
// game built to JavaScript (sim/jscore), a request a call: this holds the Buttons, the
// clock and the pictures the core draws, and hands back a state it never reads.

const COMMAND = 'banners-of-lore'
const STORE_KEY = 'army'
// Whether this player has had the lesson: one key for all sessions, so a new session
// does not teach again, and not under STORE_KEY, whose old games forget() clears.
const LESSON_KEY = 'lesson'
// The player's language, one for all sessions: a file of mod/localization, the core's words.
const LANG_KEY = 'lang'
// The languages the core speaks, and their names in themselves.
const LANGS: Record<string, string> = { en: 'English', ru: 'Русский' }
// The level the player picked, one for all sessions; a new match takes it (data::LEVELS).
const LEVEL_KEY = 'level'
const HINTS_KEY = 'hints'
// The newest version out, and when it was read: the published manifest, once a day.
const LATEST_KEY = 'latest'
const LATEST_URL = 'https://raw.githubusercontent.com/Nero0909/banners-of-lore/main/.claude-plugin/plugin.json'
const DAY_MS = 24 * 60 * 60 * 1000
// What a click on the news of a newer version copies.
const UPDATE_COMMAND = 'claude plugin update banners-of-lore@banners-of-lore'
// The game's server on Discord, once it has one: its medallion shows when this is set.
const DISCORD_URL = ''
// The store holds 4 MiB in all and a game some 20 KB: past this many sessions, the
// games of those seen longest ago go.
const KEEP_GAMES = 20
const STEP_MS = 100
const ROWS = 9
// Both layers of the desktop field at one size, in CSS pixels: an image and an
// interactive frame size an Svg differently (seen on 2026-10-30), so the layers
// would not line up. 180 is the frame's height seen then.
const FIELD_PX = { width: 783, height: 180 }
// The hire bar under the field. Its picture stands all match; prices are a clear layer.
const BAR_PX = { width: 783, height: 48 }
// Up over the 5 pixels the band leaves under the field (seen 2026-11-02): half a line
// a unit.
const BAR_LIFT = -0.5
// A plate in the band's corner: its picture, written by pack-screens.py, its size and
// its width in columns of the band for the layer that hears it.
const PLATE_ART = 'data:image/webp;base64,UklGRsYAAABXRUJQVlA4TLoAAAAvMwADAHegqJEk5beMh/6FnLXToaaRFEjA3fFUlNDjGm/4UNBIUvO9P/5VIgHmP7pOngeCeDMSASB0REbEkQWrMP/T3u9meXfBTW3bToQFjCCBjpYKREQBIAEFoc5XAiVdDhOqcTM/rIuDiP4rcNtGSY4ZfrFJYtkA5EU5q6dQrUrFQXcK869BKPoAgEH0Bd90YRB92W1vDKJvTn5UIvqq2qUQfflkUYi+YcDIIPo833cYRN+Tt3/wXwA='
// 92 wide: «Показать» ran into the nails at 78, which hold 8 of the plate's 52 cells at
// each end (the user, 2026-11-08).
const PLATE_PX = { width: 92, height: 19.5, gap: 3 }
const PLATE_COLUMNS = 12
// The row over the field: words at its left end with what happened last, and Restart
// and Hide at the right. What Claude did holds, then fades away. The words stand bare:
// the user took their wooden frame away (2026-11-06).
const FLASH = { holdMs: 3000, fadeMs: 2000 }
// The words take as much as the longest news, less on a band too narrow for it.
const BOARD_PX = 330
// The words on the board in one style, the status line's: capitals, units small after
// a number. Coloured as the status line's column of what they touch: gold, the army,
// mana, kin, the orcs, the totem. The board mixed cases and wore one gold (2026-11-06).
const BOARD_INK: Record<Tone, string> = { gold: '#F4BD60', army: '#FFF0CE', mana: '#8FD3FF', kin: '#FFD27A', orcs: '#FF9A7A', totem: '#B79BFF' }
// A new picture blinks while it loads. The one before stays on for COVER_MS, running
// on past its end, so it moves on in step with the new one: no longer, as each keeps
// its own clock from the moment it loaded. Only while the band stays under
// COVERED_TREE characters: past about 260 thousand the desktop stopped taking the
// band's updates (seen 2026-10-31).
const COVER_MS = 800
const COVERED_TREE = 250_000
// How long the fallen field stays before the title comes up.
const FALL_MS = 3000
// How often the scenes are looked at, and how late one counts as stopped.
const BEAT_MS = 2000
const LATE_MS = 1500
// Bump with any change to what the atoms hold.
const SHAPE = 'v20'
const FONT = 'system-ui,-apple-system,Segoe UI,sans-serif'

const NO_BASE: Base = { fury: 0, totems: 0, usedErrors: 0, usedCompactions: 0 }
const NO_WORK: Work = { work: 0, errors: 0, compactions: 0, tokens: 0, lines: [0, 0, 0] }
// Svg needs an alt to draw at all, and the desktop shows it on hover: a blank one hid
// the pictures (seen 2026-11-01), so this one is there and shows nothing.
const NO_TIP = '\u200b'

const TITLE: View = { id: 0, screen: 'title', zones: [], steps: 0, roll: 0, reveal: 0, at: 0, hud: '', short: 'BANNERS OF LORE', alt: '', canContinue: false, offer: [], base: NO_BASE }

const isLoaded = atom({ plugin: 'banners-of-lore', key: 'isLoaded' } as const, false, { shape: SHAPE })
// Folded, the band is one row and the battle waits where it stood.
const isFolded = atom({ plugin: 'banners-of-lore', key: 'isFolded' } as const, false)
// What the row over the field says for a moment after Claude's work pays, fixed as
// it lights: a payday in the meantime must not start its fade again.
const flash = atom({ plugin: 'banners-of-lore', key: 'flash' } as const, { said: '', threat: '' } as Flash, { shape: SHAPE })
// What the battle's news says now, at the right end of the row over the field: on the
// field it sat on a castle's bar (2026-11-06). The scene's rows bring it on time.
const news = atom({ plugin: 'banners-of-lore', key: 'news' } as const, '')
const newsTone = atom({ plugin: 'banners-of-lore', key: 'newsTone' } as const, 'army' as Tone)
// The fog over the field while the match opens: a plain picture, up at once whatever
// scene loads under it, which only lifts (2026-11-06).
const fog = atom({ plugin: 'banners-of-lore', key: 'fog' } as const, '')
// The scholar cat and his words over the field in the lesson: a plain picture a step,
// which the scene's rows put up and take down on time.
const cat = atom({ plugin: 'banners-of-lore', key: 'cat' } as const, '')
// Why the band has no game to show, when the core did not answer.
const failure = atom({ plugin: 'banners-of-lore', key: 'failure' } as const, '')
// The game as the core last left it, at the running scene's start.
const state = atom({ plugin: 'banners-of-lore', key: 'state' } as const, '')
const view = atom({ plugin: 'banners-of-lore', key: 'view' } as const, TITLE, { shape: SHAPE })
// The scene before, drawn over the new one while it loads.
const cover = atom({ plugin: 'banners-of-lore', key: 'cover' } as const, 0)
// The stopped battle of a roll, under the scene that follows it while that loads.
const stand = atom({ plugin: 'banners-of-lore', key: 'stand' } as const, 0)
const buttons = atom({ plugin: 'banners-of-lore', key: 'buttons' } as const, { hire: [], forms: [] } as Row['buttons'], { shape: SHAPE })
const progress = atom({ plugin: 'banners-of-lore', key: 'progress' } as const, NO_WORK, { shape: SHAPE })

// What a reload may lose: the timers, the pictures, and the queue that keeps
// requests in order. The next drawing starts them again.
let timer: Timer | null = null
let rowTimers: Timer[] = []
let beat: Timer | null = null
let unlit: Timer | null = null
// Whether the battle's news came after what Claude did last.
let isNewsLast = false
// How many times the row has lit: the same words lit again fade again.
let litCount = 0
let isNudged = false
let isRunning = false
let isShown = false
// Claude's turn ended: isWorking may lag it by a drawing.
let isTurnOver = false
let art: Art | null = null
let bar = ''
let matches = ''
// A build run from the dev folder: the release ships no sim/ (release.sh), so the
// stand's sources mark the dev build. It says so in the corner (the user took one for
// the other, 2026-11-03), and it alone takes the tools for development: BANNERS_CORE
// and the slash command, test, card, victory and defeated among its words. A player
// picks the language and the lesson on the title. The user wants none of them in the
// release (2026-11-10).
let isDev: boolean | null = null
async function devBuild($: EngineInterface): Promise<boolean> {
  isDev ??= await $.fs.exists(`${$.plugin.root}/sim/Cargo.toml`).catch(() => false)
  return isDev
}
// The first start of a player who never had the lesson and has no game saved goes to it.
let isLessonDue = false
const DEV_COLUMNS = 4
const pictures = new Map<number, Picture>()
// The language asked for, read from the store once; empty is English.
let lang: string | null = null
// The level asked for, read from the store once; empty is the middle one.
let level: string | null = null
// Whether the hints show, read from the store once: "off" hides them, else they show.
let hints: string | null = null
// This build's version and home page, from its own manifest, and the newest version out.
let version = ''
let homepage = ''
let latest = ''
// What the hooks say themselves, in that language, as the core gave it with the art.
let words: Record<string, string> = {}

// A word of the hooks: the core's in the chosen language, else the English here, which a
// test of the core holds equal to mod/localization/en.json under hook.<key>.
export function say(key: string, english: string, args: Record<string, string | number> = {}): string {
  return Object.entries(args).reduce((text, [name, value]) => text.split(`{${name}}`).join(String(value)), words[key] ?? english)
}

async function levelOf($: EngineInterface): Promise<string> {
  if (level === null) {
    const stored = await $.store.get(LEVEL_KEY).catch(() => undefined)
    level = typeof stored === 'string' ? stored : ''
  }

  return level
}

// The level, for all sessions: the next match takes it, the one on its way keeps its own.
async function setLevel($: EngineInterface, code: string): Promise<void> {
  await $.store.set(LEVEL_KEY, code)
  level = code
}

async function hintsOf($: EngineInterface): Promise<string> {
  if (hints === null) {
    const stored = await $.store.get(HINTS_KEY).catch(() => undefined)
    hints = typeof stored === 'string' ? stored : ''
  }

  return hints
}

// The hints on or off, for all sessions, at once: the next scene draws them or not.
async function setHints($: EngineInterface, code: string): Promise<void> {
  await $.store.set(HINTS_KEY, code)
  hints = code
}

async function langOf($: EngineInterface): Promise<string> {
  if (lang === null) {
    const stored = await $.store.get(LANG_KEY).catch(() => undefined)
    lang = typeof stored === 'string' ? stored : ''
  }

  return lang
}
let queue: Promise<void> = Promise.resolve()

function serial($: EngineInterface, work: () => Promise<void>): Promise<void> {
  const run = queue.then(work)
  // A failed change stops the scenes; the next drawing starts them again.
  queue = run.catch(async (e: unknown) => {
    isRunning = false
    await update($, failure, () => String(e).slice(0, 200))
  })

  return run
}

// The core answers here, in the hooks' worker: no process and no file of its own to
// start. The native cores this mod ran before, one a system, Windows' Smart App Control
// refused, as no one had signed them (2026-11-10); the engine has no WebAssembly and no
// eval, so the core comes as JavaScript modules (run.sh, jscore).
const encoder = new TextEncoder()
const decoder = new TextDecoder()
function jsCore(input: string): string {
  const bytes = encoder.encode(input)
  const at = core.alloc(bytes.length)
  new Uint8Array(core.memory.buffer, at, bytes.length).set(bytes)
  const length = core.answer(at, bytes.length)
  return decoder.decode(new Uint8Array(core.memory.buffer, core.out_ptr(), length).slice())
}
// A core to run as a process instead, by its path in BANNERS_CORE: the band's tests
// answer through it, as the engine keeps this module apart from their own import of
// it, and a native build (sim/src/bin/core.rs) can stand in to debug. The dev build
// alone reads it; unset, or in the release, the JavaScript core answers.
async function runCore($: EngineInterface, input: string): Promise<string> {
  const standIn = (await devBuild($)) ? await $.env.get('BANNERS_CORE').catch(() => undefined) : undefined
  if (!standIn) {
    return jsCore(input)
  }
  const { exitCode, stdout, stderr } = await $.process.run([standIn], { stdin: input, timeoutMs: 8000 })
  if (exitCode !== 0) {
    throw new Error(`the game stopped: ${stderr.slice(0, 160)}`)
  }

  return stdout
}

// Where matches are kept: ~/.claude/banners-of-lore/matches, whether the mod runs from
// the plugin cache or straight from the dev folder, so the reviews find every one.
async function matchesDir($: EngineInterface): Promise<string> {
  if (!matches) {
    // Windows keeps the home in USERPROFILE, as C:\Users\<name>; a printenv from Git Bash
    // would answer /c/Users/<name>, which Windows itself does not read.
    const isWindows = (await $.env.get('OS').catch(() => undefined)) === 'Windows_NT'
    const home = isWindows
      ? ((await $.env.get('USERPROFILE').catch(() => undefined)) ?? '').replace(/\\/g, '/')
      : (await $.process.run(['printenv', 'HOME']).catch(() => ({ stdout: '' }))).stdout.trim()
    matches = /^(\/|[A-Za-z]:\/)/.test(home) ? `${home}/.claude/banners-of-lore/matches` : `${$.plugin.root}/matches`
  }

  return matches
}

// What the title shows besides the menu: our version, a newer one, the links, the lesson.
function front(): { version: string; latest: string; links: string[]; lessonDue: boolean } {
  return { version, latest, links: Object.keys(links()), lessonDue: isLessonDue }
}

// The links the title's medallions open, in their order.
function links(): Record<string, string> {
  const out: Record<string, string> = {}
  if (DISCORD_URL) {
    out.discord = DISCORD_URL
  }
  if (homepage) {
    out.site = homepage
  }
  return out
}

// This build's manifest: its version and home page.
async function readManifest($: EngineInterface): Promise<void> {
  const text = await $.fs.read(`${$.plugin.root}/.claude-plugin/plugin.json`).catch(() => '')
  try {
    const m = JSON.parse(text) as { version?: string; homepage?: string }
    version = m.version ?? ''
    homepage = m.homepage ?? ''
  } catch {
    // A manifest that does not read shows no version.
  }
}

// The newest version out: the published manifest, read at most once a day and kept for
// all sessions. The one kept is known at once; a new read goes on in the background, so a
// slow or refused network never holds the band, and shows on the title when it comes.
async function knownLatest($: EngineInterface): Promise<{ version?: string; at?: number } | undefined> {
  const known = (await $.store.get(LATEST_KEY).catch(() => undefined)) as { version?: string; at?: number } | undefined
  latest = known?.version ?? ''
  return known
}

async function readLatest($: EngineInterface, known: { at?: number } | undefined): Promise<void> {
  const now = await $.clock.now()
  if (known?.at && now - known.at < DAY_MS) {
    return
  }
  const got = await $.http.fetch(LATEST_URL).catch(() => null)
  if (!got?.ok) {
    return
  }
  try {
    const out = (JSON.parse(got.text) as { version?: string }).version ?? ''
    if (!out) {
      return
    }
    await $.store.set(LATEST_KEY, { version: out, at: now })
    if (out !== latest) {
      latest = out
      if ((await read($, view)).screen === 'title') {
        await act($, 'open')
      }
    }
  } catch {
    // A page that is not the manifest says nothing.
  }
}

// A link in the player's browser: macOS, then Linux, then Windows, whichever starts.
async function openLink($: EngineInterface, url: string): Promise<void> {
  for (const argv of [['open', url], ['xdg-open', url], ['cmd', '/c', 'start', '', url]]) {
    const done = await $.process.run(argv, { timeoutMs: 4000 }).catch(() => null)
    if (done?.exitCode === 0) {
      return
    }
  }
}

// The language, for all sessions: the core's words and pictures, drawn again.
async function setLang($: EngineInterface, code: string): Promise<void> {
  await $.store.set(LANG_KEY, code)
  lang = code
  await serial($, () => redraw($))
}

// One request to the game. elapsed is how far the running scene has come.
async function ask($: EngineInterface, op: string, arg = ''): Promise<Answer & Partial<Art>> {
  const v = await read($, view)
  const elapsed = Math.min(v.steps, Math.max(0, Math.round(((await $.clock.now()) - v.at) / STEP_MS)))
  const input = JSON.stringify({ op, arg, state: await read($, state), elapsed, seed: Math.floor(await $.clock.now()) % 4294967296, lang: await langOf($), level: await levelOf($), hints: await hintsOf($), ...front(), ...(await read($, progress)) })
  const reply = JSON.parse(await runCore($, input)) as Answer & Partial<Art> & { error?: string }
  if (reply.error) {
    throw new Error(`the game stopped: ${reply.error.slice(0, 160)}`)
  }

  return reply
}

// Each session keeps its game under a key of its own, and STORE_KEY the last game played
// anywhere, which a session with none takes up. One key for all handed every new or
// reloaded session whatever game was saved last (2026-11-03).
async function keyOf($: EngineInterface): Promise<string> {
  const id = await $.session.id().catch(() => '')
  return id ? `${STORE_KEY}:${id}` : STORE_KEY
}

async function persist($: EngineInterface): Promise<void> {
  const own = await keyOf($)
  const value: Stored = { state: await read($, state), work: await read($, progress), at: await $.clock.now() }
  const was = (await $.store.get(own)) as Partial<Stored> | undefined
  await $.store.set(own, value)
  // A session that only shows its own game again leaves the last one played be.
  if (was?.state !== value.state) {
    await $.store.set(STORE_KEY, value)
  }
}

async function forget($: EngineInterface, own: string): Promise<void> {
  const others = (await $.store.keys()).filter(key => key.startsWith(`${STORE_KEY}:`) && key !== own)
  const seen = await Promise.all(others.map(async key => ({ key, at: ((await $.store.get(key)) as Partial<Stored> | undefined)?.at ?? 0 })))
  for (const { key } of seen.sort((a, b) => b.at - a.at).slice(KEEP_GAMES)) {
    await $.store.delete(key)
  }
}

function clearTimers(): void {
  timer?.cancel()
  for (const t of rowTimers) {
    t.cancel()
  }
  rowTimers = []
}

// The corner's plates: a plain picture, as their words never change.
function plateSvg(labels: readonly string[]): string {
  const { width, height, gap } = PLATE_PX
  const plates = labels.map((label, i) => {
    const x = i * (width + gap)
    return `<image href="${PLATE_ART}" x="${x}" width="${width}" height="${height}" preserveAspectRatio="none" style="image-rendering:pixelated"/><text x="${x + width / 2}" y="14" text-anchor="middle">${label}</text>`
  })
  const total = labels.length * width + (labels.length - 1) * gap

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${total} ${height}" width="${total}" height="${height}" font-family="${FONT}" font-size="11" font-weight="800" fill="#FFF0CE">${plates.join('')}</svg>`
}

const sizeOf = (layers: readonly string[]) => layers.reduce((n, l) => n + l.length, 0)

// Puts an answer on the band. A scene runs by itself to its end, with the Buttons
// it changed along the way; the old picture covers the new one while that loads.
// A match kept for reading later, one file each. Nothing sends it anywhere. Every
// session and every build keeps its matches in one folder, so each says whose it is.
async function keepMatch($: EngineInterface, record: object): Promise<void> {
  const dir = await matchesDir($)
  const at = new Date(await $.clock.now()).toISOString()
  const session = await $.session.id().catch(() => '')
  // A match not kept must not stop the game.
  await $.fs.write(`${dir}/${at.replaceAll(':', '-')}.json`, JSON.stringify({ at, session, build: $.plugin.root, ...record })).catch(() => undefined)
}

async function show($: EngineInterface, a: Answer): Promise<void> {
  if (a.record) {
    await keepMatch($, a.record)
  }
  if (a.toast) {
    $.ui.toast(a.toast)
    return
  }
  if (!a.screen) {
    return
  }
  isNudged = false
  clearTimers()
  await update($, failure, () => '')
  const was = await read($, view)
  const lead = (a.lead ?? 0) * STEP_MS
  const at = (await $.clock.now()) + lead
  const steps = a.steps ?? 0
  const next: View = {
    id: was.id + 1,
    screen: a.screen,
    steps,
    roll: a.roll ?? 0,
    reveal: a.reveal ?? 0,
    at,
    hud: a.hud ?? '',
    short: a.short ?? '',
    alt: a.alt ?? '',
    canContinue: a.canContinue ?? false,
    zones: a.zones ?? [],
    offer: a.offer ?? [],
    base: a.base ?? NO_BASE,
  }
  const layers = a.layers ?? []
  pictures.set(next.id, { layers, alt: next.alt })
  bar = a.bar ?? bar
  for (const id of pictures.keys()) {
    if (pictures.size > 3) {
      pictures.delete(id)
    }
  }
  const isOnScreen = a.screen === 'battle' && was.screen === 'battle' && !(await read($, isFolded))
  // A still frame keeps step with nothing: it would stand as a second army.
  const isMoving = was.steps > 0 && steps > 0
  // The core says when the scene before must not lie over this one: the lesson's opening.
  const covering = a.cover !== false && isOnScreen && isMoving && sizeOf(pictures.get(was.id)?.layers ?? []) + sizeOf(layers) + (art?.backdrop.length ?? 0) + bar.length < COVERED_TREE ? was.id : 0
  await update($, cover, () => covering)
  if (covering) {
    $.clock.after(COVER_MS, () => void update($, cover, c => (c === covering ? 0 : c)))
  }
  // The scene after a roll starts on the frame the roll stood on: no second army.
  const standing = a.screen === 'dice' ? next.id : was.screen === 'dice' ? was.id : 0
  await update($, stand, () => standing)
  if (standing === was.id && standing) {
    $.clock.after(COVER_MS, () => void update($, stand, s => (s === standing ? 0 : s)))
  }
  await update($, state, () => a.state ?? '')
  await update($, buttons, () => a.rows?.[0]?.buttons ?? { hire: [], forms: [] })
  await tell($, a.rows?.[0]?.news ?? '', a.rows?.[0]?.tone)
  await update($, fog, () => a.fog ?? '')
  const catOf = (step: number | undefined) => (step ? (a.cats?.[String(step)] ?? '') : '')
  await update($, cat, () => catOf(a.rows?.[0]?.cat))
  // The lesson begun: it is not offered again.
  if (isLessonDue && a.rows?.[0]?.cat !== undefined) {
    isLessonDue = false
    await $.store.set(LESSON_KEY, true)
  }
  if (a.fogGone !== null && a.fogGone !== undefined) {
    const gone = a.fog
    rowTimers.push($.clock.after(a.fogGone * STEP_MS, () => void update($, fog, f => (f === gone ? '' : f))))
  }
  // Before the view: a drawing that finds it stopped asks for it again.
  isRunning = next.roll > 0 || (a.screen === 'battle' && steps > 0)
  await update($, view, () => next)
  for (const row of a.rows?.slice(1) ?? []) {
    rowTimers.push(
      $.clock.after(lead + row.at * STEP_MS, async () => {
        await update($, buttons, () => row.buttons)
        await tell($, row.news ?? '', row.tone)
        await update($, cat, () => catOf(row.cat))
      }),
    )
  }
  if (a.fellAt !== null && a.fellAt !== undefined) {
    rowTimers.push($.clock.after(lead + a.fellAt * STEP_MS + FALL_MS, () => void act($, 'fall')))
  } else if (next.roll > 0 || (a.screen === 'battle' && steps > 0)) {
    timer = $.clock.after(lead + (steps + next.roll) * STEP_MS, () => void serial($, ended))
  }
  await persist($)

  async function ended(): Promise<void> {
    if (isShown && !isTurnOver && !(await read($, isFolded)) && (await read($, view)).id === next.id) {
      await show($, await ask($, 'next'))
    } else {
      isRunning = false
    }
  }
}

function act($: EngineInterface, op: string, arg = ''): Promise<void> {
  return serial($, async () => {
    await show($, await ask($, op, arg))
  })
}

// A Button's or a card's key: a request and what it names.
function press($: EngineInterface, key: string): Promise<void> {
  const [op = '', arg = ''] = key.split(':')

  return act($, op, arg)
}

export function isLate(v: { at: number; steps: number; roll: number }, now: number): boolean {
  return now - v.at - (v.steps + v.roll) * STEP_MS > LATE_MS
}

const isFought = (v: View) => v.screen === 'battle' || v.screen === 'dice'

// The scenes run on one timer, and a stopped chain starts again only at the next
// drawing, which may not come: the picture stood still and Buttons went dead until a
// prompt redrew the band. A timer survives neither a reload nor a lost hooks worker,
// so this one is set again by session.start, and asks for that drawing itself.
async function look($: EngineInterface): Promise<void> {
  const v = await read($, view)
  if (isNudged || !(isFought(v) && v.steps + v.roll > 0) || (await read($, isFolded)) || !isLate(v, await $.clock.now())) {
    return
  }
  isNudged = true
  isRunning = false
  await $.ui.invalidate('ui.render')
}

// Lines added, edited and deleted by what Edit or Write answers: a removal next to an
// addition is one edited line. A new file has no diff, only its text.
export function linesOf(output: unknown): number[] {
  const { structuredPatch: patch = [], type, content } = (output ?? {}) as { structuredPatch?: { lines: string[] }[]; type?: string; content?: string }
  if (type === 'create') {
    return [content ? content.replace(/\n$/, '').split('\n').length : 0, 0, 0]
  }
  const totals = [0, 0, 0]
  for (const { lines } of patch) {
    let [gone, come] = [0, 0]
    for (const line of [...lines, ' ']) {
      if (line.startsWith('-')) {
        gone += 1
      } else if (line.startsWith('+')) {
        come += 1
      } else {
        const both = Math.min(gone, come)
        totals[0] = (totals[0] ?? 0) + come - both
        totals[1] = (totals[1] ?? 0) + both
        totals[2] = (totals[2] ?? 0) + gone - both
        ;[gone, come] = [0, 0]
      }
    }
  }
  return totals
}

// What the row says of a number of tokens.
const tokensOf = (n: number) => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n))
const toolOf = (tool: string) => tool.split('__').at(-1) ?? tool
const FADE_MS = FLASH.holdMs + FLASH.fadeMs


// What the row says of a model request.
export function spentRow(tokens: number, mana: number): string {
  return say('spent', '{tokens} TOKENS SPENT: +{mana} MANA', { tokens: tokensOf(tokens), mana: Math.round(mana * 10) / 10 })
}

// Lights the row with what Claude just did and what that paid: a dim line that
// stayed was not seen, and a sum with no cause said nothing (seen 2026-10-31). What
// it set the orcs up with is said when it grows, not again at every payday.
async function light($: EngineInterface, why: string, grew: 'fury' | 'totem' | '' = ''): Promise<void> {
  const base = (await read($, view)).base
  const w = await read($, progress)
  const threat =
    grew === 'fury'
      ? say('enraged', 'ORCS ENRAGED x{n}', { n: base.fury + w.errors - base.usedErrors })
      : grew === 'totem'
        ? say('totem', 'ORC TOTEM x{n}', { n: base.totems + w.compactions - base.usedCompactions })
        : ''
  isNewsLast = false
  litCount += 1
  unlit?.cancel()
  await update($, flash, () => ({ said: why, threat, grew }))
  unlit = $.clock.after(FADE_MS, () => void update($, flash, () => ({ said: '', threat: '' })))
}

// The battle's news, and whether it came after what Claude did: the board says the
// latest of the two.
async function tell($: EngineInterface, text: string, tone: Tone | null = null): Promise<void> {
  if (text && text !== (await read($, news))) {
    isNewsLast = true
  }
  await update($, news, () => text)
  await update($, newsTone, () => tone ?? 'army')
}

// Folds the band, which pauses the battle where it stands, or opens it, on a scene
// begun now.
function fold($: EngineInterface, isNow: boolean): Promise<void> {
  return serial($, async () => {
    // Before the pause: a drawing that finds a still battle on an open band restarts it.
    if (isNow) {
      await update($, isFolded, () => true)
    }
    const { screen } = await read($, view)
    // A roll keeps its card: folded it stops, and Show rolls it again.
    if (screen === 'dice') {
      isRunning = false
      clearTimers()
      if (!isNow) {
        await show($, await ask($, 'roll'))
      }
    } else if (screen === 'battle') {
      await show($, await ask($, isNow ? 'hold' : 'unfold'))
    }
    await update($, isFolded, () => isNow)
  })
}

// The screen there is, drawn again in the language just picked: its pictures and words
// are the core's, and the art carries the hooks' own.
async function redraw($: EngineInterface): Promise<void> {
  art = (await ask($, 'art')) as Art
  words = art.words ?? {}
  pictures.clear()
  const { screen } = await read($, view)
  const isHidden = await read($, isFolded)
  const op: Record<string, string> = { title: 'open', settings: 'settings', over: 'over', mode: 'new', spin: 'spin', draft: 'pick', dice: isHidden ? '' : 'roll', battle: isHidden || isTurnOver ? 'hold' : 'unfold' }
  if (op[screen]) {
    await show($, await ask($, op[screen]))
  }
  await $.ui.invalidate('ui.render')
}

// The core's pictures that never change, and the game as stored.
async function wake($: EngineInterface): Promise<void> {
  if (!version) {
    await readManifest($)
    void readLatest($, await knownLatest($)).catch(() => undefined)
  }
  if (!art) {
    art = (await ask($, 'art')) as Art
    words = art.words ?? {}
    await $.ui.invalidate('ui.render')
  }
  if (!(await read($, isLoaded))) {
    const own = await keyOf($)
    await forget($, own)
    const stored = ((await $.store.get(own)) ?? (await $.store.get(STORE_KEY))) as Partial<Stored> | undefined
    // A player with a game saved from before the lesson knows the game already.
    isLessonDue = !(await $.store.get(LESSON_KEY)) && !stored
    if (typeof stored?.state === 'string' && stored.work) {
      await update($, state, () => stored.state ?? '')
      await update($, progress, () => ({ ...NO_WORK, ...stored.work }))
    }
    await update($, isLoaded, () => true)
    await show($, await ask($, 'open'))
  }
  // A reload keeps the view and loses its picture. Picking nothing changes nothing,
  // and the core answers with the draft as it stands.
  const v = await read($, view)
  if (v.screen === 'draft' && !pictures.has(v.id)) {
    await show($, await ask($, 'pick'))
  }
  if (v.screen === 'over' && !pictures.has(v.id)) {
    await show($, await ask($, 'over'))
  }
  if (v.screen === 'title' && !pictures.has(v.id)) {
    await show($, await ask($, 'open'))
  }
  if (v.screen === 'settings' && !pictures.has(v.id)) {
    await show($, await ask($, 'settings'))
  }
  if (v.screen === 'mode' && !pictures.has(v.id)) {
    await show($, await ask($, 'new'))
  }
  if (v.screen === 'spin' && !pictures.has(v.id)) {
    await show($, await ask($, 'spin'))
  }
}

export const register: Register = on => {
  on('session.start', async ($, e, next) => {
    // A failure the hooks before a reload left in the session's state would stand over
    // the band for good: only a scene drawn clears it, and a failure draws none. The old
    // hooks lost their native core to the JavaScript one and said so after the reload
    // (2026-11-10).
    await update($, failure, () => '')
    const dev = await devBuild($)
    await serial($, () => wake($))
    if (dev) {
      await $.command.register({ name: COMMAND, description: say('command', '"lang" picks the language, "lesson" plays the lesson, "test" fields one of each line, "card" plays the next card of the deck, "victory" and "defeated" show how a match ends') })
    }
    beat?.cancel()
    beat = $.clock.every(BEAT_MS, () => void look($))

    return next(e)
  })

  on('command.run', { command: COMMAND }, async ($, e) => {
    // The release registers no command; this answers none there either.
    if (!(await devBuild($))) {
      return { text: '' }
    }
    // A test field, shown whether or not Claude works.
    if (e.args.trim() === 'test') {
      await act($, 'test')
      await update($, isFolded, () => false)
      return { text: say('reply.test', 'One of each line on each side.') }
    }
    // The language, for all sessions: the core's words and pictures, drawn again.
    const [verb, code = ''] = e.args.trim().split(/\s+/)
    if (verb === 'lang') {
      const list = Object.entries(LANGS).map(([c, name]) => `${c} — ${name}`).join(', ')
      if (!(code in LANGS)) {
        return { text: say('reply.lang', 'Language: {name}. Pick one: {list}, as "/banners-of-lore lang ru".', { name: LANGS[(await langOf($)) || 'en'] ?? 'English', list }) }
      }
      await setLang($, code)
      return { text: say('reply.lang_set', 'Language: {name}.', { name: LANGS[code] ?? code }) }
    }
    // A card of the deck, by name or the next one, rolled on the running match.
    const [word, ...named] = e.args.trim().split(/\s+/)
    if (word === 'card') {
      await act($, 'card', named.join(' '))
      return { text: say('reply.card', 'The die rolls over the stopped battle while Claude works. A face can follow the name: "card Misfire deleted 30".') }
    }
    // The lesson again, at any time.
    if (e.args.trim() === 'lesson') {
      await act($, 'lesson')
      await update($, isFolded, () => false)
      return { text: say('reply.lesson', 'The scholar cat leads a short battle. Restart skips it.') }
    }
    // The end of a match, shown without playing one.
    if (e.args.trim() === 'victory' || e.args.trim() === 'defeated') {
      await act($, 'preview', e.args.trim())
      await update($, isFolded, () => false)
      return { text: say('reply.preview', 'A click goes on to the title.') }
    }
    return { text: say('reply.help', 'The battle runs while Claude works. "/banners-of-lore lang" picks the language, "/banners-of-lore test" fields one of each line.') }
  })

  // On every tool's path: the lines a call changed bring cards, and an errored call
  // enrages what the orcs spawn next.
  on('tool.call', async ($, e, next) => {
    const result = await next(e)
    if (result.deny === undefined && !result.isError && (e.tool === 'Edit' || e.tool === 'Write')) {
      const counted = linesOf(result.result)
      await update($, progress, w => ({ ...w, lines: w.lines.map((n, k) => n + (counted[k] ?? 0)) }))
    }
    if (result.deny === undefined && result.isError) {
      await update($, progress, w => ({ ...w, errors: w.errors + 1 }))
      await light($, say('failed', '{tool} FAILED', { tool: toolOf(String(e.tool)).toUpperCase() }), 'fury')
    }

    return result
  }).catch(($, e, next) => next(e))

  // Every model request, the main thread's or a subagent's, pays for the tokens it
  // spent. On the stream's path: forward it whole, then count, and never fail the
  // answer over a lost count.
  on('turn.step', async function* ($, e, next) {
    const result = yield* next(e)
    try {
      if (result.usage && art) {
        const { output_tokens: out, input_tokens: input, cache_creation_input_tokens: cached } = result.usage
        const earned = out * art.rates.workPerOutput + (input + cached) * art.rates.workPerInput
        await update($, progress, w => ({ ...w, work: w.work + earned, tokens: w.tokens + out }))
        await light($, spentRow(out + input + cached, earned))
      }
    } catch {
      // The pay of one request is not worth Claude's answer.
    }

    return result
  })

  // A compaction of the main conversation raises the orcs' totem at a coming spawn.
  // A precompute installs nothing and a veto keeps the conversation, so neither
  // counts; a subagent's own compaction does not either.
  on('session.compact', async ($, e, next) => {
    const result = await next(e)
    if (e.trigger !== 'precompute' && !e.agentId && !('skip' in result && result.skip)) {
      await update($, progress, w => ({ ...w, compactions: w.compactions + 1 }))
      await light($, say('compacted', 'CONTEXT COMPACTED'), 'totem')
    }

    return result
  }).catch(($, e, next) => next(e))

  // A click on a picture, heard by the clear layer over it.
  on('ui.message', async ($, e, next) => {
    const v = await read($, view)
    // A plate of the title, by the key the core gave it. A click that names none is the
    // old title's: the match saved, a first player's lesson, or a new match.
    if (e.element === 'title-click') {
      const { key } = (e.data ?? {}) as { key?: string }
      if (v.screen !== 'title') {
        return {}
      }
      if (key === undefined) {
        await act($, v.canContinue ? 'go' : isLessonDue ? 'lesson' : 'new')
      } else if (key === 'go' || key === 'new' || key === 'lesson' || key === 'settings') {
        await act($, key)
      } else if (key === 'update') {
        const { isCopied } = await $.ui.copy({ text: UPDATE_COMMAND, surface: e.surface })
        await light($, isCopied ? say('copied', 'UPDATE COMMAND COPIED') : UPDATE_COMMAND)
      } else if (links()[key]) {
        await openLink($, links()[key] ?? '')
      }
      return {}
    }
    if (e.element === 'settings-click') {
      const { key = '' } = (e.data ?? {}) as { key?: string }
      if (v.screen === 'settings') {
        if (key.startsWith('lang:')) {
          await setLang($, key.slice(5))
        } else if (key.startsWith('level:')) {
          await setLevel($, key.slice(6))
          await act($, 'settings')
        } else if (key.startsWith('hints:')) {
          await setHints($, key.slice(6))
          await act($, 'settings')
        } else if (key === 'back') {
          await act($, 'open')
        }
      }
      return {}
    }
    if (e.element === 'over-click') {
      if (v.screen === 'over') {
        // The plate of another level starts a match on it; a click elsewhere goes on.
        const { key = '' } = (e.data ?? {}) as { key?: string }
        const [kind, to] = key.split(':')
        if ((kind === 'harder' || kind === 'easier') && to) {
          await setLevel($, to)
          await act($, 'new')
        } else {
          await act($, 'open')
        }
      }
      return {}
    }
    if (e.element === 'spin-click') {
      if (v.screen === 'spin') {
        // A click while the picture plays shows it all; the next goes on.
        const isPlaying = (await $.clock.now()) - v.at < v.reveal * 1000
        await act($, isPlaying ? 'reveal' : 'spun')
      }
      return {}
    }
    // A click on the running battle: the card of what stands there.
    if (e.element === 'scene-click') {
      if (v.screen === 'battle') {
        const { x, y } = e.data as { x: number; y: number }
        await act($, 'inspect', `${Math.round(x * 1000)} ${Math.round(y * 230)}`)
      }
      return {}
    }
    if (e.element === 'corner-click') {
      const { key } = e.data as { key: string }
      // Restart goes to the title, where New game starts anew and Continue keeps the
      // match (the user, 2026-11-08: «Restart должен вести на главный экран»).
      if (key === 'restart') {
        await act($, 'open')
      } else {
        await fold($, key === 'fold')
      }
      return {}
    }
    // A bay of the hire bar: its upgrade's corner, or the hire. Nothing while the die rolls.
    if (e.element === 'hire-click') {
      const { bay, isUp } = e.data as { bay: number; isUp: boolean }
      const { hire, forms } = await read($, buttons)
      const hired = hire[bay]
      const choice = isUp ? forms.find(f => f.key.split(':')[1] === hired?.key.split(':')[1]) : hired
      // The free place again, over its own choice: back to the battle.
      if (v.screen === 'dice' && choice?.key === 'slot') {
        await act($, 'next')
        return {}
      }
      // A shut place waits for the one before it.
      if (v.screen === 'battle' && choice && choice.key !== 'locked') {
        await press($, choice.key)
      }
      return {}
    }
    // Read already: a click puts the row out, with no wait for its seconds.
    if (e.element === 'flash-click') {
      unlit?.cancel()
      await update($, flash, () => ({ said: '', threat: '' }))
      return {}
    }
    // Read or not, a click on the die's turn goes back to the battle. Over a free place's
    // choice a card opens its line, and a click beside them goes back the same.
    if (e.element === 'roll-click') {
      if (v.screen === 'dice') {
        const { key = '' } = (e.data ?? {}) as { key?: string }
        await (key.startsWith('take:') ? press($, key) : act($, 'next'))
      }
      return {}
    }
    if (e.element === 'mode-click') {
      if (v.screen === 'mode') {
        await act($, Number((e.data as { card?: number }).card) === 0 ? 'manual' : 'random')
      }
      return {}
    }
    if (e.element === 'draft-click') {
      const card = v.offer[Number((e.data as { card?: number }).card)]
      if (v.screen === 'draft' && card) {
        await press($, card.key)
      }
      return {}
    }

    return next(e)
  })

  on('turn.start', async ($, e, next) => {
    if (!e.agentId) {
      isTurnOver = false
      // A new core reloads nothing here, and the old backdrop stayed on (seen
      // 2026-10-31): each turn takes the pictures afresh.
      await ask($, 'art').then(
        a => {
          art = a as Art
        },
        () => undefined,
      )
      // The band may have been drawn for this turn before the flag fell, and nothing
      // else draws it until the first tool: a long think showed no band (seen 2026-11-02).
      await $.ui.invalidate('ui.render')
    }

    return next(e)
  })

  // The game is for the wait while Claude works: it pauses as the turn ends, not when
  // its picture runs out up to 23 s later, and goes on from there.
  on('turn.complete', async ($, e, next) => {
    if (!e.agentId) {
      isTurnOver = true
      const v = await read($, view)
      if (v.screen === 'battle' && !(await read($, isFolded))) {
        await act($, 'hold')
      }
    }

    return next(e)
  })

  on('ui.render', { component: 'AbovePrompt' }, async ($, e, next) => {
    if ((e.surface !== 'desktop' && e.surface !== 'terminal') || e.props.hasSurvey) {
      return next(e)
    }
    // A hook that fails is skipped and the band is simply gone, with no word of why
    // (seen 2026-10-31): the failure draws itself instead.
    try {
      // The game is for the wait: the band shows only while Claude works.
      isShown = e.props.isWorking && !isTurnOver
      if (!isShown) {
        return next(e)
      }
      const { Box, Button, Text } = $.ui.resolve(e)
      const desk = e.surface === 'desktop' ? $.ui.resolve(e) : null
      const broken = await read($, failure)
      if (broken) {
        return <Text color="#FF8A7A">{`banners-of-lore: ${broken}`}</Text>
      }
      const v = await read($, view)
      // After a reload the pictures take a moment to come, and one empty Svg would
      // fail the whole hook (seen 2026-10-31).
      if (desk && (!art || ((v.screen === 'draft' || v.screen === 'over' || v.screen === 'mode' || v.screen === 'spin' || v.screen === 'settings') && !pictures.has(v.id)))) {
        return next(e)
      }
      const rows = Math.min(ROWS, Math.max(4, e.props.maxRows - 2))
      // The row over the field, Hide in its corner, the same on every screen. Restart
      // beside it, on the title too while a match is saved: a click on the title goes
      // on with that match. The terminal keeps the title's own Buttons.
      const dev = isDev ? <Text key="dev" bold color="#F4BD60">DEV</Text> : null
      const corner = (plates: CornerProps['plates']) =>
        desk ? (
          <Box key="corner-row" flexDirection="row" alignItems="center" gap={1} flexShrink={0}>
            {dev}
            <Box key="corner" position="relative" flexDirection="column" flexShrink={0}>
              <desk.Svg source={plateSvg(plates.map(p => p.label))} alt={NO_TIP} width={plates.length * PLATE_PX.width + (plates.length - 1) * PLATE_PX.gap} height={PLATE_PX.height} />
              <Box key="corner-click" position="absolute" top={0} left={0} flexDirection="column" width="100%">
                <desk.Client key="corner-click" module="./corner-client.tsx" props={{ columns: plates.length * PLATE_COLUMNS, plates } satisfies CornerProps} width="100%" height={1} />
              </Box>
            </Box>
          </Box>
        ) : null
      const topRow = (left: RenderElement) => (
        <Box key="top" flexDirection="row" alignItems="center" justifyContent="space-between" width="100%">
          {left}
          {desk ? (
            corner([...(v.screen === 'title' || v.screen === 'settings' ? [] : [{ key: 'restart', label: say('restart', 'Restart') }]), { key: 'fold', label: say('hide', 'Hide') }])
          ) : (
            <Box key="corner" flexDirection="row" alignItems="center" gap={1}>
              {dev}
              {v.screen === 'title' ? null : <Button key="restart" label={say('restart', 'Restart')} variant="secondary" onPress={() => void act($, 'open')} />}
              <Button key="fold" label={say('hide', 'Hide')} variant="secondary" onPress={() => void fold($, true)} />
            </Box>
          )}
        </Box>
      )
      const blank = <Text> </Text>
      if (await read($, isFolded)) {
        return (
          <Box flexDirection="row" alignItems="center" gap={1} width={e.props.bodyColumns}>
            {desk ? corner([{ key: 'unfold', label: say('show', 'Show') }]) : <Button key="unfold" label={say('show', 'Show')} onPress={() => void fold($, false)} />}
            <Text bold color="#F4BD60">
              {isFought(v) ? say('paused', 'PAUSED · {short}', { short: v.short }) : v.short}
            </Text>
          </Box>
        )
      }
      // The still backdrop with what lies over it, and a clear layer that hears a
      // click on the picture. On the desktop that click is the whole control: Buttons
      // under the picture only said it again.
      const size: TitleProps = { columns: e.props.bodyColumns, rows }
      const field = (key: string, source: string, click: RenderElement) =>
        desk ? (
          <Box position="relative" flexDirection="column" width="100%">
            <Box key="backdrop" flexDirection="column" width="100%">
              <desk.Svg source={art?.backdrop ?? ''} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} />
            </Box>
            <Box key={key} position="absolute" top={0} left={0} flexDirection="column" width="100%">
              <desk.Svg source={source} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} />
            </Box>
            <Box key={`${key}-click`} position="absolute" top={0} left={0} flexDirection="column" width="100%">
              {click}
            </Box>
          </Box>
        ) : null
      if (v.screen === 'title') {
        const row = (
          <Box flexDirection="row" alignItems="center" flexWrap="wrap" gap={1}>
            {v.canContinue
              ? [
                  <Button key="continue" label={say('continue', 'Continue')} variant="primary" onPress={() => void act($, 'go')} />,
                  <Button key="start" label={say('new_match', 'New match')} variant="secondary" onPress={() => void act($, 'new')} />,
                ]
              : [<Button key="start" label={say('play', 'Play')} variant="primary" onPress={() => void act($, 'new')} />]}
          </Box>
        )
        if (desk) {
          return (
            <Box flexDirection="column" width={e.props.bodyColumns}>
              {/* As wide as the picture: on a wide band the clear layers ran past it, and every click landed off its plate; it stands in the middle (the user, 2026-11-10). */}
              <Box flexDirection="column" alignSelf="center">
              {topRow(blank)}
              {field('title', pictures.get(v.id)?.layers[0] ?? art?.title ?? '', <desk.Client key="title-click" module="./title-client.tsx" props={{ ...size, zones: v.zones } satisfies TitleProps} width="100%" height={rows} />)}
              </Box>
            </Box>
          )
        }
        return (
          <Box flexDirection="column" width={e.props.bodyColumns}>
            {topRow(blank)}
            <Text bold color="#F4BD60">
              CLICK TO PLAY
            </Text>
            <Text>Raze the orc gate and hold your castle</Text>
            {row}
          </Box>
        )
      }
      // The settings, over the field as the title: the language for now, and back.
      if (v.screen === 'settings') {
        if (desk) {
          return (
            <Box flexDirection="column" width={e.props.bodyColumns}>
              {/* As wide as the picture: on a wide band the clear layers ran past it, and every click landed off its plate; it stands in the middle (the user, 2026-11-10). */}
              <Box flexDirection="column" alignSelf="center">
              {topRow(blank)}
              {field('settings', pictures.get(v.id)?.layers[0] ?? '', <desk.Client key="settings-click" module="./title-client.tsx" props={{ ...size, zones: v.zones } satisfies TitleProps} width="100%" height={rows} />)}
              </Box>
            </Box>
          )
        }
        return (
          <Box flexDirection="column" width={e.props.bodyColumns}>
            {topRow(blank)}
            <Box flexDirection="row" alignItems="center" flexWrap="wrap" gap={1}>
              {Object.entries(LANGS).map(([code, name]) => (
                <Button key={`lang:${code}`} label={name} variant={code === ((lang ?? '') || 'en') ? 'primary' : 'secondary'} onPress={() => void setLang($, code)} />
              ))}
              {v.zones
                .filter(z => z.key.startsWith('level:'))
                .map(z => z.key.slice(6))
                .map(code => (
                  <Button key={`level:${code}`} label={{ easy: say('easy', 'Easy'), normal: say('normal', 'Normal'), hard: say('hard', 'Hard') }[code] ?? code} variant={code === ((level ?? '') || 'normal') ? 'primary' : 'secondary'} onPress={() => void setLevel($, code).then(() => act($, 'settings'))} />
                ))}
              {v.zones
                .filter(z => z.key.startsWith('hints:'))
                .map(z => z.key.slice(6))
                .map(code => (
                  <Button key={`hints:${code}`} label={code === 'off' ? say('off', 'Off') : say('on', 'On')} variant={code === ((hints ?? '') === 'off' ? 'off' : 'on') ? 'primary' : 'secondary'} onPress={() => void setHints($, code).then(() => act($, 'settings'))} />
                ))}
              <Button key="back" label={say('back', 'Back')} variant="secondary" onPress={() => void act($, 'open')} />
            </Box>
          </Box>
        )
      }
      if (v.screen === 'draft') {
        const row = (
          <Box flexDirection="row" alignItems="center" flexWrap="wrap" gap={1}>
            {v.offer.map(o => (
              <Button key={o.key} label={o.label} variant="primary" onPress={() => void press($, o.key)} />
            ))}
          </Box>
        )
        if (desk) {
          return (
            <Box flexDirection="column" width={e.props.bodyColumns}>
              {/* As wide as the picture: on a wide band the clear layers ran past it, and every click landed off its plate; it stands in the middle (the user, 2026-11-10). */}
              <Box flexDirection="column" alignSelf="center">
              {topRow(blank)}
              {field('draft', pictures.get(v.id)?.layers[0] ?? '', <desk.Client key="draft-click" module="./draft-client.tsx" props={{ ...size, cards: 3 } satisfies DraftProps} width="100%" height={rows} />)}
              </Box>
            </Box>
          )
        }
        return (
          <Box flexDirection="column" width={e.props.bodyColumns}>
            {topRow(blank)}
            <Text bold color="#F4BD60">
              {v.short}
            </Text>
            <Text>{v.offer.map(o => o.text).join(' · ')}</Text>
            {row}
          </Box>
        )
      }
      if (v.screen === 'mode') {
        const row = (
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Button key="manual" label={say('manual', 'Manual')} variant="primary" onPress={() => void act($, 'manual')} />
            <Button key="random" label={say('random', 'Random')} variant="primary" onPress={() => void act($, 'random')} />
          </Box>
        )
        if (desk) {
          return (
            <Box flexDirection="column" width={e.props.bodyColumns}>
              {/* As wide as the picture: on a wide band the clear layers ran past it, and every click landed off its plate; it stands in the middle (the user, 2026-11-10). */}
              <Box flexDirection="column" alignSelf="center">
              {topRow(blank)}
              {field('mode', pictures.get(v.id)?.layers[0] ?? '', <desk.Client key="mode-click" module="./draft-client.tsx" props={{ ...size, cards: 2 } satisfies DraftProps} width="100%" height={rows} />)}
              </Box>
            </Box>
          )
        }
        return (
          <Box flexDirection="column" width={e.props.bodyColumns}>
            {topRow(blank)}
            <Text bold color="#F4BD60">
              {v.short}
            </Text>
            {row}
          </Box>
        )
      }
      if (v.screen === 'spin') {
        const shown = pictures.get(v.id)
        const row = (
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Button key="fight" label={say('fight', 'Fight')} variant="primary" onPress={() => void act($, 'spun')} />
          </Box>
        )
        if (desk) {
          return (
            <Box flexDirection="column" width={e.props.bodyColumns}>
              {/* As wide as the picture: on a wide band the clear layers ran past it, and every click landed off its plate; it stands in the middle (the user, 2026-11-10). */}
              <Box flexDirection="column" alignSelf="center">
              {topRow(blank)}
              <Box position="relative" flexDirection="column" width="100%">
                <Box key="backdrop" flexDirection="column" width="100%">
                  <desk.Svg source={art?.backdrop ?? ''} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} />
                </Box>
                <Box key="wall" position="absolute" top={0} left={0} flexDirection="column" width="100%">
                  <desk.Svg source={shown?.layers[0] ?? ''} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} />
                </Box>
                {/* Only the reels move: the five on the wall are a plain image, which comes up at once. */}
                <Box key="reels" position="absolute" top={0} left={0} flexDirection="column" width="100%">
                  <desk.Svg source={shown?.layers[1] ?? ''} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} isInteractive={v.reveal > 0} />
                </Box>
                <Box key="spin-click" position="absolute" top={0} left={0} flexDirection="column" width="100%">
                  <desk.Client key="spin-click" module="./title-client.tsx" props={size} width="100%" height={rows} />
                </Box>
              </Box>
              </Box>
            </Box>
          )
        }
        return (
          <Box flexDirection="column" width={e.props.bodyColumns}>
            {topRow(blank)}
            <Text bold color="#F4BD60">
              {v.short}
            </Text>
            {row}
          </Box>
        )
      }
      if (v.screen === 'over') {
        const [kind = '', to = ''] = (v.zones.find(z => z.key.startsWith('harder:') || z.key.startsWith('easier:'))?.key ?? '').split(':')
        const row = (
          <Box flexDirection="row" alignItems="center" gap={1}>
            <Button key="on" label={say('continue', 'Continue')} variant="primary" onPress={() => void act($, 'open')} />
            {to ? <Button key="level" label={kind === 'harder' ? say('harder', 'Harder') : say('easier', 'Easier')} variant="secondary" onPress={() => void setLevel($, to).then(() => act($, 'new'))} /> : null}
          </Box>
        )
        if (desk) {
          return (
            <Box flexDirection="column" width={e.props.bodyColumns}>
              {/* As wide as the picture: on a wide band the clear layers ran past it, and every click landed off its plate; it stands in the middle (the user, 2026-11-10). */}
              <Box flexDirection="column" alignSelf="center">
              {topRow(blank)}
              {field('over', pictures.get(v.id)?.layers[0] ?? '', <desk.Client key="over-click" module="./title-client.tsx" props={{ ...size, zones: v.zones } satisfies TitleProps} width="100%" height={rows} />)}
              </Box>
            </Box>
          )
        }
        return (
          <Box flexDirection="column" width={e.props.bodyColumns}>
            {topRow(blank)}
            <Text bold color="#F4BD60">
              {v.short}
            </Text>
            {row}
          </Box>
        )
      }
      // A drawing writes nothing: the scenes start on a timer of their own.
      if (!isRunning) {
        isRunning = true
        $.clock.after(0, () => void act($, v.screen === 'dice' ? 'roll' : 'resume'))
      }
      const held = await read($, buttons)
      // Nothing is bought while the die rolls: a purchase would start the scene and cut it off.
      const isRolling = v.screen === 'dice'
      const choice = (c: Choice) =>
        c.lit && !isRolling ? (
          <Button key={c.key} label={`${c.star ? '★ ' : ''}${c.label}`} onPress={() => void press($, c.key)} />
        ) : (
          <Button key={c.key} label={`${c.star ? '★ ' : ''}${c.label}`} variant="secondary" dimColor onPress={() => void (isRolling ? undefined : press($, c.key))} />
        )
      // Spacing flows from the parent: rows of Buttons with none overlapped, a Button
      // standing taller than its row (seen 2026-10-31). No hotkey: a bare digit typed
      // into an empty prompt would press it.
      // A free place's choice in text: a Button a line, by the names the core gave in order.
      const names = v.alt.split(' · ')
      const takes = isRolling ? v.zones.filter(z => z.key.startsWith('take:')) : []
      const controls = (
        <Box flexDirection="column" gap={1} width="100%">
          {takes.length > 0 ? (
            <Box flexDirection="row" alignItems="center" flexWrap="wrap" gap={1}>
              {takes.map((z, i) => (
                <Button key={z.key} label={`${say('place', 'Place')}: ${names[i] ?? z.key.slice(5)}`} onPress={() => void press($, z.key)} />
              ))}
            </Box>
          ) : null}
          <Box flexDirection="row" alignItems="center" flexWrap="wrap" gap={1}>
            {held.hire.filter(c => c.key !== 'locked').map(choice)}
          </Box>
          {held.forms.length > 0 ? (
            <Box flexDirection="row" alignItems="center" flexWrap="wrap" gap={1}>
              {held.forms.map(choice)}
            </Box>
          ) : null}
        </Box>
      )
      const { said, threat, grew } = await read($, flash)
      const told = v.screen === 'battle' ? await read($, news) : ''
      const toldTone = await read($, newsTone)
      const fogged = v.screen === 'battle' || v.screen === 'dice' ? await read($, fog) : ''
      const catted = v.screen === 'battle' ? await read($, cat) : ''
      // The board ends before Restart and Hide begin: at its full width a narrow band
      // laid the orcs' line under Restart (seen 2026-11-03).
      const boardColumns = Math.max(0, Math.min(Math.round((BOARD_PX * PLATE_COLUMNS) / PLATE_PX.width), e.props.bodyColumns - 2 * PLATE_COLUMNS - 3 - (isDev ? DEV_COLUMNS : 0)))
      const lit = [said, threat].filter(Boolean).join(' · ')
      const board: BoardProps =
        told && (isNewsLast || !lit)
          ? { columns: boardColumns, text: told, color: BOARD_INK[toldTone], stamp: 0, fade: null }
          : { columns: boardColumns, text: lit, color: BOARD_INK[grew === 'totem' ? 'totem' : threat ? 'orcs' : 'mana'], stamp: litCount, fade: FLASH }
      if (desk) {
        const top = await read($, cover)
        const still = pictures.get(await read($, stand))
        // The still backdrop sets the size and the scene lies over it, the scene
        // before beside it while the new one loads. Scenes take turns in two slots
        // that never move: a frame put after the new one's started over, and the
        // whole army stood twice, a scene apart (seen 2026-10-31).
        const slot = (n: number, layer: number) => {
          const shown = pictures.get((isRolling ? [] : [v.id, top]).find(id => id > 0 && id % 2 === n) ?? 0)
          const source = shown?.layers[layer]
          return (
            <Box key={`slot-${n}-${layer}`} position="absolute" top={0} left={0} flexDirection="column" width="100%">
              {source ? <desk.Svg source={source} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} isInteractive /> : null}
            </Box>
          )
        }
        // The stopped battle and the veil are plain images, which come up at once.
        const flat = (key: string, source: string | undefined) => (
          <Box key={key} position="absolute" top={0} left={0} flexDirection="column" width="100%">
            {source ? <desk.Svg source={source} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} /> : null}
          </Box>
        )
        const rolled = isRolling ? pictures.get(v.id) : undefined
        const bays: Bay[] = held.hire.map(c => {
          const up = held.forms.find(f => f.key.split(':')[1] === c.key.split(':')[1])
          return { price: c.price ?? '', count: c.count ?? 0, lit: c.lit && !isRolling, star: (c.star ?? false) && !isRolling, up: up ? { price: up.price ?? '', lit: up.lit && !isRolling, star: (up.star ?? false) && !isRolling } : null, out: c.out === null || c.out === undefined || isRolling ? null : c.out * STEP_MS, every: c.every ? c.every * STEP_MS : null, wanted: (c.wanted ?? false) && !isRolling }
        })
        const hireBar = (
          <Box key="hire-bar" position="relative" flexDirection="column" width="100%" marginTop={BAR_LIFT}>
            <desk.Svg source={bar} alt={NO_TIP} width={BAR_PX.width} height={BAR_PX.height} />
            <Box key="hire-click" position="absolute" top={0} left={0} flexDirection="column" width="100%">
              <desk.Client key="hire-click" module="./hire-client.tsx" props={{ columns: e.props.bodyColumns, bays } satisfies HireProps} width="100%" />
            </Box>
          </Box>
        )
        return (
          <Box flexDirection="column" width={e.props.bodyColumns}>
            {/* As wide as the picture: on a wide band the clear layers ran past it, and every click landed off its plate; it stands in the middle (the user, 2026-11-10). */}
            <Box flexDirection="column" alignSelf="center">
            {/* Always drawn, so the field does not jump as the row comes and goes. */}
            {topRow(
              // In the row's flow: laid over a box with nothing else in it, the words took
              // its size, none, and were not seen (2026-11-06).
              <Box key="flash" flexDirection="column" width={Math.max(1, boardColumns)} flexShrink={0}>
                <desk.Client key="flash-click" module="./board-client.tsx" props={board} width={Math.max(1, boardColumns)} height={1} />
              </Box>,
            )}
            <Box position="relative" flexDirection="column" width="100%">
              <Box key="backdrop" flexDirection="column" width="100%">
                <desk.Svg source={art?.backdrop ?? ''} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} />
              </Box>
              {flat('stand-0', still?.layers[0])}
              {flat('stand-1', still?.layers[1])}
              {[0, 1].flatMap(n => [0, 1].map(layer => slot(n, layer)))}
              {flat('fog', fogged || undefined)}
              {/* Still: the desktop takes images out of a picture that moves. */}
              {flat('cat', catted || undefined)}
              {flat('roll-veil', rolled?.layers[2])}
              <Box key="roll-die" position="absolute" top={0} left={0} flexDirection="column" width="100%">
                {rolled?.layers[3] ? <desk.Svg source={rolled.layers[3]} alt={NO_TIP} width={FIELD_PX.width} height={FIELD_PX.height} isInteractive /> : null}
              </Box>
              {rolled ? null : (
                <Box key="scene-click" position="absolute" top={0} left={0} flexDirection="column" width="100%">
                  <desk.Client key="scene-click" module="./point-client.tsx" props={size} width="100%" height={rows} />
                </Box>
              )}
              {rolled ? (
                <Box key="roll-click" position="absolute" top={0} left={0} flexDirection="column" width="100%">
                  <desk.Client key="roll-click" module="./title-client.tsx" props={{ ...size, zones: v.zones } satisfies TitleProps} width="100%" height={rows} />
                </Box>
              ) : null}
            </Box>
            {bar ? hireBar : controls}
            {/* A Button stands taller than its row: the last would be cut off. */}
            {bar ? null : <Box key="room" height={1} />}
            </Box>
          </Box>
        )
      }

      return (
        <Box flexDirection="column" width={e.props.bodyColumns}>
          {topRow(
            <Text bold color="#F4BD60">
              {(isRolling ? v.alt : lit) || ' '}
            </Text>,
          )}
          <Text color="#FFF0CE">{v.hud}</Text>
          {controls}
        </Box>
      )
    } catch (err) {
      const { Text } = $.ui.resolve(e)
      return <Text color="#FF8A7A">{`banners-of-lore: ${String(err).slice(0, 200)}`}</Text>
    }
  })
}
