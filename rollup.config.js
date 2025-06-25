import typescript from '@rollup/plugin-typescript';
import { terser } from 'rollup-plugin-terser';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/webflow-tracker.js',
      format: 'iife',
      name: 'webflowTracker'
    },
    {
      file: 'dist/webflow-tracker.min.js',
      format: 'iife',
      name: 'webflowTracker',
      plugins: [terser()]
    }
  ],
  plugins: [
    typescript()
  ]
};