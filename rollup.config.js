// rollup.config.js
import resolve from '@rollup/plugin-node-resolve';
import { liveServer } from 'rollup-plugin-live-server';

export default {
  input: 'src/index.js',
  output: {
    file: 'public/app.js',
    format: 'es'
  },
  inlineDynamicImports: false,
  plugins: [
    resolve(),

    liveServer({
      port: 8001,
      host: "0.0.0.0",
      root: "public",
      file: "index.html",
      mount: [['/dist', './dist'], ['/src', './src'], ['/node_modules', './node_modules']],
      open: false,
      wait: 500
    })
  ]
};