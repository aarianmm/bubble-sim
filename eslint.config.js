import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

/**
 * §25.1 hard rule: `Math.random()` does not appear anywhere in the codebase.
 * Every "random" thing a player sees is authored in /script or derived from the
 * current month. Do not disable this rule.
 */
const noRandomness = {
  'no-restricted-properties': [
    'error',
    {
      object: 'Math',
      property: 'random',
      message:
        'Math.random() is banned (§25.1). Derive it from the current month or author it in /script.',
    },
  ],
  'no-restricted-globals': [
    'error',
    { name: 'crypto', message: 'No runtime randomness (§25.1).' },
  ],
  'no-restricted-syntax': [
    'error',
    {
      selector: "MemberExpression[object.name='Math'][property.name='random']",
      message: 'Math.random() is banned (§25.1).',
    },
    {
      selector: "NewExpression[callee.name='Date'][arguments.length=0]",
      message:
        'new Date() is banned inside the simulation (§25.1) — the clock is the script, not the wall.',
    },
  ],
};

export default tseslint.config(
  { ignores: ['dist', 'node_modules', '.worktrees', 'coverage'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      globals: { ...globals.browser, ...globals.node },
    },
    rules: {
      ...noRandomness,
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // The presenter tools and the dev harness may read wall-clock time for UI
    // pacing; they still may not introduce randomness.
    files: ['src/dev/**/*.{ts,tsx}', 'src/chrome/**/*.{ts,tsx}', 'src/ui/**/*.{ts,tsx}', 'src/pages/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-syntax': [
        'error',
        {
          selector: "MemberExpression[object.name='Math'][property.name='random']",
          message: 'Math.random() is banned (§25.1).',
        },
      ],
    },
  },
);
