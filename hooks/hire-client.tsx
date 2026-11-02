// The live layer over the hire bar's picture: each bay's price and upgrade as plates
// to press, how many the line holds, the dark over what cannot be bought. A new picture would blink at each
// price, so all of it is Text and Boxes in whole percents. The names are in the
// picture: at the band's text sizes they do not fit beside the attack.
// A plate lights under the pointer and flashes when clicked: a Button has no press
// of its own, and a Button cannot be coloured.
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

type Now = { columns: number; bays: Bay[] }
// Spots are `<bay>:hire` and `<bay>:up`.
type Lit = { over: string; held: string; flash: string }

const wired = new WeakMap<object, Now>()

const HireClick: ClientModule<HireProps, Lit> = (props, surface) => {
  const lit: Lit = surface.state ?? { over: '', held: '', flash: '' }
  const known = wired.get(surface)
  if (known) {
    known.columns = props.columns
    known.bays = props.bays
  } else {
    const now: Now = { columns: props.columns, bays: props.bays }
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
  }
  const { Box, Text } = surface.elements
  const plate = (spot: string, label: string, canBuy: boolean) => {
    const isFlash = lit.flash === spot
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
              <Box width="25%" flexShrink={0} flexDirection="column" justifyContent="flex-end" alignItems="flex-end">
                {b.count > 0 ? (
                  <Text size="caption" bold color={CREAM} backgroundColor={BADGE}>
                    {` ×${b.count} `}
                  </Text>
                ) : null}
              </Box>
              <Box width="5%" flexShrink={0} />
              <Box width="68%" flexShrink={0} flexDirection="column" justifyContent="flex-end">
                <Box flexDirection="row" justifyContent="space-between" alignItems="center" width="100%">
                  {plate(`${i}:hire`, b.price, b.lit)}
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
