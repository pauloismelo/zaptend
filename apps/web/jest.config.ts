import type { Config } from 'jest'
import nextJest from 'next/jest.js'

const createJestConfig = nextJest({ dir: './' })

const config: Config = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  coverageThreshold: {
    global: { lines: 70 },
  },
  collectCoverageFrom: [
    'stores/**/*.ts',
    'components/**/*.tsx',
    'lib/**/*.ts',
    '!**/*.spec.{ts,tsx}',
    '!**/*.d.ts',
  ],
}

export default createJestConfig(config)
