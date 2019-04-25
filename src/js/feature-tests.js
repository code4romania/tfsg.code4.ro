let Modernizr = require('modernizr');

module.exports = () => {

	// Fallback to png if there's no svg browser support
	if (Modernizr.svgasimg)
		return;

	var images = document.querySelectorAll('.svg-fallback');

	if (!images.length)
		return;

	for (var i = images.length - 1; i >= 0; i--) {
		images[i].setAttribute('src', images[i].getAttribute('src').replace('.svg', '.png') );
		images[i].classList.remove('svg-fallback');
	}
}
