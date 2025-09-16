/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ["**/tests/**/*.test.ts"],
  
  // This tells ts-jest to use Babel for transpilation.
  // It handles the TypeScript-specific syntax correctly.
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json',
      babel: true,
    }
  }
};