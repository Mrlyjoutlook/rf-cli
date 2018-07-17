const config = require('../utils/getConfig');

module.exports = {
  env: process.env.NODE_ENV || 'development',
  globals: Object.assign(
    {
      'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
      NODE_ENV: process.env.NODE_ENV,
      __URL__: process.env.URL_DEV,
      __DEV__: process.env.NODE_ENV === 'development',
      __PROD__: process.env.NODE_ENV === 'production',
    },
    peak.globals
  ),
  html: Object.assign({}, peak.html),
  port: process.env.PORT || peak.port,
  mock_port: process.env.PORT + 1 || peak.mock_port || peak.port + 1,
};