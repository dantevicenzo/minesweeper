module.exports = {
  transform: {
    '^.+\\.(ts|tsx|js)$': 'babel-jest',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(jest-)?react-native|@react-native|@react-native-async-storage|@react-native-community)/',
  ],
  testEnvironment: 'node',
}
