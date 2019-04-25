module.exports = {
	root: true,
	extends: 'eslint:recommended',
	env: {
		browser: true,
		node: true,
		es6: true
	},
	globals: {
		Modernizr: true,
	},
	rules: {
		'no-cond-assign': 'off',
		'no-console': 'off',
	},
}
