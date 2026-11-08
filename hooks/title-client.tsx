// A margin counts whole rows of the band, so a light half a row down takes 0.5 (it
// took 1 at first, and the light fell a row under its plate, 2026-11-08).
//
// A clear layer over the title's picture, and the settings': the picture takes no press,
// so this hears the click and posts which plate it fell on. The core says where each
// plate stands, in whole percents across and whole rows down. As the corner's plates,
// one lights under the pointer, darkens held and flashes gold when clicked. A picture
// that names no plates takes a click anywhere, as the old title did.
import type { ClientModule } from 'claude-code'

import type { TitleProps, Zone } from '../types'

const LIGHT = { over: '#FFF0CE26', held: '#0A0812A0', flash: '#F4BD60A0' }
const FLASH_MS = 220

type Lit = { over: string; held: string; flash: string }

const wired = new WeakMap<object, TitleProps>()

// The plate under a cell of the layer, or '' between them.
export function zoneAt(zones: readonly Zone[], columns: number, x: number, y: number): string {
  const across = ((x + 0.5) / Math.max(1, columns)) * 100
  const hit = zones.find(z => across >= z.left && across < z.right && y >= z.top && y < z.bottom)

  return hit?.key ?? ''
}

const TitleClick: ClientModule<TitleProps, Lit> = (props, surface) => {
  const lit: Lit = surface.state ?? { over: '', held: '', flash: '' }
  const known = wired.get(surface)
  if (known) {
    Object.assign(known, props)
  } else {
    const now = { ...props }
    wired.set(surface, now)
    const set = (change: Partial<Lit>) => {
      const was = surface.state ?? lit
      const next = { ...was, ...change }
      if (next.over !== was.over || next.held !== was.held || next.flash !== was.flash) {
        surface.setState(next)
      }
    }
    const at = (x: number, y: number) => zoneAt(now.zones ?? [], surface.columns || now.columns, x, y)
    surface.onPointer(e => {
      const zones = now.zones ?? []
      if (e.type === 'leave') {
        set({ over: '', held: '' })
      } else if (e.type === 'move') {
        set({ over: at(e.x, e.y) })
      } else if (e.type === 'down') {
        set({ held: at(e.x, e.y) })
      } else if (e.type === 'up' && (e.button ?? 'left') === 'left') {
        if (zones.length === 0) {
          surface.post({ play: true })
          return
        }
        const key = at(e.x, e.y)
        if (key) {
          surface.post({ key })
        }
        set({ held: '', flash: key })
      }
    })
    surface.every(FLASH_MS, () => {
      if (surface.state?.flash) {
        set({ flash: '' })
      }
    })
  }
  const { Box } = surface.elements
  const lightOf = (key: string) => (lit.flash === key ? LIGHT.flash : lit.held === key ? LIGHT.held : lit.over === key ? LIGHT.over : undefined)

  return (
    <Box position="relative" flexDirection="column" width={Math.max(1, props.columns)} height={Math.max(1, props.rows)}>
      {(props.zones ?? []).map(z => {
        const light = lightOf(z.key)
        return light ? (
          <Box key={z.key} position="absolute" top={z.top} left={0} marginTop={(z.drop ?? 0) / 2} flexDirection="row" width="100%" height={z.tall ?? z.bottom - z.top}>
            <Box width={`${z.left}%`} height="100%" flexShrink={0} />
            <Box width={`${z.right - z.left}%`} height="100%" flexShrink={0} backgroundColor={light} />
          </Box>
        ) : null
      })}
    </Box>
  )
}

export default TitleClick
