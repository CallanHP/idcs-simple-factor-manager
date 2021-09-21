var webpack = require('webpack');
var nodeExternals = require('webpack-node-externals');
const CopyWebpackPlugin = require('copy-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

var isProduction = process.env.NODE_ENV === 'production';

//var isProduction = false;

var productionPluginDefine = isProduction ? [
  new webpack.DefinePlugin({ 'process.env': { 'NODE_ENV': JSON.stringify('production') } })
] : [];
var clientLoaders = isProduction ? productionPluginDefine.concat([
  new webpack.optimize.DedupePlugin(),
  new webpack.optimize.OccurrenceOrderPlugin(),
  new webpack.optimize.UglifyJsPlugin({ compress: { warnings: false }, sourceMap: false })
]) : [];

var commonLoaders = [
  {
    test: /\.css$/i,
    use: [MiniCssExtractPlugin.loader, "css-loader"],
  }
];

module.exports = [
  {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? '' : 'inline-source-map',
    entry: './src/server.js',
    output: {
      path: __dirname + '/dist',
      filename: 'server.js',
      libraryTarget: 'commonjs2',
      publicPath: '/'
    },
    plugins: clientLoaders.concat([
      new CopyWebpackPlugin([
        {
          from: 'sslcert',
          to: 'sslcert'
        }
      ]),
      new MiniCssExtractPlugin({
        filename: 'assets/css/bundle.css'
      })
    ]),
    target: 'node',
    node: false,
    externals: nodeExternals(),
    module: {
      rules: [
        {
          test: /\.js$/,
          use: 'babel-loader'
        }
      ].concat(commonLoaders)
    }
  },
  {
    mode: isProduction ? 'production' : 'development',
    devtool: isProduction ? '' : 'inline-source-map',
    entry: './src/app/client.js',
    output: {
      path: __dirname + '/dist/assets',
      publicPath: '/',
      filename: 'bundle.js'
    },
    plugins: clientLoaders.concat([
      new CopyWebpackPlugin([/*{
        from: 'src/css',
        to: 'css',
      },*/
        {
          from: 'res',
          to: 'res'
        }]),
      new webpack.ProvidePlugin({
        'fetch': 'exports-loader?self.fetch!whatwg-fetch/dist/fetch.umd'
      }),
      new MiniCssExtractPlugin({
        filename: 'css/bundle.css'
      })
    ]),
    module: {
      rules: commonLoaders.concat([
        {
          test: /\.js$/,
          exclude: /node_modules/,
          use: 'babel-loader'
        }
      ])
    }/*,
    resolve: {
      extensions: ['.js', '.jsx', '.css']
    }*/
  }
];
