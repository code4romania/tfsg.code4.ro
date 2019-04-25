function tick(dateEnd, target) {
	let dateStart = new Date(),
		timeRemaining = parseInt((dateEnd - dateStart.getTime()) / 1000),
		days, hours, minutes, seconds;

	if (timeRemaining < 0)
		return;

	days    = parseInt(timeRemaining / 86400);
	timeRemaining   = (timeRemaining % 86400);
	hours   = parseInt(timeRemaining / 3600);
	timeRemaining   = (timeRemaining % 3600);
	minutes = parseInt(timeRemaining / 60);
	timeRemaining   = (timeRemaining % 60);
	seconds = parseInt(timeRemaining);

	target.querySelector('.days').innerText    = parseInt(days, 10);
	target.querySelector('.hours').innerText   = ('0' + hours).slice(-2);
	target.querySelector('.minutes').innerText = ('0' + minutes).slice(-2);
	target.querySelector('.seconds').innerText = ('0' + seconds).slice(-2);
}

function countdown(target) {
	if (!target)
		return;

	let dateEnd = (new Date(target.dataset.dateend)).getTime() || '';

	if (isNaN(dateEnd))
		return;

	tick(dateEnd, target);

	setInterval(() => {
		tick(dateEnd, target);
	}, 1000);
}

module.exports = () => {
	countdown(document.getElementById('countdown'));
}
