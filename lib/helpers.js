// Dependencies
const queryString = require('querystring');
const https = require('https');
const crypto = require('crypto');
const config = require('./config');

// Container for the module
const helpers = {};

// Convert JSON to Object
helpers.parseJsonToObject = data => {
	try {
		const obj = JSON.parse(data);
		return obj;
	} catch (e) {
		return {};
	}
}

// Create SHA256 hash
helpers.hash = str => {
	if (typeof (str) == 'string' && str.length > 0) {
		var hash = crypto.createHmac('sha256', config.hashSecret).update(str).digest('hex');
		return hash;
	} else {
		return false;
	}
};

// Create a string of random alphanumeric characters, of a given length
helpers.createRandomString = strLength => {
	strLength = typeof (strLength) == 'number' && strLength > 0 ? strLength : false;
	if (strLength) {
		// Define all the possible characters that could go into a string
		var possibleCharacters = 'abcdefghijklmnopqrstuvwxyz0123456789';

		// Start the final string
		var str = '';
		for (i = 1; i <= strLength; i++) {
			// Get a random charactert from the possibleCharacters string
			var randomCharacter = possibleCharacters.charAt(Math.floor(Math.random() * possibleCharacters.length));
			// Append this character to the string
			str += randomCharacter;
		}
		// Return the final string
		return str;
	} else {
		return false;
	}
};

// Checkout using Stripe API
helpers.checkoutWithStripe = (checkoutData, callback) => {
	if (['usd', 'aud', 'brl', 'cad', 'chf', 'dkk', 'eur', 'gbp'].indexOf(checkoutData.currency) > -1) {
		checkoutData.amount = checkoutData.amount * 100;
	}
	const payload = {
		'amount': checkoutData.amount,
		'currency': checkoutData.currency,
		'description': checkoutData.description,
		'source': checkoutData.source
	}
	const payloadString = queryString.stringify(payload);

	const requestDetail = {
		'protocol': 'https:',
		'hostname': 'api.stripe.com',
		'method': 'POST',
		'path': '/v1/charges',
		'auth': config.stripeKey,
		'headers': {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(payloadString)
		}
	}

	req = https.request(requestDetail, res => {
		if (res.statusCode == 200 || res.statusCode == 201) {
			callback(false);
		} else {
			callback("Stripe's status code: " + res.statusCode);
		}
	});

	req.on('error', err => {
		callback(err);
	});
	req.write(payloadString);
	req.end();
}

// Send mail to customer using Mailgun API
helpers.sendMailWithMailgun = (email, content, callback) => {
	const payload = {
		'from': 'Pizza Restaurant ' + config.mailgun.email,
		'to': email,
		'subject': content.subject,
		'text': content.text
	}
	const payloadString = queryString.stringify(payload);

	const requestDetail = {
		'protocol': 'https:',
		'hostname': 'api.mailgun.net',
		'method': 'POST',
		'path': '/v3' + config.mailgun.email + '/messages',
		'auth': 'api:' + config.mailgun.key,
		'headers': {
			'Content-Type': 'application/x-www-form-urlencoded',
			'Content-Length': Buffer.byteLength(payloadString)
		}
	}

	req = https.request(requestDetail, res => {
		if (res.statusCode == 200 || res.statusCode == 201) {
			callback(false);
		} else {
			callback("Mailgun's status code: " + res.statusCode);
		}
	});

	req.on('error', err => {
		callback(err);
	});
	req.write(payloadString);
	req.end();
}

// Export the module
module.exports = helpers;