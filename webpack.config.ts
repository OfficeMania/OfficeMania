import * as path from 'path';
import {CleanWebpackPlugin} from 'clean-webpack-plugin';
import {Configuration} from 'webpack';

const IS_DEV = process.env.NODE_ENV !== "production";
const WEBPACK_PORT = 8085;
const SERVER_PORT = Number(process.env.PORT) || 3000;

const webpack = require('webpack');

const nodeModulesPath = path.resolve(__dirname, 'node_modules');
const targets = IS_DEV ? {chrome: '79', firefox: '72'} : '> 0.25%, not dead';

const config: Configuration = {
    mode: IS_DEV ? 'development' : 'production',
    devtool: IS_DEV ? 'inline-source-map' : false,
    entry: {
        main: './src/client/main',
        admin: './src/client/admin',
        "admin-config": './src/client/admin/config',
    },
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
};

export default config;
