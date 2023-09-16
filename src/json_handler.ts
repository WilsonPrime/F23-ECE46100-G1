import * as fs from 'fs';

//Test Path
const file = 'browserify_info.json';
const jsonpath = 'nullivex_nodist_info.json';

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
    } catch (parseError) {
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
          let httpsUrl: string = 'https://' + gitUrl.substring(10, gitUrl.length);
          console.log('https url:', httpsUrl);
          //return github url
          console.log('JSON:', jsonData);
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

//count number of contributors by checking each unique usernames(login)
function countContributors(data: any[]): number {
  const uniqueLogins = new Set<string>();

  data.forEach(item => {
    if (item.login) {
      uniqueLogins.add(item.login);
    }
  });

  return uniqueLogins.size;
}

function parseJSON(filePath: string) {
  const fs = require('fs');
  // Replace 'yourJsonFile.json' with the path to your JSON file
  const jsonFilePath = 'yourJsonFile.json';
  try {
    // Read the JSON data from the file
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonData);
    // Access the contributors URL
    const contributorsUrl = data.contributors_url;
    // Fetch contributors data
    fetch(contributorsUrl)
      .then((response) => {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then((contributorsData) => {
        // Handle contributors data 
        const numContributors = countContributors(contributorsData);
        console.log('Contributors:', contributorsData);
        console.log('numConstributors:', numContributors);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  } catch (error) {
    console.error('Error reading or parsing JSON:', error);
  }

}
//check_npm_for_open_source(file);
parseJSON(jsonpath);