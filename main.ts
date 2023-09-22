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
    auth: '',
    userAgent: 'pkg-manager/v1.0.0'
});

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
        process.exit(1);  
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

////////////////////////////////////////////////////////////////////////////////
// now we want to get the package.json file from the npm package name and the github repo/username
// npmPkgName and gitDetails are the arrays we will use to get the package.json files, they hold:
    // the package names and github user/repo names

ensureDirectoryExistence('./temp_npm_json'); // make temp directory for npm json files




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

async function get_npm_package_json(pkgName: string []): Promise<void> { 
    for (let i = 0; i < pkgName.length; i++) {
        const pkg = pkgName[i];
        try {
            const output = execSync(`npm view ${pkg} --json`, { encoding: 'utf8' }); // shell cmd to get json
            fs.writeFileSync(`./temp_npm_json/${pkg}_info.json`, output); // write json to file
            const file = `./temp_npm_json/${pkg}_info.json`; // file path
            const gitURLfromNPM = await check_npm_for_open_source(file);
            if (gitURLfromNPM) {
                const gitInfo = get_github_info(gitURLfromNPM); // get github info
                if (gitInfo) {
                    gitDetails.push(gitInfo); // push to github details array
                }
            }
        } catch (error) {
            console.error(`Failed to get npm info for package: ${pkg}`);
        }
    }
}


//////////////////////////////////////////////////////////////////////

async function fetchRepoInfo(username,repo) { 
    try { 
        const repo_info = await octokit.request("GET /repos/{owner}/{repo}", {
            owner: username,
            repo: repo
        });


    } catch (error) { 
        console.error(`Failed to get repo info for ${username}/${repo}`);
    }
}

async function fetchRepoContributors(username: string, repo: string) { 
    try {
        const repo_contributors = await octokit.paginate(`GET /repos/${username}/${repo}/contributors`, {
            per_page: 100,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
              }

        });
        
        const numberOfContributors = repo_contributors.length;
        const busFactor = calculateBusFactor(numberOfContributors);
        console.log(`Bus Factor for ${username}/${repo}: ${busFactor.toFixed(5)}`); 
    
    } catch (error) { 
        console.error(`Failed to get repo collaborators for ${username}/${repo} due to: `, error.message);
    }
}

async function fetchRepoLicense(username: string, repo: string) { 
    try { 
        const repo_license = await octokit.request("GET /repos/{owner}/{repo}/license", {
            owner: username,
            repo: repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
              }
        });
        
        console.log(`License for ${username}/${repo}: ${repo_license.data.license?.name ?? 'Unknown'}`);
    } catch (error) { 
        console.error(`Failed to get repo license for ${username}/${repo}`);
    }
    
}



async function get_git_info(gitDetails: { username: string, repo: string }[]): Promise<void> {
    for (let i = 0; i < gitDetails.length; i++) {
        const gitInfo = gitDetails[i];
        try {
            await fetchRepoInfo(gitInfo.username, gitInfo.repo);
            await fetchRepoContributors(gitInfo.username, gitInfo.repo);
            await fetchRepoLicense(gitInfo.username, gitInfo.repo); 
        } catch (error) {
            console.error(`Failed to get Metric info for ${gitInfo.username}/${gitInfo.repo}`);
        }
    }

}



//////////////////////////////////////////////////////////////////////
// now actual metric score calculations

function calculateBusFactor(x: number): number {
    const result = Math.pow((Math.log(x + 1) / (Math.log(1500) + 1)), 1.22);
    return result;
  }

//////////////////////////////////////////////////////////////////////

async function main() { 

    if (!arg || typeof arg !== 'string') {
        console.log("No URL argument provided"); // probably just exit
        process.exit(1);
    }

    if (arg.length > 2) { // string at least have .txt, if we dont see more than 2 characters we havent gotten a proper file name
        const filename = arg;
        const urls = url_list(filename); // grab urls from file. 
        if (urls.length === 0) {
            console.log("No URLS found");
            process.exit(1); 
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
        process.exit(1); // no file name passed
    }
    
    await get_npm_package_json(npmPkgName);
    await get_git_info(gitDetails);
    //console.log(npmPkgName);
    //console.log(gitDetails);
}

main();