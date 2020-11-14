module.exports = {
  target: "webworker",
  entry: ["./index.js", "./site.js"],
  mode: "production",
  optimization: {
    usedExports: true
  },
  resolve: {
    symlinks: false
  }
}
