
// super program to do everything we need
// this is just gonna be a mess of code, we can clean it up later if we want
// we can probably split this into multiple files if we want, but for now its all in one

// small "bug" not really a bug, just hasn't been fully implemented yet
  // git api uses pagination, so we only get max 100 results per page,
  // so we need to comb through all pages to get all contributors, but for now we only get the first 100
  // there are ways to do this, brain kinda hurts so ill tackle tomorrow


import * as fs from 'fs'; // use filesystem
import { execSync } from 'child_process'; // to execute shell cmds



const npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
const gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
const arg = process.argv[2];  // this is the url(s).txt arguement passed to the js executable
const pkgName: string[] = []; // setup array for package names
const gitDetails: { username: string, repo: string }[] = []; // setup array for git user/repo name 


//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/
// Some test ideas:   (FROM COPILOT)
//      - no file name passed
//      - invalid file name passed
//      - file name with no urls
//      - file name with invalid urls
//      - file name with valid urls
//      - file name with a mix of valid and invalid urls
//      - file name with duplicate urls
//      - file name with duplicate urls and invalid urls
//      - file name with duplicate urls and valid urls
//      - file name with duplicate urls, valid urls, and invalid urls
//      - file name with duplicate urls, valid urls, and invalid urls
//      - file name with duplicate urls, valid urls, and invalid urls with whitespace
//      - file name with duplicate urls, valid urls, and invalid urls in with whitespace and blank lines
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/



function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function ensureDirectoryExistence(directory: string): void {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}


