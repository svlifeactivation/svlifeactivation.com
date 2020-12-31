module.exports = {
  context: __dirname,
  target: "webworker",
  entry: "./index.js",
  mode: "production",
  optimization: {
    usedExports: true
  }
}
