/* eslint-env node, es6 */
let querystring  = require('querystring'),
	https        = require('https'),
	fs           = require('fs'),

	aws          = require('aws-sdk'),
	ses          = new aws.SES(),

	form         = require('./form.json'),
	map          = require('./map.json'),

	corsDomain	 = process.env.CORS_DOMAIN,
	emailFrom    = process.env.EMAIL_FROM,
	emailReplyTo = process.env.EMAIL_REPLY_TO,
	formID       = process.env.FORM_ID;

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

function sendEmail(data) {
	let textFile = 'email.txt';

	let emailParams = {
		Source: emailFrom,
		Destination: {
			ToAddresses: [
				data.email
			]
		},
		ReplyToAddresses: [
			emailReplyTo
		],
		Message: {
			Body: {
				Text: {
					Charset: 'UTF-8',
					Data: fs.readFileSync(textFile, 'utf8'),
				},
			},
			Subject: {
				Charset: 'UTF-8',
				Data: `Welcome to HackDay #${data.edition}`,
			}
		}
	};

	return ses.sendEmail(emailParams).promise();
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

	let gform = [];

	for (var key in data) {
		if (!(key in map))
			continue;

		gform[ map[key] ] = data[key];
	}

	let postData = querystring.stringify(gform);

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
	}).then(() => {
		return sendEmail(data);
	});
}

exports.handler = async (event) => {
	try {
		let body = querystring.parse(event.body);

		return response(200, await submitForm(body), !!body['_redirect']);
	} catch (err) {
		return response(500, err.message, !!body['_redirect']);
	}
};
