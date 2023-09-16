import * as fs from 'fs';

//Test Path
const file = 'browserify_info.json';

const readJSON = (jsonPath: string, callback: (data: Record<string, any> | null) => void) => {
    fs.readFile(jsonPath, 'utf-8', (err, data) => {
        if (err) {
            console.error('Error reading file:', err);
            callback(null); // Pass null to the callback to indicate an error
            return;
        }

        try {
            const jsonData = JSON.parse(data);
            callback(jsonData); // Pass the parsed JSON data to the callback
        }catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            callback(null); // Pass null to the callback to indicate an error
        }
    });
};

function check_npm_for_open_source(filePath: string): Promise<string | null> {
    return new Promise((resolve) => {
      readJSON(filePath, (jsonData) => {
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
        }
      });
    });
  }

check_npm_for_open_source(file);