const withPreact = require('next-plugin-preact');
const withPWA = require('next-pwa');
const runtimeCaching = require('next-pwa/cache');

module.exports = withPWA({
  pwa: {
    dest: 'public',
    disable: process.env.NODE_ENV === 'development',
    runtimeCaching
  },
  ...withPreact({
    /* regular next.js config options here */
  })
});
