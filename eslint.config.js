import tseslint from 'typescript-eslint';
import eslint from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import globals from 'globals';

export default tseslint.config({
	name: 'Blankstorm',
	extends: [eslint.configs.recommended, ...tseslint.configs.recommendedTypeChecked],
	files: ['src/**/*.ts'],
	languageOptions: {
		globals: { ...globals.browser, ...globals.node },
		ecmaVersion: 'latest',
		sourceType: 'module',
		parserOptions: {
			projectService: true,
			tsconfigRootDir: import.meta.dirname,
		},
	},
	plugins: { stylistic },
	rules: {
		'no-useless-escape': 'warn',
		'@typescript-eslint/no-unused-vars': 'warn',
		'stylistic/no-mixed-spaces-and-tabs': 'warn',
		'no-unreachable': 'warn',
		'stylistic/no-extra-semi': 'warn',
		'no-fallthrough': 'warn',
		'no-empty': 'warn',
		'@typescript-eslint/no-empty-function': 'warn',
		'no-case-declarations': 'warn',
		'prefer-const': 'warn',
		'@typescript-eslint/adjacent-overload-signatures': 'warn',
		'@typescript-eslint/no-inferrable-types': 'off',
		'@typescript-eslint/consistent-type-imports': 'warn',
		'@typescript-eslint/no-explicit-any': 'warn',
		'prefer-rest-params': 'warn',
		'prefer-spread': 'warn',
		'@typescript-eslint/no-unused-vars': 'warn',
		'@typescript-eslint/restrict-template-expressions': 'off',
		'@typescript-eslint/restrict-plus-operands': 'off',
		'@typescript-eslint/only-throw-error': 'off',
		'@typescript-eslint/no-unsafe-function-type': 'warn',
		'@typescript-eslint/no-wrapper-object-types': 'warn',
		'@typescript-eslint/triple-slash-reference': 'warn',
		'@typescript-eslint/no-namespace': 'warn',
		'@typescript-eslint/prefer-as-const': 'warn',
		'@typescript-eslint/no-explicit-any': 'warn',
		'@typescript-eslint/consistent-type-assertions': 'warn',
		'@typescript-eslint/consistent-type-imports': 'warn',
		'@typescript-eslint/no-unnecessary-type-assertion': 'warn',
		'@typescript-eslint/require-await': 'warn',
		'@typescript-eslint/no-unsafe-return': 'warn',
		'@typescript-eslint/no-unsafe-assignment': 'warn',
		'@typescript-eslint/no-unsafe-member-access': 'warn',
		'@typescript-eslint/no-unsafe-argument': 'warn',
		'@typescript-eslint/no-redundant-type-constituents': 'warn',
		'@typescript-eslint/no-unsafe-call': 'warn',
		'@typescript-eslint/no-misused-promises': 'off',
		'@typescript-eslint/no-unused-expressions': 'off',
		'@typescript-eslint/no-base-to-string': 'off',
	},
});