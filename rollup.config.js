import resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';
import { terser } from 'rollup-plugin-terser';

const production = !process.env.ROLLUP_WATCH;

export default {
  input: 'src/viewer.js',
  output: [
    {
      file: 'dist/nncircuit.js',
      format: 'umd',
      name: 'NNCircuit',
      sourcemap: !production
    },
    {
      file: 'dist/nncircuit.esm.js',
      format: 'es',
      sourcemap: !production
    }
  ],
  plugins: [
    resolve({
      browser: true
    }),
    commonjs(),
    production && terser()
  ],
  watch: {
    clearScreen: false
  }
};