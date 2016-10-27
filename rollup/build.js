'use strict';

const rollup = require('rollup');

const replace = require('rollup-plugin-replace');

const angular = require('rollup-plugin-angular');
const postcss = require('postcss');
const atImport = require('postcss-import');
const typescript = require('rollup-plugin-typescript');

const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

const conditional = require('rollup-plugin-conditional');

const uglify = require('rollup-plugin-uglify');

const serve = require('rollup-plugin-serve');
const livereload = require('rollup-plugin-livereload');


// settings
const src = './src';
const dest = './dist-rollup';
const uglifyCode = true;
const serveCode = true;
const liveReloadCode = false;


const uglifyPlugin = conditional({
  condition: uglifyCode,
  plugin: uglify(),
});


let cache;


rollup.rollup({

  // rollup main
  entry: `${src}/main.ts`,
  cache: cache,
  context: 'this',

  plugins: [
    replace({
      __ENVIRONMENT__: JSON.stringify(process.env.NODE_ENV || 'development'),
    }),
    angular({
      exclude: './node_modules/**',
      preprocessors: {
        style: (css, path) => {
          return postcss()
          .use(atImport())
          .process(css, { from: path })
          .css;
        },
      },
    }),
    typescript(),
    commonjs(),
    nodeResolve({ jsnext: true, main: true, browser: true }),
    uglifyPlugin,
  ],

  external: [
    '@angular/core',
    '@angular/compiler',
    '@angular/common',
    '@angular/platform-browser-dynamic',
    '@angular/platform-browser',
    '@angular/forms',
    '@angular/http',
    '@angular/router',
    'zone-js',
    'core-js',
    'reflect-metadata',
    'rxjs',
    'immutable',
  ],
}).then(main => {
  // cache main for vendor
  cache = main;

  main.write({
    format: 'iife',
    dest: `${dest}/main.js`,
    sourceMap: uglifyCode,
    globals: {
      '@angular/core': 'vendor._angular_core',
      '@angular/compiler': 'vendor._angular_compiler',
      '@angular/common': 'vendor._angular_common',
      '@angular/platform-browser': 'vendor._angular_platformBrowser',
      '@angular/platform-browser-dynamic':
        'vendor._angular_platformBrowserDynamic',
      '@angular/router': 'vendor._angular_router',
      '@angular/http': 'vendor._angular_http',
      '@angular/forms': 'vendor._angular_forms',
    },
  });

  // rollup vendor
  return rollup.rollup({
    entry: `${src}/vendor.ts`,
    cache: cache,
    context: 'this',

    plugins: [
      angular({ exclude: './node_modules/**' }),
      typescript(),
      commonjs(),
      nodeResolve({ jsnext: true, main: true, browser: true }),
      uglifyPlugin,
      conditional({
        condition: serveCode,
        plugin: serve({
          contentBase: dest,
          historyApiFallback: true,
          port: 4200,
        }),
      }),
      conditional({
        condition: liveReloadCode,
        plugin: livereload({
          watch: dest,
          consoleLogMsg: false,
        }),
      }),
    ],
  }).then(vendor => {
    vendor.write({
      moduleName: 'vendor',
      format: 'iife',
      dest: `${dest}/vendor.js`,
      sourceMap: uglifyCode,
    });
  });
});
