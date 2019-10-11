const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const CopyPlugin = require('copy-webpack-plugin');

module.exports =
{
  context: path.resolve(__dirname),
  entry: {
    "ui": "./src/js/ui/main.js",
    "back": "./src/js/back.js",
    "common": "./src/js/common.js"
  },
  output: {
    path: path.resolve('dist'),
    filename: "js/[name].js"
  },
  optimization: {
    minimize: false
  },
  plugins: [
    new CopyPlugin([
      { from: './src/_locales', to: "_locales" },
      { from: './src/css', to: "css" },
      { flatten: true, from: './src/*'},
      {from: "node_modules/webextension-polyfill/dist/browser-polyfill.min.js",
       to: "js"}
    ])
  ]
};

if (argv.watch)
{
  module.exports.watch = true;
}
