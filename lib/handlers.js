// Dependencies
const config = require('./config');
const _data = require('./data');
const _helper = require('./helpers')

// Container for the module
const handlers = {};

// Ping handler
handlers.ping = (data, callback) => {
    callback(200);
}

// Not-found handler
handlers.notFound = (data, callback) => {
    callback(404);
}

// Function to validate email
handlers._emailValidation = email => {
    // First check if any value was actually set
    if (email.length == 0) return false;
    // Now validate the email format using Regex
    var re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/i;
    return re.test(email);
}

//----------------------------------------------------------------------------------------------------------------------

// Users handler
handlers.users = (data, callback) => {
    const acceptableMethod = ['post', 'put', 'get', 'delete'];
    if (acceptableMethod.indexOf(data.method) > -1) {
        handlers._users[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for all users handler
handlers._users = {};

// User - POST: Create user
// Required data: firstName, lastName, email, password, address
// Optional data: none
handlers._users.post = (data, callback) => {
    // Validate post data
    const firstName = typeof (data.payload.firstName) == 'string'
        && data.payload.firstName.trim().length > 0 ?
        data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0 ?
        data.payload.lastName.trim() : false;
    const email = typeof (data.payload.email) == 'string'
        && handlers._emailValidation(data.payload.email.trim()) ?
        data.payload.email.trim() : false;
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;
    const address = typeof (data.payload.address) == 'string'
        && data.payload.address.trim().length > 0 ?
        data.payload.address.trim() : false;

    if (firstName && lastName && email && password && address) {
        // Check the existence of user
        _data.read('users', email, (err, userData) => {
            if (err) {
                // Hash password
                const hashedPassword = _helper.hash(password);
                if (hashedPassword) {
                    // Create user data to store
                    const userObject = {
                        'firstName': firstName,
                        'lastName': lastName,
                        'email': email,
                        'password': hashedPassword,
                        'address': address
                    }
                    // Store the user
                    _data.create('users', email, userObject, err => {
                        if (!err) {
                            delete userObject.password;
                            callback(200, userObject);
                        } else {
                            callback(500, { "Error": "Could not create user" });
                        }
                    });
                } else {
                    callback(500, { "Error": "Could not hash password" });
                }
            } else {
                callback(400, { "Error": "This email has already used" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// User - GET: Get user's information
// Required data: email
// Optional data: none
// Required token in header
handlers._users.get = (data, callback) => {
    // Validate required data
    const email = typeof (data.queryString.email) == 'string'
        && handlers._emailValidation(data.queryString.email.trim()) ?
        data.queryString.email.trim() : false;

    if (email) {
        // Validate token data
        const tokenID = typeof (data.headers.token) == 'string'
            && data.headers.token.trim().length == 20 ?
            data.headers.token.trim() : false;
        handlers._tokens.validate(tokenID, email, tokenIsValid => {
            if (tokenIsValid) {
                // Lookup user
                _data.read('users', email, (err, userData) => {
                    if (!err && userData) {
                        // Delete user's password
                        delete userData.password;
                        callback(200, userData);
                    } else {
                        callback(404);
                    }
                });
            } else {
                callback(400, { "Error": "Invalid token" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// User - PUT: Change user's information
// Required data: email
// Optional data: firstName, lastName, address, password
// Required token in header
handlers._users.put = (data, callback) => {
    // Validate required data
    const email = typeof (data.payload.email) == 'string'
        && handlers._emailValidation(data.payload.email.trim()) ?
        data.payload.email.trim() : false;

    // Validate optional data
    const firstName = typeof (data.payload.firstName) == 'string'
        && data.payload.firstName.trim().length > 0 ?
        data.payload.firstName.trim() : false;
    const lastName = typeof (data.payload.lastName) == 'string'
        && data.payload.lastName.trim().length > 0 ?
        data.payload.lastName.trim() : false;
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;
    const address = typeof (data.payload.address) == 'string'
        && data.payload.address.trim().length > 0 ?
        data.payload.address.trim() : false;

    if (email) {
        if (firstName || lastName || password || address) {
            // Validate token data
            const tokenID = typeof (data.headers.token) == 'string'
                && data.headers.token.trim().length == 20 ?
                data.headers.token.trim() : false;
            handlers._tokens.validate(tokenID, email, tokenIsValid => {
                if (tokenIsValid) {
                    // Lookup user
                    _data.read('users', email, (err, userData) => {
                        if (!err && userData) {
                            if (firstName)
                                userData.firstName = firstName;
                            if (lastName)
                                userData.lastName = lastName;
                            if (password)
                                userData.password = _helper.hash(password);
                            if (address)
                                userData.address = address;
                            _data.update('users', userData.email, userData, err => {
                                if (!err) {
                                    callback(200);
                                } else {
                                    console.log(err);
                                    callback(500, { "Error": "Could not update user" });
                                }
                            })
                        } else {
                            callback(404);
                        }
                    });
                } else {
                    callback(400, { "Error": "Invalid token" });
                }
            });
        } else {
            callback(400, { "Error": "Missing fields to update" });
        }
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// User - DELETE: Delete user
// Required data: email
// Optional data: none
// @TODO Delete all associated data
handlers._users.delete = (data, callback) => {
    // Validate required data
    const email = typeof (data.queryString.email) == 'string'
        && handlers._emailValidation(data.queryString.email.trim()) ?
        data.queryString.email.trim() : false;

    if (email) {
        // Validate token data
        const tokenID = typeof (data.headers.token) == 'string'
            && data.headers.token.trim().length == 20 ?
            data.headers.token.trim() : false;
        handlers._tokens.validate(tokenID, email, tokenIsValid => {
            if (tokenIsValid) {
                // Lookup user
                _data.read('users', email, (err, userData) => {
                    if (!err && userData) {
                        // Delete user
                        _data.delete('users', userData.email, err => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { "Error": "Could not delete this user" });
                            }
                        });
                    } else {
                        callback(400, { "Error": "Could not find specified user" });
                    }
                });
            } else {
                callback(400, { "Error": "Invalid token" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

//----------------------------------------------------------------------------------------------------------------------

// Token handler
handlers.tokens = (data, callback) => {
    const acceptableMethod = ['post', 'put', 'get', 'delete'];
    if (acceptableMethod.indexOf(data.method) > -1) {
        handlers._tokens[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for all token handlers
handlers._tokens = {};

// Token - POST: Create session
// Required data: email, password
// Optional data: none
handlers._tokens.post = (data, callback) => {
    // Validate required data
    const email = typeof (data.payload.email) == 'string'
        && handlers._emailValidation(data.payload.email.trim()) ?
        data.payload.email.trim() : false;
    const password = typeof (data.payload.password) == 'string'
        && data.payload.password.trim().length > 0 ?
        data.payload.password.trim() : false;

    if (email && password) {
        // Lookup user
        _data.read('users', email, (err, userData) => {
            if (!err && userData) {
                // Check password
                if (userData.password === _helper.hash(password)) {
                    // Create token id
                    const token = _helper.createRandomString(20);
                    // Get the menu
                    const menu = _data.read('', 'menu', (err, menuData) => {
                        if (!err && menuData) {
                            // Create token data to store
                            const tokenObject = {
                                'id': token,
                                'email': userData.email,
                                'expire': Date.now() + 1000 * 60 * 60,
                            }
                            // Store token data
                            _data.create('tokens', token, tokenObject, err => {
                                if (!err) {
                                    callback(200, {"id": tokenObject.id, menuData});
                                } else {
                                    callback(500, { "Error": "Could not create token" });
                                }
                            });
                        } else {
                            callback(500, { "Error": "Could not get menu items" });
                        }
                    });
                } else {
                    callback(400, { "Error": "Invalid password" });
                }
            } else {
                callback(400, { "Error": "Could not find the specified user" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// Token - GET: Get token's data
// Required data: id
// Optional data: none
handlers._tokens.get = (data, callback) => {
    // Validate required data
    const tokenID = typeof (data.queryString.id) == 'string'
        && data.queryString.id.trim().length == 20 ?
        data.queryString.id : false;

    if (tokenID) {
        // Lookup token
        _data.read('tokens', tokenID, (err, tokenData) => {
            if (!err && tokenData) {
                callback(200, tokenData);
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// Token - PUT: Maintain session
// Required data: id, extended
// Optional data: 
handlers._tokens.put = (data, callback) => {
    // Validate required data
    const tokenID = typeof (data.payload.id) == 'string'
        && data.payload.id.trim().length == 20 ?
        data.payload.id : false;
    const extended = typeof (data.payload.extended) == 'boolean'
        && data.payload.extended ? true : false;

    if (tokenID && extended) {
        // Lookup token
        _data.read('tokens', tokenID, (err, tokenData) => {
            if (!err && tokenData) {
                // Check if token has expired or not
                if (tokenData.expire > Date.now()) {
                    tokenData.expire = Date.now() + 1000 * 60 * 60;
                    // Update token
                    _data.update('tokens', tokenID, tokenData, err => {
                        if (!err) {
                            callback(200);
                        } else {
                            callback(500, { "Error": "Could not update token" });
                        }
                    });
                } else {
                    callback(400, { "Error": "Token has already expired" });
                }
            } else {
                callback(400, { "Error": "Token does not exist" });
            }
        });
    } else {
        callback(400, { "Error": "Required field is missing or invalid" });
    }
}

// Token - DELETE: Remove session
// Required data: id
// Optional data: none
handlers._tokens.delete = (data, callback) => {
    // Validate required data
    const tokenID = typeof (data.queryString.id) == 'string'
        && data.queryString.id.trim().length == 20 ?
        data.queryString.id : false;

    if (tokenID) {
        // Lookup token
        _data.read('tokens', tokenID, (err, tokenData) => {
            if (!err && tokenData) {
                // Delete token
                _data.delete('tokens', tokenData.id, err => {
                    if (!err) {
                        callback(200);
                    } else {
                        callback(500, { "Error": "Could not delete token" });
                    }
                });
            } else {
                callback(400, { "Error": "Could not find specified token" });
            }
        });
    } else {
        callback(400, { "Error": "Required field is missing or invalid" });
    }
}

// Funtion for user to validate token
handlers._tokens.validate = (id, email, callback) => {
    _data.read('tokens', id, (err, tokenData) => {
        if (!err) {
            // Check if user is correct and token hasn't expired yet
            if (tokenData.email === email && tokenData.expire > Date.now()) {
                callback(true);
            } else {
                callback(false);
            }
        } else {
            callback(false);
        }
    });
}

//----------------------------------------------------------------------------------------------------------------------

// Order handler
handlers.orders = (data, callback) => {
    const acceptableMethod = ['post', 'put', 'get', 'delete'];
    if (acceptableMethod.indexOf(data.method) > -1) {
        handlers._orders[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container for all order handlers
handlers._orders = {};

// Order - POST: Create a shopping cart with items
// Required data: email, items (array with pizza's id, size and quantity)
// Optional data: none
// Required token in header
handlers._orders.post = (data, callback) => {
    // Validate required data
    const email = typeof (data.payload.email) == 'string'
        && handlers._emailValidation(data.payload.email.trim()) ?
        data.payload.email.trim() : false;
    const items = typeof (data.payload.items) == 'object'
        && data.payload.items instanceof Array
        && data.payload.items.length > 0 ?
        data.payload.items : false;

    if (email && items) {
        // Validate token data
        const tokenID = typeof (data.headers.token) == 'string'
            && data.headers.token.trim().length == 20 ?
            data.headers.token.trim() : false;
        handlers._tokens.validate(tokenID, email, tokenIsValid => {
            if (tokenIsValid) {
                // Lookup user
                _data.read('users', email, (err, userData) => {
                    if (!err && userData) {
                        // Get the menu
                        _data.read('', 'menu', (err, menuData) => {
                            if (!err && menuData) {
                                // Validate items in the shopping cart
                                const menuList = menuData.map(obj => obj.id);
                                if (items.every(i => menuList.indexOf(i.id) > -1
                                    && typeof (i.quantity) == 'number'
                                    && typeof (i.size) == 'string'
                                    && ['S', 'M', 'L'].indexOf(i.size) > -1)) {
                                    // Calculate number of item and total price
                                    const countItem = items.reduce((count, i) => {
                                        return count + i.quantity;
                                    }, 0);
                                    const totalPrice = items.reduce((total, i) => {
                                        return total + menuData[i.id].price[i.size] * i.quantity;
                                    }, 0);
                                    // Create new order to store
                                    const orderObject = {
                                        'id': _helper.createRandomString(20),
                                        'email': userData.email,
                                        'items': items,
                                        'totalItem': countItem,
                                        'totalPrice': totalPrice,
                                        'paid': false
                                    }
                                    // Store order
                                    _data.create('orders', orderObject.id, orderObject, (err) => {
                                        if (!err) {
                                            callback(200, orderObject);
                                        } else {
                                            callback(500, { "Error": "Could not create order" });
                                        }
                                    });
                                } else {
                                    callback(400, { "Error": "Shooping cart contains invalid item(s)" });
                                }
                            } else {
                                callback(500, { "Error": "Could not get menu items" });
                            }
                        });
                    } else {
                        callback(400, { "Error": "Could not find specied user" });
                    }
                });
            } else {
                callback(400, { "Error": "Invalid token" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// Order - GET: Get order's information
// Required data: order's id
// Optional data: none
// Required token in header
handlers._orders.get = (data, callback) => {
    // Validate required data
    const orderID = typeof (data.queryString.id) == 'string'
        && data.queryString.id.trim().length == 20 ?
        data.queryString.id.trim() : false;

    if (orderID) {
        // Lookup the check
        _data.read('orders', orderID, (err, orderData) => {
            if (!err && orderData) {
                // Validate token data
                const tokenID = typeof (data.headers.token) == 'string'
                    && data.headers.token.trim().length == 20 ?
                    data.headers.token.trim() : false;
                handlers._tokens.validate(tokenID, orderData.email, (tokenIsValid) => {
                    if (tokenIsValid) {
                        callback(200, orderData);
                    } else {
                        callback(400, { "Error": "Invalid token" });
                    }
                });
            } else {
                callback(404);
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// Order - PUT: Change and update shopping cart
// Required data: order's id, items (array with pizza's id, size and quantity)
// Optional data: none
// Required token in header
handlers._orders.put = (data, callback) => {
    // Validate required data
    const orderID = typeof (data.payload.id) == 'string'
        && data.payload.id.trim().length == 20 ?
        data.payload.id.trim() : false;
    const items = typeof (data.payload.items) == 'object'
        && data.payload.items instanceof Array
        && data.payload.items.length > 0 ?
        data.payload.items : false;

    if (orderID && items) {
        // Lookup order
        _data.read('orders', orderID, (err, orderData) => {
            if (!err && orderData) {
                // Validate token data
                const tokenID = typeof (data.headers.token) == 'string'
                    && data.headers.token.trim().length == 20 ?
                    data.headers.token.trim() : false;
                handlers._tokens.validate(tokenID, orderData.email, (tokenIsValid) => {
                    if (tokenIsValid) {
                        // Get the menu
                        _data.read('', 'menu', (err, menuData) => {
                            if (!err && menuData) {
                                // Validate items
                                const menuList = menuData.map(obj => obj.id);
                                if (items.every(i => menuList.indexOf(i.id) > -1
                                    && typeof (i.quantity) == 'number'
                                    && typeof (i.size) == 'string'
                                    && ['S', 'M', 'L'].indexOf(i.size) > -1)) {
                                    // Update order
                                    const countItem = items.reduce((count, i) => {
                                        return count + i.quantity;
                                    }, 0);
                                    const totalPrice = items.reduce((total, i) => {
                                        return total + menuData[i.id].price[i.size] * i.quantity;
                                    }, 0);
                                    orderData.items = items
                                    orderData.totalItem = countItem;
                                    orderData.totalPrice = totalPrice;
                                    // Store order
                                    _data.update('orders', orderData.id, orderData, (err) => {
                                        if (!err) {
                                            callback(200, orderData);
                                        } else {
                                            callback(500, { "Error": "Could not update order" });
                                        }
                                    });
                                }
                            } else {
                                callback(500, { "Error": "Could not get the menu" });
                            }
                        });
                    } else {
                        callback(400, { "Error": "Invalid token" });
                    }
                });
            } else {
                callback(400, { "Error": "Could not find order to update" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

// Order - DELETE: Delete order
// Required data: order's id
// Optional data: none
// Required token in header
handlers._orders.delete = (data, callback) => {
    // Validate required data
    const orderID = typeof (data.queryString.id) == 'string'
        && data.queryString.id.trim().length == 20 ?
        data.queryString.id.trim() : false;

    if (orderID) {
        // Lookup order
        _data.read('orders', orderID, (err, orderData) => {
            if (!err && orderData) {
                // Validate token data
                const tokenID = typeof (data.headers.token) == 'string'
                    && data.headers.token.trim().length == 20 ?
                    data.headers.token.trim() : false;
                handlers._tokens.validate(tokenID, orderData.email, tokenIsValid => {
                    if (tokenIsValid) {
                        // Delete order
                        _data.delete('orders', orderID, err => {
                            if (!err) {
                                callback(200);
                            } else {
                                callback(500, { "Error": "Could not delete specified order" });
                            }
                        });
                    } else {
                        callback(400, { "Error": "Invalid token" });
                    }
                });
            } else {
                callback(400, { "Error": "Could not find specified order" });
            }
        });
    } else {
        callback(400, { "Error": "Required field is missing or invalid" });
    }
}

//----------------------------------------------------------------------------------------------------------------------

// Checkout handler
handlers.checkout = (data, callback) => {
    const acceptableMethod = ['post'];
    if (acceptableMethod.indexOf(data.method) > -1) {
        handlers._checkout[data.method](data, callback);
    } else {
        callback(405);
    }
}

// Container to hold checkout handler
handlers._checkout = {};

// Checkout - POST: Pay for all the items in order
// Required data: order's id, stripe's token
// Optional data: none
// Required token in header
handlers._checkout.post = (data, callback) => {
    // Validate required data
    const orderID = typeof (data.payload.id) == 'string'
        && data.payload.id.trim().length == 20 ?
        data.payload.id.trim() : false;
    const stripeToken = typeof (data.payload.stripeToken) == 'string'
        && data.payload.stripeToken.trim().length > 0 ?
        data.payload.stripeToken.trim() : false;

    if (orderID && stripeToken) {
        _data.read('orders', orderID, (err, orderData) => {
            if (!err && orderData) {
                // Validate token data
                const tokenID = typeof (data.headers.token) == 'string'
                    && data.headers.token.trim().length == 20 ?
                    data.headers.token.trim() : false;
                handlers._tokens.validate(tokenID, orderData.email, tokenIsValid => {
                    if (tokenIsValid) {
                        if (!orderData.paid) {
                            // Create checkout data
                            const checkoutData = {
                                'amount': orderData.totalPrice,
                                'currency': config.currency,
                                'description': 'Checkout customer\'s order',
                                'source': stripeToken
                            }
                            _helper.checkoutWithStripe(checkoutData, err => {
                                if (!err) {
                                    const emailContent = {
                                        'subject': 'Pizza Payment',
                                        'text': 'Your payment has been successfully accepted'
                                    }
                                    _helper.sendMailWithMailgun(orderData.email, emailContent, err => {
                                        if (!err) {
                                            callback(200);
                                        } else {
                                            callback(200, { "Warning": "Payment accepted but could not send email to customer" });
                                        }
                                    });
                                } else {
                                    callback(500, { "Error": err });
                                }
                            });
                        } else {
                            callback(400, { "Error": "Order has already been paid" });
                        }
                    } else {
                        callback(400, { "Error": "Invalid token" });
                    }
                });
            } else {
                callback(400, { "Error": "Could not find specified order" });
            }
        });
    } else {
        callback(400, { "Error": "Required fields are missing or invalid" });
    }
}

//----------------------------------------------------------------------------------------------------------------------

// Export the module
module.exports = handlers;