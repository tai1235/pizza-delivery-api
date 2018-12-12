// Container for the module
const environments = {};

// Staging environment
environments.staging = {
    'httpPort': 3000,
    'httpsPort': 3001,
    'hashSecret': 'your-secret',
    'currency': 'your-currency',
    'stripeKey': 'your-stripe-api-key',
    'mailgun':{
        'key':'your-mailgun-api-key',
        'email':'your-mailgun-email'
    }
}

// Production environment
environments.production = {
    'httpPort': 5000,
    'httpsPort': 5001,
    'hashSecret': 'your-secret',
    'currency': 'your-currency',
    'stripeKey': 'your-stripe-api-key',
    'mailgun':{
        'key':'your-mailgun-api-key',
        'email':'your-mailgun-email'
    }
}

// Determine the current evironment
const currentEnvironment = typeof (process.NODE_ENV) == 'string' ? process.NODE_ENV.toLowerCase() : false;

// Determine the environment to export, default to staging
const environmentToExport = typeof (environments[currentEnvironment]) == 'object' ?
    environments[currentEnvironment] : environments.staging;

// Export the environment
module.exports = environmentToExport;