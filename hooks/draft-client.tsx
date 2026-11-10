// A clear layer over a picture of cards, as the title's: it tells the hooks which
// was clicked, by where along the field it lands. It draws nothing.
import type { ClientModule } from 'claude-code'

import type { DraftProps } from '../types'

const wired = new WeakMap<object, { columns: number; cards: number }>()

const DraftClick: ClientModule<DraftProps> = (props, surface) => {
  const known = wired.get(surface)
  if (known) {
    known.columns = props.columns
    known.cards = props.cards
  } else {
    const now = { columns: props.columns, cards: props.cards }
    wired.set(surface, now)
    surface.onPointer(e => {
      if (e.type === 'up' && (e.button ?? 'left') === 'left') {
        surface.post({ card: Math.min(now.cards - 1, Math.floor(((e.x + 0.5) / Math.max(1, surface.columns || now.columns)) * now.cards)) })
      }
    })
  }
  const { Box } = surface.elements

  return <Box width="100%" height={Math.max(1, props.rows)} />
}

export default DraftClick
