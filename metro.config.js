const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// For web, also try the react-native export condition so packages like zustand
// resolve to their CJS build (./index.js) instead of the ESM build (./esm/index.mjs)
// which uses import.meta — syntax not valid outside ES modules.
config.resolver.unstable_conditionsByPlatform = {
  ...config.resolver.unstable_conditionsByPlatform,
  web: ['browser', 'react-native'],
};

// Prefer CJS builds over ESM builds — react-i18next's ESM build uses .js
// extension imports that Metro cannot resolve without special handling.
config.resolver.resolverMainFields = ['react-native', 'browser', 'main'];

module.exports = config;
