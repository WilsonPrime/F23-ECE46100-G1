/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/
/ NPM/GITHUB URL-to-JSON                    /
/     Program takes in text file of URLS,   /
/     we return output files of JSON data   /
/     from each npm/github url.             /
/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// setup
import * as fs from 'fs'; // use filesystem
import { execSync } from 'child_process'; // to execute shell cmds
const npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
const gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
const arg = process.argv[2];  // this is the url(s).txt arguement passed to the js executable
const pkgName: string[] = []; // setup array for package names
const gitDetails: { username: string, repo: string }[] = []; // setup array for git user/repo name 

// sleep function to avoid rate limit
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}

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
    for (let i = 0; i < pkgName.length; i++) {
        const pkg = pkgName[i];
        try {
            const output = execSync(`npm view ${pkg} --json`, { encoding: 'utf8' }); // shell cmd to get json
            fs.writeFileSync(`./${pkg}_info.json`, output); // write json to file
            const file = `${pkg}_info.json`; // file path
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
    for (const detail of gitDetails) { 
        const repoURL: string = `https://api.github.com/repos/${detail.username}/${detail.repo}`; // api url for github
        try {
            const output = await fetch(repoURL); // fetch json from url
            if (!output.ok) {
                throw new Error(`Error: ${output.status} ${output.statusText}`);
            }
            const data = await output.json(); // convert to json
            const prettyData = JSON.stringify(data, null, 4); // pretty print json
            fs.writeFileSync(`./${detail.username}_${detail.repo}_info.json`, prettyData); // write pretty print json to file
            await sleep(2000); // sleep to avoid rate limit
        } catch (error) {
            console.error(`Failed to get github info for user: ${detail.username} and repo: ${detail.repo}`); // throw error for now, might need to exit on error instead for no console outputs other than desired *we can ask*
            //process.exit(0); // exit if we fail to get github info
        }
    }
}   
get_npm_package_json(pkgName); 
get_github_package_json(gitDetails);




// Path: jsonhandle.ts

//const file = 'browserify_info.json';

