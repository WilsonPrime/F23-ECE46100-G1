"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var fs = require("fs");
//Test Path
var file = 'browserify_info.json';
var jsonpath = 'nullivex_nodist_info.json';
var readJSON = function (jsonPath, callback) {
    fs.readFile(jsonPath, 'utf-8', function (err, data) {
        if (err) {
            console.error('Error reading file:', err);
            callback(null); // Pass null to the callback to indicate an error
            return;
        }
        try {
            var jsonData = JSON.parse(data);
            callback(jsonData); // Pass the parsed JSON data to the callback
        }
        catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            callback(null); // Pass null to the callback to indicate an error
        }
    });
};
function check_npm_for_open_source(filePath) {
    return new Promise(function (resolve) {
        readJSON(filePath, function (jsonData) {
            if (jsonData !== null) {
                if (jsonData.repository.type == 'git') {
                    var gitUrl = jsonData.repository.url;
                    console.log('ssh url:', gitUrl);
                    var httpsUrl = 'https://' + gitUrl.substring(10, gitUrl.length);
                    console.log('https url:', httpsUrl);
                    //return github url
                    console.log('JSON:', jsonData);
                    resolve(httpsUrl);
                }
                else {
                    console.log('No git repository found.');
                    resolve("Invalid");
                }
            }
            else {
                console.error('Failed to read or parse JSON.');
                resolve(null);
            }
        });
    });
}
//count number of contributors by checking each unique usernames(login)
function countContributors(data) {
    var uniqueLogins = new Set();
    data.forEach(function (item) {
        if (item.login) {
            uniqueLogins.add(item.login);
        }
    });
    return uniqueLogins.size;
}
function parseJSON(filePath) {
    var fs = require('fs');
    // Replace 'yourJsonFile.json' with the path to your JSON file
    var jsonFilePath = 'yourJsonFile.json';
    try {
        // Read the JSON data from the file
        var jsonData = fs.readFileSync(filePath, 'utf8');
        var data = JSON.parse(jsonData);
        // Access the contributors URL
        var contributorsUrl = data.contributors_url;
        // Fetch contributors data
        fetch(contributorsUrl)
            .then(function (response) {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
            .then(function (contributorsData) {
            // Handle contributors data 
            var numContributors = countContributors(contributorsData);
            console.log('Contributors:', contributorsData);
            console.log('numConstributors:', numContributors);
        })
            .catch(function (error) {
            console.error('Error:', error);
        });
    }
    catch (error) {
        console.error('Error reading or parsing JSON:', error);
    }
}
//check_npm_for_open_source(file);
parseJSON(jsonpath);
