/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/
/ NPM/GITHUB URL-to-JSON                    /
/     Program takes in text file of URLS,   /
/     we return output files of JSON data   /
/     from each npm/github url.             /
/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/

// setup
import * as fs from 'fs'; // use filesystem
import { execSync } from 'child_process'; // to execute shell cmds
let npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
let gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
var arg = process.argv[2];  // this is the url(s).txt arguement passed to the js executable
let pkgName: string[] = []; // setup array for package names
let gitDetails: { username: string, repo: string }[] = []; // setup array for git user/repo name 

// sleep function to avoid rate limit
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
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
const get_github_info = (gitUrl: string): { username: string, repo: string} | null => {
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
            await sleep(2000); // sleep to avoid rate limit
        } catch (error) {
            console.error(`Failed to get npm info for package: ${pkg}`);
            //process.exit(0); // exit if we fail to get github info
        }
    }
}

async function get_github_package_json(gitDetails: {username: string, repo: string}[]): Promise<void> { 
    for (let detail of gitDetails) { 
        let repoURL: string = `https://api.github.com/repos/${detail.username}/${detail.repo}`; // api url for github
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