let Modernizr = require('modernizr');

function form() {
	this.instance = document.querySelector('form');

	if (this.instance === null)
		return;

	if (Modernizr.formvalidation)
		this.instance.setAttribute('novalidate', '');

	if (typeof URLSearchParams == 'function') {
		var params = new URLSearchParams(location.search);

		if (params.get('where')) {
			for (var i = this.instance.where.options.length - 1; i >= 0; i--) {
				if (params.get('where') != this.instance.where.options[i].value)
					continue;

				this.instance.where.selectedIndex = i;

				window.scrollTo(0, document.querySelector('form').offsetTop || 0);
			}
		}
	}

	this.instance.querySelectorAll('.input.other').forEach(function(input) {
		input.classList.add('is-hidden');
	});

	var _this = this;
	this.instance.querySelectorAll('.is-checkradio').forEach(function(input) {
		input.addEventListener('change', function() {
			var target = this.parentNode.parentNode.parentNode.querySelector('.input.other'),
				isOtherChecked = _this.instance.querySelector('[name="'+ this.name +'"][value="other"].is-checkradio');

			if (isOtherChecked)
				isOtherChecked = isOtherChecked.checked;

			if (!target)
				return;

			target.classList.toggle('is-hidden', !isOtherChecked);
			target.toggleAttribute('required', isOtherChecked);
		});
	});

	this.instance.addEventListener('submit', function(e) {
		var fields = e.target.querySelectorAll('input, select, textarea'),
			valid = true,
			data = [];

		e.preventDefault();

		fields.forEach(function(field) {
			if (field.name == 'submit' || field.name == '_redirect')
				return;

			if (!_this.validate(field))
				valid = false;
		});

		console.log(valid);

		if (!valid)
			return;

		_this.toggleSubmit(true);

		fields.forEach(function(field) {
			if (field.name == 'submit' || field.name == '_redirect')
				return;

			console.log(field);

			if ((field.type == 'checkbox' || field.type == 'radio') && !field.checked)
				return;

			if (field.type == 'text' && field.value == '')
				return;

			data.push({
				'name'  : field.name,
				'value' : field.value,
			});
		});

		_this.send({
			url: _this.instance.action,
			method: _this.instance.method,
		}, data);
	});
}



form.prototype.toggleSubmit = function(disabled) {
	this.instance.submit.disabled = !!disabled;
}


form.prototype.showMessage = function(type) {
	var message = document.createElement('div'),
		target = document.getElementById('messages'),
		ntype;

	if (type == 'success') {
		ntype = 'is-success';
	} else if (type == 'error') {
		ntype = 'is-danger';
	} else {
		return;
	}

	message.classList.add('notification', ntype);
	message.innerText = this.instance.dataset[type];

	target.innerHTML = '';
	target.appendChild(message);
}

form.prototype.findNext = function(node, cls) {
	while (node = node.nextElementSibling) {
		if (node.classList.contains(cls)) {
			return node;
		}
	}

	return null;
}


form.prototype.validate = function(input) {
	var el;

	if (input.type == 'hidden')
		return true;

	switch(input.type) {
		case 'select-one':
			el = input.parentNode;
			break;

		case 'checkbox':
		case 'radio':
			if (input.parentNode.classList.contains('column')) {
				el = input.parentNode.parentNode;
			} else {
				el = input;
			}
			break;

		default:
			el = input;
			break;
	}

	var help = this.findNext(el, 'help');
	if (input.checkValidity()) {
		el.classList.remove('is-danger');

		if (help) {
			help.classList.remove('is-danger');
			help.textContent = '';
		}

		return true;
	} else {
		el.classList.add('is-danger');

		if (help) {
			help.classList.add('is-danger');
			help.textContent = input.validationMessage;
		}

		return false;
	}
}


form.prototype.send = function(opts, data) {
	var request = new XMLHttpRequest(),
		urlEncodedDataPairs = [],
		urlEncodedData = '',
		_this = this;

	// Turn the data object into an array of URL-encoded key/value pairs.
	data.forEach(function(el) {
		console.log(el);
		urlEncodedDataPairs.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value));
	})

	// Combine the pairs into a single string and replace all %-encoded spaces to
	// the '+' character; matches the behaviour of browser form submissions.
	urlEncodedData = urlEncodedDataPairs.join('&').replace(/%20/g, '+');

	// Define what happens on successful data submission
	request.onload = function(event) {
		if (request.readyState === request.DONE) {
			console.log(request);
			if (request.status === 200) {
				_this.showMessage('success');
				console.log('Yeah! Data sent and response loaded.', event);
			} else {
				_this.showMessage('error');
				_this.toggleSubmit(false);
				console.log('Oops! Something goes wrong.', event);
			}
		}
	}

	// Define what happens in case of error
	request.onerror = function(event) {
		_this.showMessage('error');
		_this.toggleSubmit(false);
		console.log('Oops! Something goes wrong.', event);
	}

	// Set up our request
	request.open(opts.method, opts.url);

	// Add the required HTTP header for form data POST requests
	request.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');

	// Finally, send our data.
	request.send(urlEncodedData);
}

module.exports = () => {
	return new form();
}
