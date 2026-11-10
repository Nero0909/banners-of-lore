// A clear layer over the battle: it says where along the field a click landed, for
// the card of what stands there. It draws nothing.
import type { ClientModule } from 'claude-code'

import type { TitleProps } from '../types'

const wired = new WeakMap<object, TitleProps>()

const PointClick: ClientModule<TitleProps> = (props, surface) => {
  const known = wired.get(surface)
  if (known) {
    known.columns = props.columns
    known.rows = props.rows
  } else {
    const now = { ...props }
    wired.set(surface, now)
    surface.onPointer(e => {
      if (e.type === 'up' && (e.button ?? 'left') === 'left') {
        const x = (e.fine?.x ?? e.x + 0.5) / Math.max(1, surface.columns || now.columns)
        const y = (e.fine?.y ?? e.y + 0.5) / Math.max(1, now.rows)
        surface.post({ x, y })
      }
    })
  }
  const { Box } = surface.elements

  return <Box width="100%" height={Math.max(1, props.rows)} />
}

export default PointClick
