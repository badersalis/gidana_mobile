const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// For web, also try the react-native export condition so packages like zustand
// resolve to their CJS build (./index.js) instead of the ESM build (./esm/index.mjs)
// which uses import.meta — syntax not valid outside ES modules.
config.resolver.unstable_conditionsByPlatform = {
  ...config.resolver.unstable_conditionsByPlatform,
  web: ['browser', 'react-native'],
};

module.exports = config;
