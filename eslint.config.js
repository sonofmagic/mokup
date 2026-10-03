import { defineEslintConfig } from 'repoctl/tooling'

export default await defineEslintConfig(
  {
    vue: true,
    ignores: ['**/fixtures/**', '**/.wrangler/**'],
    rules: {
      'dot-notation': 'off',
    },
  },
)
