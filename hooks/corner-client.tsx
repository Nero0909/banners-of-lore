// The clear layer over the corner's wooden plates, as a Button can be neither coloured
// nor seen pressed: it lights the plate under the pointer, darkens the one held,
// flashes the one clicked and posts which that was. The words are in the picture.
import type { ClientModule } from 'claude-code'

import type { CornerProps } from '../types'

// What lies over a plate under the pointer, held and just clicked.
const LIGHT = { over: '#FFF0CE26', held: '#0A0812A0', flash: '#F4BD60A0' }
const FLASH_MS = 220

// Which plate is lit each way, by its key.
type Lit = { over: string; held: string; flash: string }

const wired = new WeakMap<object, CornerProps>()

const CornerClick: ClientModule<CornerProps, Lit> = (props, surface) => {
  const lit: Lit = surface.state ?? { over: '', held: '', flash: '' }
  const known = wired.get(surface)
  if (known) {
    known.columns = props.columns
    known.plates = props.plates
  } else {
    const now = { ...props }
    wired.set(surface, now)
    const plateAt = (x: number) => now.plates[Math.min(now.plates.length - 1, Math.floor(((x + 0.5) / Math.max(1, surface.columns || now.columns)) * now.plates.length))]?.key ?? ''
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
        set({ over: plateAt(e.x) })
      } else if (e.type === 'down') {
        set({ held: plateAt(e.x) })
      } else if (e.type === 'up' && (e.button ?? 'left') === 'left') {
        const key = plateAt(e.x)
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
    <Box flexDirection="row" justifyContent="space-between" width="100%" height={1}>
      {props.plates.map(p => {
        const light = lightOf(p.key)
        return <Box key={p.key} width={props.plates.length > 1 ? '49%' : '100%'} height="100%" flexShrink={0} {...(light ? { backgroundColor: light } : {})} />
      })}
    </Box>
  )
}

export default CornerClick
