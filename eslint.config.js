const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

const FEEDBACK_BUS_HINT =
  'Use the feedback bus (reportOutcome, reportError, FeedbackInline) instead.';

module.exports = defineConfig([
  expoConfig,
  {
    ignores: [
      'node_modules/**',
      '.expo/**',
      'dist/**',
      'coverage/**',
      'android/**',
      'ios/**',
      '__tests__/**',
    ],
  },
  {
    files: ['**/*.{ts,tsx,js,jsx}'],
    ignores: ['lib/feedback/present-outcome.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'burnt',
              message: `Import burnt only in lib/feedback/present-outcome.ts. ${FEEDBACK_BUS_HINT}`,
            },
          ],
        },
      ],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'hooks/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: 'burnt',
              message: `Import burnt only in lib/feedback/present-outcome.ts. ${FEEDBACK_BUS_HINT}`,
            },
            {
              name: 'react-native',
              importNames: ['Alert'],
              message: 'Use ConfirmDialog and the feedback bus instead of Alert.alert.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}'],
    ignores: ['components/feedback/**', 'components/ui/**'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector:
            'JSXAttribute[name.name="style"] MemberExpression[object.name="colors"][property.name="danger"]',
          message: `Use FeedbackInline, OperationFeedbackCard, or FeedbackFieldError. ${FEEDBACK_BUS_HINT}`,
        },
      ],
    },
  },
  {
    rules: {
      'react-hooks/refs': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
]);
