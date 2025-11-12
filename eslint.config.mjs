import nextPlugin from 'eslint-config-next'

const eslintConfig = [
  {
    ignores: [
      '.next/**',
      'out/**',
      'build/**',
      'dist/**',
      'next-env.d.ts',
      'node_modules/**',
      '.git/**',
      '*.config.js',
      '*.config.mjs',
    ],
  },
  ...nextPlugin,
]

export default eslintConfig
