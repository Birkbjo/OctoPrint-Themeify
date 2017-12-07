const path = require("path");
const webpack = require("webpack");
const ExtractTextPlugin = require("extract-text-webpack-plugin");

const jsPath = path.resolve(__dirname, "octoprint_themeify/static/js");

module.exports = {
    entry: "./octoprint_themeify/static/js/themeify.js",
    output: {
        filename: "themeify.min.js",
        path: jsPath
    },
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"]
                    }
                }
            },
            {
                test: /\.less$/,
                use: ExtractTextPlugin.extract({
                    fallback: "style-loader",
                    use: [
                        {
                            loader: "css-loader",
                            options: {url: false, minimize: true}
                        },
                        {
                            loader: "less-loader"
                        }
                    ],
                    fallback: "style-loader"
                })
            }
        ]
    },
    plugins: [
        new webpack.optimize.UglifyJsPlugin({ minimize: true, comments: false }),
        new ExtractTextPlugin({
            filename: "../css/themeify.css",
            disable: false,
            allChunks: true
        })
    ]
};
