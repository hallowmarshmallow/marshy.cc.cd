import js from '@eslint/js'
import tseslint from 'typescript-eslint'
import reactHooks from 'eslint-plugin-react-hooks'

export default tseslint.config(
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      'react-hooks/rules-of-hooks': 'error',
      'react-hooks/exhaustive-deps': 'warn',
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@supabase/*', '@firebase/*', 'firebase'],
              message:
                'Provider SDKs are only allowed inside src/services (BackendAdapter boundary, §3.1).',
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['dist/', 'node_modules/', 'coverage/'],
  },
)
