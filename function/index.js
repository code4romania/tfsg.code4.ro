/* eslint-env node, es6 */
var querystring = require('querystring'),
	https       = require('https'),

	form        = require('./form.json'),
	map         = require('./map.json'),
	formID      = process.env.FORM_ID,
	corsDomain	= process.env.CORS_DOMAIN;

function response(statusCode, payload, redirect = false) {
	let headers = {
		'Access-Control-Allow-Origin': corsDomain,
		'Access-Control-Allow-Headers': 'x-requested-with',
		'Access-Control-Allow-Credentials': true,
	};

	let body = JSON.stringify({
		message: payload,
	});

	if (!!redirect) {
		headers['Location'] = corsDomain;
		headers['Content-Type'] = 'text/html';
		statusCode = 302;
		body = '';
	}

	return {
		statusCode: statusCode,
		headers: headers,
		body: body,
	};
}

function parseForm(body) {
	let data = {};

	form.fields.forEach((field) => {
		if (field.type == 'submit')
			return;

		let fieldName = field.name,
			fieldValue = body[ fieldName ];

		if (field.type == 'checkbox' && field.multiple) {
			fieldValue = body[ fieldName + '[]' ];
		}

		if (typeof fieldValue == 'undefined') {
			if (!field.required)
				return;

			throw new Error(`Field ${fieldName} is required and missing.`);
		}

		let validOptions = field.options;

		if (!!field.other) {
			validOptions.push('other');

			var fieldNameOther = field.name + 'Other';
		}

		if (field.type == 'checkbox') {
			if (!field.multiple)
				return;

			fieldValue = typeof fieldValue == 'string' ? [fieldValue] : fieldValue;
			fieldValue.forEach(function(value) {
				if (!validOptions.includes( value )) {
					throw new Error(`Invalid value for ${field.name}.`);
				}

				if (value == 'other') {
					if (!body[ fieldNameOther ]) {
						throw new Error(`Field ${fieldNameOther} is required and missing.`);
					}

					let index = fieldValue.indexOf('other');
					if (~index) {
						fieldValue[index] = body[ fieldNameOther ];
					}
				}
			});

			fieldValue = fieldValue.join(', ');
		} else if (field.type == 'radio') {
			if (!validOptions.includes( fieldValue )) {
				throw new Error(`Invalid value for ${field.name}.`);
			}

			if (fieldValue == 'other') {
				if (!body[ fieldNameOther ]) {
					throw new Error(`Field ${fieldNameOther} is required and missing.`);
				}

				fieldValue = body[ fieldNameOther ];
			}
		} else if (field.type == 'select') {
			if (!field.options.includes( fieldValue )) {
				throw new Error(`Invalid value for ${field.name}.`);
			}
		}

		data[ fieldName ] = fieldValue;
	});

	return data;
}

function submitForm(data) {
	data = parseForm(data);

	for (var key in data) {
		if (!(key in map))
			continue;

		data[ map[key] ] = data[key];
		delete data[key];
	}

	let postData = querystring.stringify(data);

	const options = {
		host: 'docs.google.com',
		path: '/forms/d/e/' + formID + '/formResponse',
		method: 'POST',
		port: 443,
		headers: {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': postData.length
		}
	}

	return new Promise((resolve, reject) => {
		let req = https.request(options, (res) => {
			console.log('statusCode:', res.statusCode);
		});

		req.write(postData);
		req.end();

		req.on('response', res => {
			resolve('ok');
		});

		req.on('error', (e) => {
			console.error(e);
			reject(e);
		});
	});
}

exports.handler = async (event, context, callback) => {
	try {
		let body = querystring.parse(event.body);

		return response(200, await submitForm(body));
	} catch (err) {
		return response(500, err.message);
	}
};
