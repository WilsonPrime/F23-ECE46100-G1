import { Octokit, App } from "octokit"; // Octokit v17
import * as fs from 'fs'; // use filesystem
import { execSync } from 'child_process'; // to execute shell cmds

const npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
const gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
const arg = process.argv[2];  // this is the url(s).txt arguement passed to the js executable
const npmPkgName: string[] = []; // setup array for package names
const gitDetails: { username: string, repo: string }[] = []; // setup array for git user/repo name 

function ensureDirectoryExistence(directory: string): void {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}

// octokit setup
const octokit = new Octokit({ 
    userAgent: 'pkg-manager/v1.0.0'
});

// test octokit request
async function fetchIssues() {
    const response = await octokit.request("GET /repos/{owner}/{repo}/issues", {
        owner: "octocat",
        repo: "Spoon-Knife",
    });
    console.log(response);
}
fetchIssues();
///////////////////////////
///////////////////////////////////////////////////////////////////////////////

// this section will take in the urls.txt arguement from the command line and parse it for npm package names and github user/repo names


// read urls from file
// returns array of urls
const url_list = (filename:string): string[] => {
    try { 
        return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean);
    } catch (error) { 
        console.error(`File does not exist`);
        process.exit(0);  
    }
}

// gets npm package names
// returns package name
// returns null if not found
// npm package names are found in the url after /package/
// example: https://www.npmjs.com/package/express

const get_npm_package_name = (npmUrl: string): string | null  => { 
    const npm_match = npmUrl.match(npmRegex);
    if (npm_match) { // if url is found with proper regex (package identifier)
        return npm_match[1]; // return this package name
    }
    return null;  
}

// gets github username and repo
// returns object with username and repo
// returns null if not found
// example: https://github.com/nullivex/nodist
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

// we could probably stick the below into a function, but for now it works :3 
// this section will take in the urls.txt arguement from the command line and parse it for npm package names and github user/repo names
if (!arg || typeof arg !== 'string') {
    console.log("No URL argument provided"); // probably just exit
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
            npmPkgName.push(npmPackageName) // push to package name array
        } else if (gitInfo) {
            gitDetails.push(gitInfo); // push to github details array
        } else {
            console.error("Error, invalid contents of file"); // non git or npm url
        }
    }); 
} else {
    process.exit(0); // no file name passed
}

////////////////////////////////////////////////////////////////////////////////
// now we want to get the package.json file from the npm package name and the github repo/username
// npmPkgName and gitDetails are the arrays we will use to get the package.json files, they hold:
    // the package names and github user/repo names

ensureDirectoryExistence('./temp_npm_json'); // make temp directory for npm json files
ensureDirectoryExistence('./temp_git_json'); // make temp directory for github json files


console.log(npmPkgName);
console.log(gitDetails);