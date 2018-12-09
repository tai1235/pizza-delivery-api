// Dependencied
const server = require('./lib/server');

// Container for the module
const app = {};

// Init the app
app.init = () => {
    server.init();
}

// Run the app
app.init()

// Export the module
module.exports = app;