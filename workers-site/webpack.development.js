module.exports = {
  target: "webworker",
  devtool: "cheap-module-source-map", // avoid 'eval': Workers environment doesn't allow it
  entry: ["./index.js", "./site.js"],
  mode: "development",
  optimization: {
    usedExports: true
  },
  resolve: {
    symlinks: false
  }
}
