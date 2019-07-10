import uglify from 'rollup-plugin-uglify'
import resolve from 'rollup-plugin-node-resolve'
import commonjs from 'rollup-plugin-commonjs'
import babel from 'rollup-plugin-babel'
import babelrc from 'babelrc-rollup'

const babelConfig = {
  'presets': ['env']
}

export default [
  {
    input: "index-mapviewer",
    output: {
      file: "dist/mapviewer.js", format: "umd", name: "g1", extend: true, sourcemap: true, globals: {
        leaflet: 'L',
        d3: 'd3'
      }
    },
    plugins: [
      resolve(),
      commonjs(),
      babel(babelrc({ config: babelConfig, exclude: 'node_modules/**' }))
    ],
    // indicate which modules should be treated as external
    external: ['leaflet', 'd3']
  },
  {
    input: "index-mapviewer",
    output: {
      file: "dist/mapviewer.min.js", format: "umd", name: "g1", extend: true, sourcemap: true, globals: {
        leaflet: 'L',
        d3: 'd3'
      }
    },
    plugins: [
      resolve(),
      commonjs(),
      babel(babelrc({ config: babelConfig, exclude: 'node_modules/**' })),
      process.env.npm_lifecycle_event == 'dev' ? '' : uglify({ sourceMap: true })
    ],
    // indicate which modules should be treated as external
    external: ['leaflet', 'd3']
  }
]
