"use strict";
exports.__esModule = true;
var fs = require("fs");
var file = 'nullivex_nodist_info.json';
var list = [];
var readJSON = function (jsonPath, callback) {
    fs.readFile(jsonPath, 'utf-8', function (err, data) {
        if (err) {
            console.error('Error reading file:', err);
            callback(null); // Pass null to the callback to indicate an error
            return;
        }
        try {
            var jsonData = JSON.parse(data);
            for (var prop in jsonData) {
                console.log(jsonData.prop['id']);
            }
            //console.log(jsonData)
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
            /*
            if (jsonData !== null) {
                
    
    
    
    
    
    
              if (jsonData.repository.type == 'git') {
                let gitUrl: string = jsonData.repository.url;
                console.log('ssh url:', gitUrl);
                let httpsUrl: string = 'https://' + gitUrl.substring(10,gitUrl.length);
                console.log('https url:', httpsUrl);
                //return github url
                resolve(httpsUrl);
              } else {
                console.log('No git repository found.');
                resolve("Invalid");
              }
            } else {
              console.error('Failed to read or parse JSON.');
              resolve(null);
            } */
        });
    });
}
check_npm_for_open_source(file);
