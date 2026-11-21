import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  coverageProvider: "v8",
  testEnvironment: "jsdom",
  watchman: false,
  setupFilesAfterEnv: ["<rootDir>/jest.setup.ts"],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
  testMatch: [
    "<rootDir>/**/tests/**/*.[jt]s?(x)",
    "<rootDir>/**/*.spec.[jt]s?(x)",
    "<rootDir>/**/*.test.[jt]s?(x)",
  ],
};

export default createJestConfig(config);
