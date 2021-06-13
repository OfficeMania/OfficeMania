import * as path from 'path';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import {Configuration} from 'webpack';
import {IS_DEV, SERVER_PORT, WEBPACK_PORT} from './src/server/config';

const webpack = require('webpack');

const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const targets = IS_DEV ? {chrome: '79', firefox: '72'} : '> 0.25%, not dead';

const config: Configuration = {
    mode: IS_DEV ? 'development' : 'production',
    devtool: IS_DEV ? 'inline-source-map' : false,
    entry: ['./src/client/main'],
    plugins: [
        new webpack.ProgressPlugin(),
        new CleanWebpackPlugin(),
    ],
    output: {
        path: path.join(__dirname, 'js', 'client'),
        filename: `[name]-bundle.js`, // `[name]-[fullhash:8]-bundle.js`,
        chunkFilename: `[name]-bundle.js`, // '[name]-[fullhash:8]-bundle.js',
        publicPath: '/client/',
    },
    resolve: {
        extensions: ['.js', '.ts'],
    },
    optimization: {
        minimize: !IS_DEV,
        splitChunks: {
            cacheGroups: {
                vendors: {
                    test: /[\\/]node_modules[\\/]/,
                    name: 'vendors',
                    chunks: 'all',
                    priority: 10,
                },
            },
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                exclude: [/node_modules/, nodeModulesPath],
                use: {
                    loader: 'babel-loader',
                    options: {
                        presets: [['@babel/env', {modules: false, targets}], '@babel/typescript'],
                        plugins: [
                            '@babel/proposal-numeric-separator',
                            '@babel/plugin-transform-runtime',
                            ['@babel/plugin-proposal-decorators', {legacy: true}],
                            ['@babel/plugin-proposal-class-properties', {loose: true}],
                            '@babel/plugin-proposal-object-rest-spread',
                        ],
                    },
                },
            },
        ],
    },
    devServer: {
        port: WEBPACK_PORT,
        overlay: IS_DEV,
        open: IS_DEV,
        openPage: `http://localhost:${SERVER_PORT}`,
    }
};

export default config;
