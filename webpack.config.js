/*
 * This file is part of Privacy Manager.
 * Copyright (C) 2017-present Manvel Saroyan
 * 
 * Privacy Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Privacy Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Privacy Manager. If not, see <http://www.gnu.org/licenses/>.
 */

const path = require("path");
const argv = require("minimist")(process.argv.slice(2));
const CopyPlugin = require('copy-webpack-plugin');
const csso = require("csso");
const manifest = require("./manifest");

module.exports =
{
  context: path.resolve(__dirname),
  entry: {
    "ui": "./src/js/ui/index.js",
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
    new CopyPlugin({patterns : [
      { from: './src/_locales', to: "_locales" },
      { from: './src/css', to: "css" ,
        transform: (content) => argv.prod ? csso.minify(content).css : content},
      { from: './src/img', to: "img" },
      { from: "./src/popup.html", to: "popup.html" },
      { from: "./src/agent-block.json", to: "agent-block.json" },
      { from: "./src/manifest.json", to: "manifest.json",
        transform: manifest.transform }
    ]})
  ]
};

if (process.env.WATCH)
{
  module.exports.watch = true;
}

if (argv.PROD)
{
  module.exports.mode = "production";
  module.exports.optimization.minimize = true;
}
