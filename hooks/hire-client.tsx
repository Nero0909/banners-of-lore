// The live layer over the hire bar's picture: each bay's price and upgrade as plates
// to press, how many the line holds, the dark over what cannot be bought. A new picture would blink at each
// price, so all of it is Text and Boxes in whole percents. The names are in the
// picture: at the band's text sizes they do not fit beside the attack.
// A plate lights under the pointer and flashes when clicked: a Button has no press
// of its own, and a Button cannot be coloured. A line with a pack to come counts its
// seconds down on its portrait's top corner, over how many it holds on the bottom one.
// The bar hears the time left once per row and counts on by itself.
import type { ClientModule } from 'claude-code'

import type { Bay, HireProps } from '../types'

const CREAM = '#FFF0CE'
const FADED = '#8A7354'
const VEIL = '#0A0812A0'
const BADGE = '#0A0812D0'
// A plate at rest, under the pointer, held, just clicked, and out of reach.
const PLATE = { rest: '#7A4E1E', over: '#B07A2E', held: '#4A2E12', flash: '#F4BD60', off: '#2A2018' }
const DARK = '#1C1208'
// The clear layer's height, in rows: the bar's 48 pixels at the band's line height.
const ROWS = 2.4
// Where a bay's upgrade plate starts along it, and the row it stands on.
const UP_FROM = 0.55
const UP_ROW = 1
const FLASH_MS = 220
const TICK_MS = 250
// The seconds to a pack's exit: gold, as the time to payday is.
const CLOCK = '#F4BD60'
// The lesson's wanted line blinks its price gold, two ticks on and two off, till bought
// (asked 2026-11-07: "draw where to click").
const BLINK_TICKS = 2

// Each bay's time left as it came, and the beat it came on.
type Now = { columns: number; bays: Bay[]; beats: number; since: { out: number | null; beat: number }[]; shown: string }
// Spots are `<bay>:hire` and `<bay>:up`. The tick draws the seconds anew.
type Lit = { over: string; held: string; flash: string; tick: number }

const wired = new WeakMap<object, Now>()

// A bay's whole seconds to its pack's exit, 0 with none coming. Time left that changes
// came with a new row: the count starts from it on this beat.
function secondsOf(now: Now, b: Bay, i: number): number {
  if (b.out === null) {
    return 0
  }
  if (now.since[i]?.out !== b.out) {
    now.since[i] = { out: b.out, beat: now.beats }
  }
  const left = b.out - (now.beats - (now.since[i]?.beat ?? now.beats)) * TICK_MS

  return left > 0 ? Math.ceil(left / 1000) : 0
}

const HireClick: ClientModule<HireProps, Lit> = (props, surface) => {
  const lit: Lit = surface.state ?? { over: '', held: '', flash: '', tick: 0 }
  const known = wired.get(surface)
  if (known) {
    known.columns = props.columns
    known.bays = props.bays
  } else {
    const now: Now = { columns: props.columns, bays: props.bays, beats: 0, since: [], shown: '' }
    wired.set(surface, now)
    const spotAt = (x: number, y: number) => {
      const along = ((x + 0.5) / Math.max(1, surface.columns || now.columns)) * 5
      const bay = Math.min(4, Math.floor(along))
      const hasUp = Boolean(now.bays[bay]?.up) && along - bay >= UP_FROM && y >= UP_ROW
      return now.bays[bay] ? `${bay}:${hasUp ? 'up' : 'hire'}` : ''
    }
    const set = (change: Partial<Lit>) => {
      const was = surface.state ?? lit
      const next = { ...was, ...change }
      if (next.over !== was.over || next.held !== was.held || next.flash !== was.flash) {
        surface.setState(next)
      }
    }
    surface.onPointer(e => {
      if (e.type === 'leave') {
        set({ over: '', held: '' })
      } else if (e.type === 'move') {
        set({ over: spotAt(e.x, e.y) })
      } else if (e.type === 'down') {
        set({ held: spotAt(e.x, e.y) })
      } else if (e.type === 'up' && (e.button ?? 'left') === 'left') {
        const spot = spotAt(e.x, e.y)
        const [bay = '', kind] = spot.split(':')
        if (spot) {
          surface.post({ bay: Number(bay), isUp: kind === 'up' })
        }
        set({ held: '', flash: spot })
      }
    })
    surface.every(FLASH_MS, () => {
      if (surface.state?.flash) {
        set({ flash: '' })
      }
    })
    surface.every(TICK_MS, () => {
      now.beats += 1
      const blink = now.bays.some(b => b.wanted) ? Math.floor(now.beats / BLINK_TICKS) % 2 : 0
      const shown = `${now.bays.map((b, i) => secondsOf(now, b, i)).join(',')}|${blink}`
      if (shown !== now.shown) {
        now.shown = shown
        surface.setState({ ...(surface.state ?? lit), tick: now.beats })
      }
    })
  }
  const at = wired.get(surface) as Now
  const { Box, Text } = surface.elements
  const isBlinkOn = Math.floor(at.beats / BLINK_TICKS) % 2 === 1
  const plate = (spot: string, label: string, canBuy: boolean, isWanted = false) => {
    const isFlash = lit.flash === spot || (isWanted && isBlinkOn)
    const fill = isFlash ? PLATE.flash : lit.held === spot ? PLATE.held : !canBuy ? PLATE.off : lit.over === spot ? PLATE.over : PLATE.rest
    return (
      <Text size="caption" bold wrap="truncate-end" color={isFlash ? DARK : canBuy ? CREAM : FADED} backgroundColor={fill}>
        {` ${label} `}
      </Text>
    )
  }

  return (
    <Box flexDirection="row" width="100%" height={ROWS}>
      {props.bays.map((b, i) => (
        <Box key={`bay-${i}`} flexDirection="column" width="20%" height="100%" flexShrink={0}>
          <Box height="12%" flexShrink={0} />
          <Box height="76%" flexShrink={0} flexDirection="row">
            <Box width="5%" flexShrink={0} />
            <Box width="92%" flexShrink={0} flexDirection="row" {...(b.lit ? {} : { backgroundColor: VEIL })}>
              <Box width="25%" flexShrink={0} flexDirection="column" justifyContent="space-between" alignItems="flex-start">
                {secondsOf(at, b, i) > 0 ? (
                  <Text size="caption" bold color={DARK} backgroundColor={CLOCK}>
                    {` ${secondsOf(at, b, i)}s `}
                  </Text>
                ) : (
                  <Box height={0} />
                )}
                {b.count > 0 ? (
                  <Text size="caption" bold color={CREAM} backgroundColor={BADGE}>
                    {` ×${b.count} `}
                  </Text>
                ) : (
                  <Box height={0} />
                )}
              </Box>
              <Box width="5%" flexShrink={0} />
              <Box width="68%" flexShrink={0} flexDirection="column" justifyContent="flex-end">
                <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
                  {plate(`${i}:hire`, b.price, b.lit, b.wanted)}
                  {b.up ? plate(`${i}:up`, `▲ ${b.up.price}`, b.up.lit) : null}
                </Box>
                <Box height="8%" flexShrink={0} />
              </Box>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export default HireClick
