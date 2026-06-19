module.exports = {
  transform: {
    '^.+\\.(ts|tsx|js)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-async-storage|@react-native-community)/',
  ],
  testEnvironment: 'node',
  testPathIgnorePatterns: ['/node_modules/', '/src/__tests__/setup\\.ts$'],
  haste: {
    defaultPlatform: 'ios',
    platforms: ['ios', 'android', 'native'],
  },
  setupFiles: [
    '<rootDir>/node_modules/react-native/jest/setup.js',
    '<rootDir>/src/__tests__/setup.ts',
  ],
}
