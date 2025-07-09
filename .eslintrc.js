/**
 * ESLint configuration for SurvAI MVP monorepo
 * 
 * Provides consistent linting rules across all packages
 * with TypeScript and React support.
 */

module.exports = {
  root: true,
  
  // Environment settings
  env: {
    browser: true,
    es2022: true,
    node: true,
    jest: true,
  },
  
  // Parser configuration
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    ecmaFeatures: {
      jsx: true,
    },
  },
  
  // Plugins
  plugins: [
    '@typescript-eslint',
    'react',
    'react-hooks',
    'react-refresh',
  ],
  
  // Extended configurations
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  
  // Settings
  settings: {
    react: {
      version: 'detect',
    },
  },
  
  // Global rules
  rules: {
    // TypeScript specific rules
    '@typescript-eslint/no-unused-vars': [
      'warn',
      {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_',
      },
    ],
    '@typescript-eslint/no-explicit-any': 'warn',
    '@typescript-eslint/no-var-requires': 'error',
    
    // General JavaScript rules
    'no-console': 'warn',
    'no-debugger': 'error',
    'no-duplicate-imports': 'error',
    'prefer-const': 'error',
    
    // React specific rules
    'react/prop-types': 'off', // Using TypeScript for type checking
    'react/react-in-jsx-scope': 'off', // React 17+ doesn't require React import
    'react/jsx-uses-react': 'off',
    'react/jsx-uses-vars': 'error',
    'react/no-unescaped-entities': 'error',
    
    // React Hooks rules
    'react-hooks/rules-of-hooks': 'error',
    'react-hooks/exhaustive-deps': 'warn',
    
    // React Refresh rules (for Vite HMR)
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],
  },
  
  // Override rules for specific file patterns
  overrides: [
    // Backend-specific rules
    {
      files: ['backend/**/*.ts'],
      env: {
        node: true,
        browser: false,
      },
      rules: {
        // Allow console in backend
        'no-console': 'off',
        // Backend doesn't use React
        'react/react-in-jsx-scope': 'off',
        'react/jsx-uses-react': 'off',
        'react-hooks/rules-of-hooks': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'react-refresh/only-export-components': 'off',
      },
    },
    
    // Test files
    {
      files: ['**/*.test.{ts,tsx}', '**/*.spec.{ts,tsx}', 'tests/**/*.{ts,tsx}'],
      env: {
        jest: true,
      },
      rules: {
        // Allow any in tests
        '@typescript-eslint/no-explicit-any': 'off',
        // Allow console in tests
        'no-console': 'off',
      },
    },
    
    // Configuration files
    {
      files: [
        '*.config.{js,ts}',
        '*.setup.{js,ts}',
        '.eslintrc.js',
        'jest.config.js',
      ],
      env: {
        node: true,
      },
      rules: {
        // Allow require in config files
        '@typescript-eslint/no-var-requires': 'off',
        // Allow any in config files
        '@typescript-eslint/no-explicit-any': 'off',
        // Allow console in config files
        'no-console': 'off',
      },
    },
  ],
  
  // Ignore patterns
  ignorePatterns: [
    'node_modules/',
    'dist/',
    'build/',
    'coverage/',
    '*.generated.ts',
    '*.d.ts',
    '.next/',
    'public/',
  ],
}