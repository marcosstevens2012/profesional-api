module.exports = {
  moduleFileExtensions: ["js", "json", "ts"],
  rootDir: "src",
  testRegex: ".*\\.spec\\.ts$",
  transform: {
    "^.+\\.(t|j)s$": "ts-jest",
  },
  collectCoverageFrom: ["**/*.(t|j)s"],
  coverageDirectory: "../coverage",
  testEnvironment: "node",
  // Add timeout to prevent hanging
  testTimeout: 10000,
  // Don't watch by default
  watchman: false,
  // Exit after tests complete
  forceExit: true,
  // Clear mocks between tests
  clearMocks: true,
};
