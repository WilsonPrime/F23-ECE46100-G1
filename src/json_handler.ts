import * as fs from 'fs';

//Test Path
const file = 'browserify_info.json';
const jsonpath = 'lodash_lodash_info.json';

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
// Function to calculate the bus factor score
function calculateBusFactor(x: number): number {
  const result = Math.pow((Math.log(x + 1) / (Math.log(1000) + 1)), 1.22);
  return result;
}

//function to parse for number of contributors
function parseContributors(filePath: string) {
  const fs = require('fs');
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
        const busFactor = calculateBusFactor(numContributors);
        //console.log('Contributors:', contributorsData);
        console.log('numConstributors:', numContributors);
        console.log('busFactor:', busFactor);
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  } catch (error) {
    console.error('Error reading or parsing JSON:', error);
  }

}


//function to find time between the create and close for an issue
function findResponsiveTime(data: any[]): number {
  const listDifference: number[] = []; //list to keep track of time differences for avg
  const openIssue: number[] = []; //list to keep track of open issues
  data.forEach(function (item) {
    var issue = item.payload.issue; //check if item is has an issue field
    if (issue) {
      if (!item.type.includes("omment")) { //issue comment events also has issue field so check for "omment" in type field ("type": "IssuesEvent" vs "type": "IssueCommentEvent")
        var createdAt = new Date(issue.created_at);
        var closedAt = issue.closed_at ? new Date(issue.closed_at) : null; //check if issue has a closed_at field
        if (closedAt) {
          //console.log("");
          console.log("ID ".concat(item.id, ": Type ", item.type));
          //console.log('created time:', createdAt);
          //console.log('closed time:', closedAt);
          var difference = closedAt.valueOf() - createdAt.valueOf();
          listDifference.push(difference);
          //console.log('time differnece', difference);
          //console.log("");

          
        } else {
          console.log("ID ".concat(item.id, ": Type ", item.type));
          openIssue.push(item.id);
        }
      }
      else { 
        console.log("ID ".concat(item.id, ": Type ", item.type));
      }
    } else {
      console.log("ID ".concat(item.id, ": Type ", item.type));
    }
  });
  console.log("list of time differences:", listDifference);
  console.log("list of open issues:", openIssue);
  if(listDifference.length > 0){
    const sum = listDifference.reduce((a, b) => a + b) / listDifference.length;

    return sum;
  }
  else{
    return -1;
  }
}


function parseResponsiveness(filePath: string) {
  var fs = require('fs');
  try {
    // Read the JSON data from the file
    var jsonData = fs.readFileSync(filePath, 'utf8');
    var data = JSON.parse(jsonData);
    // Access the contributors URL
    var receivedEventsUrl = data.owner.received_events_url;
    // Fetch contributors data
    fetch(receivedEventsUrl)
      .then(function (response) {
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        return response.json();
      })
      .then(function (receivedEventsData) {
        findResponsiveTime(receivedEventsData);
      })
      .catch(function (error) {
        console.error('Error getting urls:', error);
      });
  }
  catch (error) {
    console.error('Error reading or parsing JSON:', error);
  }
}
//check_npm_for_open_source(file);
parseContributors(jsonpath);
parseResponsiveness(jsonpath);
