import babel from '@rollup/plugin-babel'
import terser from '@rollup/plugin-terser'

function configurePlugins({ module }) {
  return [
    babel({
      babelHelpers: 'bundled',
      presets: [
        [
          '@babel/preset-env',
          {
            targets: {
              browsers: ['ie 11'],
            },
          },
        ],
      ],
    }),
    terser({
      module,
      mangle: true,
      compress: true,
    }),
  ]
}

const configs = [
  {
    input: 'dist/modules/index.js',
    output: {
      format: 'esm',
      file: './dist/index.js',
    },
    plugins: configurePlugins({ module: true }),
  },
  {
    input: 'dist/modules/index.js',
    output: {
      format: 'cjs',
      file: './dist/index.cjs',
    },
    plugins: configurePlugins({ module: false }),
  },
]

export default configs
