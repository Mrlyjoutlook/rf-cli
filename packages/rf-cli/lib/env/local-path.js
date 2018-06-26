const os = require("os");
const path = require("path");

const tmp = os.tmpdir();
// const app = (arr = [], p) =>
//   arr.reduce((a, b) => {
//     if (a[b]) {
//       return a;
//     }
//     a[b] = p;
//   }, {});

module.exports = {
  tmpRfTemplate: path.join(tmp, "rf-cli"),
  rfTemp: path.join(tmp, "rf-cli/packages/rf-template"),
  dll: path.resolve(__dirname, "../features/dll")
};
