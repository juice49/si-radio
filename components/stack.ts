import { styled } from '../stitches.config'

const Stack = styled('div', {
  display: 'flex',
  flexDirection: 'column',
  gap: '$1',
  variants: {
    direction: {
      inline: {
        flexDirection: 'row',
      },
      block: {
        flexDirection: 'column',
      },
    },
  },
  defaultVariants: {
    direction: 'block',
  },
})

export default Stack
