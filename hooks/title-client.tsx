// A clear layer over the title's picture: the picture takes no press on
// this build, so this hears the click and posts it to the hooks, which
// start a match. It draws nothing.
import type { ClientModule } from 'claude-code'

import type { TitleProps } from '../types'

const wired = new WeakSet<object>()

const TitleClick: ClientModule<TitleProps> = (props, surface) => {
  if (!wired.has(surface)) {
    wired.add(surface)
    surface.onPointer(e => {
      if (e.type === 'up' && (e.button ?? 'left') === 'left') {
        surface.post({ play: true })
      }
    })
  }
  const { Box } = surface.elements

  return <Box width={Math.max(1, props.columns)} height={Math.max(1, props.rows)} />
}

export default TitleClick
