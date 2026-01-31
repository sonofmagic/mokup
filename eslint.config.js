import { icebreaker } from '@icebreakers/eslint-config'

export default icebreaker(
  {
    vue: true,
    ignores: ['**/fixtures/**'],
    rules: {
      'dot-notation': 'off',
    },
  },
)
