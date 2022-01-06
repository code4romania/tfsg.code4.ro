import { join } from 'path';
import { readFileSync } from 'fs';
import AWS from 'aws-sdk';
import https from 'https';
import querystring from 'querystring';

const fields = require('./fields.json');
const map = require('./map.json');

AWS.config.update({
	region: 'eu-west-1',
	credentials: {
		accessKeyId: process.env.SES_ACCESS_KEY_ID,
		secretAccessKey: process.env.SES_SECRET_ACCESS_KEY
	},
});

export default async (req, res) => {
	const redirect = Boolean(req.body?._redirect);

	res.setHeader('Access-Control-Allow-Origin', req.headers.origin);

	try {
		const result = await submitForm(req.body);

		if (redirect) {
			return req.status(302).headers({
				location: req.headers.origin,
			});
		}

		return res.status(200).json({
			message: result
		});
	} catch (error) {
		if (redirect) {
			return req.status(302).headers({
				location: req.headers.origin,
			});
		}

		return res.status(500).json({
			message: error.message
		});
	}
}

const sendEmail = (data) => {
	return new AWS.SES().sendEmail({
		Source: process.env.REGISTER_EMAIL_FROM,
		Destination: {
			ToAddresses: [
				data.email
			]
		},
		ReplyToAddresses: [
			process.env.REGISTER_EMAIL_REPLY_TO
		],
		Message: {
			Body: {
				Text: {
					Charset: 'UTF-8',
					Data: readFileSync(join(__dirname, 'support', 'email.txt'), 'utf8'),
				},
			},
			Subject: {
				Charset: 'UTF-8',
				Data: `Welcome to HackDay #${data.edition}`,
			}
		}
	}).promise();
}

const parseForm = (body) => {
	const data = {};

	fields.forEach(field => {
		if (field.type == 'submit') {
			return;
		}

		let fieldName = field.name,
			fieldValue = body[fieldName];

		if (field.type == 'checkbox' && field.multiple) {
			fieldValue = body[ fieldName + '[]' ];
		}

		if (typeof fieldValue == 'undefined') {
			if (!field.required) {
				return;
			}

			throw new Error(`Field ${fieldName} is required and missing.`);
		}

		const validOptions = field.options;

		if (!!field.other) {
			validOptions.push('other');

			var fieldNameOther = field.name + 'Other';
		}

		if (field.type == 'checkbox') {
			if (!field.multiple) {
				return;
			}

			fieldValue = typeof fieldValue == 'string' ? [fieldValue] : fieldValue;
			fieldValue.forEach(function(value) {
				if (!validOptions.includes( value )) {
					throw new Error(`Invalid value for ${field.name}.`);
				}

				if (value == 'other') {
					if (!body[ fieldNameOther ]) {
						throw new Error(`Field ${fieldNameOther} is required and missing.`);
					}

					const index = fieldValue.indexOf('other');

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

const submitForm = (data) => {
	data = parseForm(data);

	const gform = [];

	for (var key in data) {
		if (!(key in map)) {
			continue;
		}

		gform[ map[key] ] = data[key];
	}

	const postData = querystring.stringify(gform);

	return new Promise((resolve, reject) => {
		const req = https.request({
			host: 'docs.google.com',
			path: `/forms/d/e/${process.env.REGISTER_FORM_ID}/formResponse`,
			method: 'POST',
			port: 443,
			headers: {
				'Content-Type': 'application/x-www-form-urlencoded',
				'Content-Length': postData.length
			}
		}, (res) => {
			console.log('statusCode:', res.statusCode);
		});

		req.write(postData);
		req.end();

		req.on('response', (res) => resolve('ok'));
		req.on('error', (error) => reject(error));
	}).then(() => sendEmail(data));
}
