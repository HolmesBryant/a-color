import terser from '@rollup/plugin-terser';

export default {
  input: 'src/a-color.js',
  output: [
    // Standard ES Module (unminified)
    {
      file: 'dist/a-color.js',
      format: 'es',
      sourcemap: false,
    },
    // Minified ES Module
    {
      file: 'dist/a-color.min.js',
      format: 'es',
      plugins: [terser({
        output: { comments: false },
        compress: {
          keep_infinity: true,
          reduce_funcs: true,
          join_vars: true
        },
        mangle: { keep_classnames: true }
      })],
      sourcemap: true,
    }
  ]
};
