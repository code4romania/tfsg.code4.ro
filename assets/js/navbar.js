document.querySelectorAll('.navbar-burger').forEach(button => {
	button.addEventListener('click', () => {
		let target = document.getElementById( button.dataset.target );

		button.classList.toggle('is-active');
		target.classList.toggle('is-active');
	});
});
