module.exports = {
	plugins: [
		require('postcss-import'),
		require('autoprefixer'),
		require('@fullhuman/postcss-purgecss')({
			content: [
				'./assets/js/**/*.js',
				'./hugo_stats.json'
			],
			extractors: [
				{
					extensions: ['json'],
					extractor: (content) => {
						const elements = JSON.parse(content).htmlElements;

						return elements.tags.concat(elements.classes, elements.ids);
					}
				}
			]
		})
	],

};
