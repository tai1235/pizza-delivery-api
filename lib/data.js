// Dependencies
const fs = require('fs');
const path = require('path');
const helpers = require('./helpers');

// Container for the module
const lib = {};

lib.baseDir = path.join(__dirname, "../.data/");

// Write data to a file
lib.create = (dir, file, data, callback) => {
    // Open the file to write to
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'wx', (err, fd) => {
        if (!err && fd) {
            // Convert data to string
            const dataString = JSON.stringify(data);
            fs.writeFile(fd, dataString, err => {
                if (!err) {
                    fs.close(fd, err => {
                        if (!err) {
                            callback(false);
                        } else {
                            callback("[data.create] Error closing file");
                        }
                    });
                } else {
                    callback("[data.create] Error writing to file");
                }
            });
        } else {
            callback("[data.create] Error creating file");
        }
    });
}

// Reading from a file
lib.read = (dir, file, callback) => {
    fs.readFile(lib.baseDir + dir + '/' + file + '.json', 'utf-8', (err, data) => {
        if (!err && data) {
            const dataObject = helpers.parseJsonToObject(data);
            callback(false, dataObject);
        } else {
            callback(err, data);
        }
    });
}

// Updating a file
lib.update = (dir, file, data, callback) => {
    fs.open(lib.baseDir + dir + '/' + file + '.json', 'r+', (err, fd) => {
        if (!err && fd) {
            // Truncate the file
            fs.truncate(fd, 0, err => {
                if (!err) {
                    // Convert data to string
                    const dataString = JSON.stringify(data);
                    fs.writeFile(fd, dataString, err => {
                        if (!err) {
                            fs.close(fd, err => {
                                if (!err) {
                                    callback(false);
                                } else {
                                    callback("[data.update] Error closing file");
                                }
                            });
                        } else {
                            callback("[data.update] Error writing to file");
                        }
                    });
                } else {
                    callback("[data.update] Error truncating file");
                }
            });
        } else {
            callback("[data.update] Error openning file");
        }
    });
}

// Delete a file
lib.delete = (dir, file, callback) => {
    fs.unlink(lib.baseDir + dir + '/' + file + '.json', err => {
        if (!err) {
            callback(false);
        } else {
            callback("[data.delete] Error unlinking file");
        }
    });
}

// List all file in a directory
lib.list = (dir, callback) => {
    fs.readdir(lib.baseDir + dir + '/', (err, data) => {
        if (!err && data && data.length > 0) {
            const trimmedFileName = [];
            data.forEach(fileName => {
                trimmedFileName.push(fileName.replace('.json', ''));
            });
            callback(false, trimmedFileName);
        } else {
            callback(err, data);
        }
    });
}

// Export the module
module.exports = lib;