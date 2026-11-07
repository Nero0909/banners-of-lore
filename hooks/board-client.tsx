// The live words in the row over the field, bare Text: no picture under them, so
// nothing blinks, and what Claude did fades out in steps of its colour. A click posts,
// and the hooks put the words out.
import type { ClientModule } from 'claude-code'

import type { BoardProps } from '../types'

const STEP_MS = 250

// The beat the words came on, and the beats counted since the board was drawn.
type Now = { key: string; since: number; beats: number; props: BoardProps }

const wired = new WeakMap<object, Now>()

const alphaOf = (now: Now) => {
  const { fade } = now.props
  if (!fade) {
    return 1
  }
  const past = (now.beats - now.since) * STEP_MS - fade.holdMs

  return past <= 0 ? 1 : Math.max(0, 1 - past / fade.fadeMs)
}

const BoardWords: ClientModule<BoardProps, number> = (props, surface) => {
  let now = wired.get(surface)
  if (!now) {
    const born: Now = { key: '', since: 0, beats: 0, props }
    now = born
    wired.set(surface, born)
    surface.onPointer(e => {
      if (e.type === 'up' && (e.button ?? 'left') === 'left') {
        surface.post({})
      }
    })
    surface.every(STEP_MS, () => {
      const was = alphaOf(born)
      born.beats += 1
      if (alphaOf(born) !== was) {
        surface.setState(born.beats)
      }
    })
  }
  now.props = props
  const key = `${props.stamp}|${props.text}`
  if (key !== now.key) {
    now.key = key
    now.since = now.beats
  }
  const alpha = alphaOf(now)
  const { Box, Text } = surface.elements

  return (
    <Box flexDirection="row" width="100%" height={1}>
      {props.text && alpha > 0 ? (
        <Text size="caption" bold wrap="truncate-end" color={`${props.color}${Math.round(alpha * 255).toString(16).padStart(2, '0').toUpperCase()}`}>
          {props.text}
        </Text>
      ) : null}
    </Box>
  )
}

export default BoardWords
