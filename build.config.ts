import { defineBuildConfig } from 'unbuild'

export default defineBuildConfig([
  {
    // If entries is not provided, will be automatically inferred from package.json
    entries: [
      './src/index',
      // mkdist builder transpiles file-to-file keeping original sources structure
      {
        builder: 'mkdist',
        input: './src/',
        outDir: './dist/',
      },
    ],

    /**
     * `compatible` means "src/index.ts" will generate "dist/index.d.mts", "dist/index.d.cts" and "dist/index.d.ts".
     * `node16` means "src/index.ts" will generate "dist/index.d.mts" and "dist/index.d.cts".
     * `true` is equivalent to `compatible`.
     * `false` will disable declaration generation.
     * `undefined` will auto detect based on "package.json". If "package.json" has "types" field, it will be `"compatible"`, otherwise `false`.
     */
    declaration: 'compatible',
    failOnWarn: false,
  },
  {
    name: 'minified',
    entries: ['./src/index'],
    outDir: './dist/min',
    rollup: {
      esbuild: {
        minify: true,
      },
      emitCJS: false,
    },
    failOnWarn: false,
  },
])
