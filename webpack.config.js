const path = require("path");
const webpack = require("webpack");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const isProd = process.argv.indexOf("-p") > -1;
const staticPath = path.resolve(__dirname, "octoprint_themeify/static");
module.exports = {
    entry: [
        path.join(staticPath, "js", "themeify.js"),
        path.join(staticPath, "less", "base.less"),
    ],
    output: {
        filename: "themeify.min.js",
        path: path.join(staticPath, "dist"),
    },
    devtool: isProd ? "false" : "inline-source-map",
    module: {
        rules: [
            {
                test: /\.js$/,
                exclude: /(node_modules|bower_components)/,
                use: {
                    loader: "babel-loader",
                    options: {
                        presets: ["@babel/preset-env"],
                    },
                },
            },
            {
                test: /\.less$/,
                use: [
                    MiniCssExtractPlugin.loader,
                    { loader: "css-loader", options: { url: false } },
                    { loader: "less-loader" },
                ],
            },
        ],
    },
    plugins: [
        new MiniCssExtractPlugin({
            filename: "themeify.min.css",
        }),
    ],
    performance: {
        maxAssetSize: 500000,
        maxEntrypointSize: 500000
      }
};