const readJSON = (jsonPath: string, callback: (data: Record<string, unknown> | null) => void) => {
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
          const repository = jsonData.repository as Record<string, unknown>;
          if (repository.type == 'git') {
            let gitUrl: string = repository.url as string;
            if (gitUrl.startsWith('git+ssh://git@')) {
              // Convert SSH URL to HTTPS URL
              gitUrl = gitUrl.replace('git+ssh://git@', 'https://');
            } else if (gitUrl.startsWith('git+https://')) {
              gitUrl = gitUrl.replace('git+https://', 'https://');
            }

            if (gitUrl.endsWith('.git')) { 
              gitUrl = gitUrl.substring(0, gitUrl.length - 4);
            }
            console.log(gitUrl); 
            //return github url
            resolve(gitUrl);
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

  function countContributors(data: { login: string }[]): number {
    const uniqueLogins = new Set<string>();
  
    data.forEach(item => {
      if (item.login) {
        uniqueLogins.add(item.login);
      }
    });
  
    return uniqueLogins.size;
  }



  // cheeeky function to calculate bus factor
  //  ¯\_(ツ)_/¯
  function calculateBusFactor(x: number): number {
    const result = Math.pow((Math.log(x + 1) / (Math.log(500) + 1)), 1.22);
    return result;
  }


  function parseContributors(filePath: string) {
    try {
      // Read the JSON data from the file
      const jsonData = fs.readFileSync(filePath, 'utf8');
      const data = JSON.parse(jsonData);
      // Access the contributors URL
      const contributorsUrl = data.contributors_url;
      const fullPageResults = '?per_page=45';
      const full_url = contributorsUrl.concat(fullPageResults);
      //console.log(full_url);

    
      // Fetch contributors data
      fetch(full_url)
        .then(async (response) => {
          if (!response.ok) {
            throw new Error('Network response was not ok');
          }
          
          await sleep(2000); // sleep to avoid rate limit

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

/*
//function to find time between the create and close for an issue
function findResponsiveTime(data: any[]): number {
  const listDifference: number[] = []; //list to keep track of time differences for avg
  const openIssue: number[] = []; //list to keep track of open issues
  data.forEach(function (item) {
    const issue = item.payload.issue; //check if item is has an issue field
    if (issue) {
      if (!item.type.includes("omment")) { //issue comment events also has issue field so check for "omment" in type field ("type": "IssuesEvent" vs "type": "IssueCommentEvent")
        const createdAt = new Date(issue.created_at);
        const closedAt = issue.closed_at ? new Date(issue.closed_at) : null; //check if issue has a closed_at field
        if (closedAt) {
          //console.log("");
          console.log("ID ".concat(item.id, ": Type ", item.type));
          //console.log('created time:', createdAt);
          //console.log('closed time:', closedAt);
          const difference = closedAt.valueOf() - createdAt.valueOf();
          listDifference.push(difference);
          //console.log('time differnece', difference);
          //console.log("");

          https://github.com/sridhar-sp/tic-tac-toe
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
  const fs = require('fs');
  try {
    // Read the JSON data from the file
    const jsonData = fs.readFileSync(filePath, 'utf8');
    const data = JSON.parse(jsonData);
    // Access the contributors URL
    const receivedEventsUrl = data.owner.received_events_url;
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
*/

// read urls from file
const url_list = (filename:string): string[] => {
    try { 
        return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean);
    } catch (error) { 
        console.error(`File does not exist`);
        process.exit(0);  
    }
}

// gets npm package names
const get_npm_package_name = (npmUrl: string): string | null  => { 
    const npm_match = npmUrl.match(npmRegex);
    if (npm_match) { // if url is found with proper regex (package identifier)
        return npm_match[1]; // return this package name
    }
    return null;  
}

// gets github username and repo
const get_github_info = (gitUrl: string): { username: string, repo: string} | null  => {
    const gitMatch = gitUrl.match(gitRegex);
    if (gitMatch) { 
        return {
            username: gitMatch[1],
            repo: gitMatch[2]
        };
    }
    return null; 
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/

// we could probably stick the below into a function, but for now it works :3 
if (!arg || typeof arg !== 'string') {
    console.log("No URL argument provided");
    process.exit(1);
}

if (arg.length > 2) { // string at least have .txt, if we dont see more than 2 characters we havent gotten a proper file name
    const filename = arg;
    const urls = url_list(filename); // grab urls from file. 
    if (urls.length === 0) {
        console.log("No URLS found");
        process.exit(0); 
    }
    urls.forEach(url => {
        const npmPackageName = get_npm_package_name(url); // get package name 
        const gitInfo = get_github_info(url); // get github info
        if (npmPackageName) {
            pkgName.push(npmPackageName) // push to package name array
        } else if (gitInfo) {
            gitDetails.push(gitInfo); // push to github details array
        } else {
            console.error("Error, invalid contents of file"); // non git or npm url
        }
    }); 
} else {
    process.exit(0); // no file name passed
}

//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/

async function get_npm_package_json(pkgName: string []): Promise<void> { 
    ensureDirectoryExistence('./temp_npm_json'); // make directory for json files
    for (let i = 0; i < pkgName.length; i++) {
        const pkg = pkgName[i];
        try {
            const output = execSync(`npm view ${pkg} --json`, { encoding: 'utf8' }); // shell cmd to get json
            fs.writeFileSync(`./temp_npm_json/${pkg}_info.json`, output); // write json to file
            const file = `./temp_npm_json/${pkg}_info.json`; // file path
            const gitURLfromNPM = await check_npm_for_open_source(file);
            if (gitURLfromNPM) {
                const gitInfo = get_github_info(gitURLfromNPM);

                if (gitInfo) {
                    gitDetails.push(gitInfo); // push to github details array
                    get_github_package_json(gitDetails);
                }
            }
            await sleep(2000); // sleep to avoid rate limit
        } catch (error) {
            console.error(`Failed to get npm info for package: ${pkg}`);
            //process.exit(0); // exit if we fail to get npm info
        }
    }
}



async function get_github_package_json(gitDetails: {username: string, repo: string}[]): Promise<void> { 
    ensureDirectoryExistence('./temp_github_json'); // make temp directory for json files
    for (const detail of gitDetails) { 
        const repoURL: string = `https://api.github.com/repos/${detail.username}/${detail.repo}`; // api url for github
        try {
            const output = await fetch(repoURL); // fetch json from url

            if (output.status === 403) { 
                console.error(`Rate limit exceeded, waiting 60 seconds`);
                await sleep(60 * 1000);
                continue; // retry
            }
            if (!output.ok) {
                throw new Error(`Error: ${output.status} ${output.statusText}`);
            }
            const data = await output.json(); // convert to json
            const prettyData = JSON.stringify(data, null, 4); // pretty print json
            fs.writeFileSync(`./temp_github_json/${detail.username}_${detail.repo}_info.json`, prettyData); // write pretty print json to file
            const file = `./temp_github_json/${detail.username}_${detail.repo}_info.json`; // file path
            parseContributors(file);
            //parseResponsiveness(file);
            await sleep(2000); // sleep to avoid rate limit
        } catch (error) {
            console.error(`Failed to get github info for user: ${detail.username} and repo: ${detail.repo}`); // throw error for now, might need to exit on error instead for no console outputs other than desired *we can ask*
            //process.exit(0); // exit if we fail to get github info
        }
    }
}   
get_npm_package_json(pkgName); 
get_github_package_json(gitDetails);
//parseContributors(jsonpath);
//parseResponsiveness(jsonpath);




