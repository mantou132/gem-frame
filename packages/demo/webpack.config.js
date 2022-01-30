const path = require('path');

const HtmlWebpackPlugin = require('html-webpack-plugin');
const HtmlWebpackInjectStringPlugin = require('html-webpack-inject-string-plugin');
const VueLoaderPlugin = require('vue-loader/lib/plugin');
const express = require('express');

const name = process.env.NAME;

module.exports = (env, argv) => ({
  entry: `./src/${name}/`,
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        loader: 'ts-loader',
        options: {
          allowTsInNodeModules: true,
        },
      },
      {
        test: /\.vue$/,
        loader: 'vue-loader',
      },
      {
        test: /\.css$/,
        use: ['vue-style-loader', 'css-loader'],
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
  },
  optimization: {
    minimize: false,
  },
  output: {
    publicPath: `/${name}/`,
    // filename: 'index.js?v=[contenthash]',
    path: path.resolve(__dirname, `dist/${name}`),
  },
  externals:
    name !== 'host' && argv.mode !== 'production'
      ? []
      : [
          function(context, request, callback) {
            if (/^@mantou\/gem*/.test(request)) {
              return callback(null, 'Gem');
            }
            callback();
          },
          { react: 'React' },
          { 'react-dom': 'ReactDOM' },
          { 'react-router': 'ReactRouter' },
          { vue: 'Vue' },
        ],
  plugins: [
    new HtmlWebpackPlugin(),
    new HtmlWebpackInjectStringPlugin({
      search: '</head>',
      inject:
        name === 'host'
          ? `
      <script src=https://unpkg.com/@mantou/gem@0.4/umd.js></script>
      <script src=https://unpkg.com/react@16.12/umd/react.production.min.js></script>
      <script src=https://unpkg.com/react-dom@16.12/umd/react-dom.production.min.js></script>
      <script src=https://unpkg.com/react-router@5.1/umd/react-router.min.js></script>
      <script src=https://unpkg.com/vue@2.6/dist/vue.min.js></script>
      `
          : '',
    }),
    new VueLoaderPlugin(),
  ],
  devServer: {
    headers: {
      'Access-Control-Allow-Origin': '*',
    },
    contentBase: `./dist/${name}`,
    historyApiFallback: {
      index: `/${name}/`,
    },
    before: function(app) {
      if (name === 'host') {
        app.use('/app/', express.static('./dist/app'));
        app.use('/react/', express.static('./dist/react'));
        app.use('/vue/', express.static('./dist/vue'));
      }
    },
  },
  devtool: 'source-map',
});
