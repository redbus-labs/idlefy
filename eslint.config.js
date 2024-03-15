import antfu from '@antfu/eslint-config'

export default antfu(
  {
    ignores: [
      'test/',
      'dist/',
    ],
  },
  {
    rules: {
      // overrides
    },
  },
)
