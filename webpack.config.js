const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');
 
module.exports = {
  entry: './src/script.js',
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist'),
    clean: true,
  },
  mode: 'development',
  devServer: {
    static: {
      directory: path.resolve(__dirname, 'dist'),
    },
    compress: true,
    port: 3000,
    proxy: [
        {
          context: ['/askOPENAPI', '/askGROQAPI', '/templates'],
          target: 'http://localhost:5000',
          changeOrigin: true,
        }
      ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
    new CopyPlugin({
      patterns: [
        { from: 'public/templates/TestCases_template01.docx', to: 'TestCases_template01.docx' },
        { from: 'public/style.css', to: 'style.css' },
        { from: 'public/word-style.css', to: 'word-style.css' }
      ],
    }),
  ],
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader'],
      }
    ],
  }
};
