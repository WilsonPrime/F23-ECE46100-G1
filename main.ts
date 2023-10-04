import { Octokit, App } from "octokit"; // Octokit v17
import * as fs from 'fs'; // use filesystem
import { execSync } from 'child_process'; // to execute shell cmds
import * as dotenv from 'dotenv';
const { exec } = require('child_process'); // to execute shell cmds async version


const npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
const gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
const arg = process.argv[2];  // this is the url(s).txt arguement passed to the js executable
const npmPkgName: string[] = []; // setup array for package names
const gitDetails: { username: string, repo: string }[] = []; // setup array for git user/repo name 
const dependencies: string[] = ["octokit",
                                "--save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint",
                                "--save dotenv @types/dotenv --save-dev"]; // setup array for dependencies
const gitUrls: string[] = []; // setup array for git urls

// could probably put in array but,"kiss"
const mit = "MIT" || "mit";
const apache = "Apache" || "apache";
const gpl = "GPL" || "gpl";
const bsd = "BSD" || "bsd"; 

dotenv.config()

const gitHubToken: string = process.env.GITHUB_TOKEN!;
const logLevel: number = parseFloat(process.env.LOG_LEVEL!);
const logFilePath: string = process.env.LOG_FILE!;

if(!gitHubToken || !logLevel || !logFilePath){
    console.error("Error: environment variables not set...\n")
    process.exit(1)
}


function ensureDirectoryExistence(directory: string): void {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}


// if we get here, we know the token is valid

// octokit setup
const octokit = new Octokit({ 
    auth: gitHubToken, // github token
    userAgent: 'pkg-manager/v1.0.0'
});

// run es lint
function runEslint(directory: string) {
    return new Promise((resolve, reject) => {
        exec(`npx eslint ${directory} -o ${directory}/result.json`, { encoding: 'utf8' }, (error: { code: number; }, stdout: unknown, stderr: any) => {
            if (error) {
                // Check if the error is due to linting issues
                if (error.code === 1) {
                
                    resolve(stdout);  // if error is due to linting, it's not a "real" error for us
                } else {
                    reject(error);
                }
            } else {
                resolve(stdout);
            }
        });
    });
}



///////////////////////////
///////////////////////////////////////////////////////////////////////////////

// this section will take in the urls.txt arguement from the command line and parse it for npm package names and github user/repo names


// read urls from file
// returns array of urls
const url_list = (filename:string): string[] => {
    try { 
        return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean); 
    } catch (error) { 
        //console.error(`File does not exist`);
        if(logLevel == 2){
            fs.appendFile(logFilePath, "URL file does not exist.\n", (err)=>{});
        }
        process.exit(1);  
    }
}

/*
 gets npm package names
 returns package name
 npm package names are found in the url after /package/
 example: https://www.npmjs.com/package/express
*/
const get_npm_package_name = (npmUrl: string): string | null  => { 
    const npm_match = npmUrl.match(npmRegex);
    if (npm_match) { // if url is found with proper regex (package identifier)
        return npm_match[1]; // return this package name
    }
    return null;  
}

/*
 gets github username and repo
 returns object with username and repo
 example: https://github.com/nullivex/nodist
*/
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





const readJSON = (jsonPath: string, callback: (data: Record<string, unknown> | null) => void) => {
    fs.readFile(jsonPath, 'utf-8', (err, data) => {
      if (err) {
        //console.error('Error reading file:', err);
        if (logLevel == 2) {
            fs.appendFile(logFilePath, `Error reading file: ${err}\n`, (err)=>{});
        }
        callback(null); // Pass null to the callback to indicate an error
        return;
      }
  
      try {
        const jsonData = JSON.parse(data);
        callback(jsonData); // Pass the parsed JSON data to the callback
      }catch (parseError) {
        //console.error('Error parsing JSON:', parseError);
        if(logLevel == 2){ 
            fs.appendFile(logFilePath, `Error parsing JSON: ${parseError}\n`, (err)=>{});
        }
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
             
            //return github url
            gitUrls.push(gitUrl);
            resolve(gitUrl);
          } else {
            //console.error('No git repository found.');
            if(logLevel == 2){
                fs.appendFile(logFilePath, `No git repository found.\n`, (err)=>{});
            }
            resolve("Invalid");
          }
        } else {
          //console.error('Failed to read or parse JSON.');
            if(logLevel == 2){
                fs.appendFile(logFilePath, `Failed to read or parse JSON.\n`, (err)=>{});
            }
          resolve(null);
        }
      });

    });
  }

async function get_npm_package_json(pkgName: string []): Promise<void> { 
    for (let i = 0; i < pkgName.length; i++) {
        const pkg = pkgName[i];
        try {
            const output = execSync(`npm view ${pkg} --json --silent`, { encoding: 'utf8' }); // shell cmd to get json
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
            //console.error(`Failed to get npm info for package: ${pkg}`);
            if(logLevel == 2){
                fs.appendFile(logFilePath, `Failed to get npm info for package: ${pkg}\n`, (err)=>{});
            }
        }
    }
}


//////////////////////////////////////////////////////////////////////
// here we are getting everything we need for our metrics from the api  (contributors, license, readme, issues, etc)

async function fetchRepoInfo(username: string,repo: string) { 
    try { 
        const repo_info = await octokit.request("GET /repos/{owner}/{repo}", {
            owner: username,
            repo: repo
        });

        return repo_info;
    } catch (error) { 
        //console.error(`Failed to get repo info for ${username}/${repo}`);
        if(logLevel == 2){
            fs.appendFile(logFilePath, `Failed to get repo info for ${username}/${repo}\n`, (err)=>{});
        }
    }
}

async function fetchRepoContributors(username: string, repo: string): Promise<number>{ 
    try {
        const repo_contributors = await octokit.paginate(`GET /repos/${username}/${repo}/contributors`, {
            per_page: 100,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
              }

        });
        
        const numberOfContributors = repo_contributors.length;
        return calcuBusFactor(numberOfContributors);
        
    
    } catch (error) { 
        //console.error(`Failed to get repo contributors for ${username}/${repo} due to: `, error);
        if(logLevel == 2){
            fs.appendFile(logFilePath, `Failed to get repo contributors for ${username}/${repo}\n`, (err)=>{});
        }
        return 0; 
    }
}

async function fetchRepoLicense(username: string, repo: string): Promise<number> { 
    //let licenseScore = 0; // define licenseScore here
    try { 
        const response = await octokit.request("GET /repos/{owner}/{repo}/license", {
            owner: username,
            repo: repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
              }
        });

        if((response.data.license?.key && (response.data.license?.key != "other"))) {
            
            return calcLicenseScore(response.data.license.name);
        } else { 
            //console.error(`No license found for ${username}/${repo}`);
            if(logLevel == 2){
                fs.appendFile(logFilePath, `No license found for ${username}/${repo}\r\nEither License not compatible with LGPLv2.1, or was not found in repo's license section.\n`, (err)=>{});
            }
            return 0;
        }
    } catch (error) { 
        //console.error(`Failed to get repo license for ${username}/${repo}`);
        if(logLevel == 2){
            fs.appendFile(logFilePath, `Failed to get repo license for ${username}/${repo} from API\n`, (err)=>{});
        }
        return 0;  
    }
    
}

async function fetchRepoReadme(username: string, repo: string): Promise <number> {
    try {
        const repo_readme = await octokit.request("GET /repos/{owner}/{repo}/readme", {
            owner: username,
            repo: repo,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
              }
        });
        
        

        const readme = Buffer.from(repo_readme.data.content, 'base64').toString('utf8'); // convert to utf8 string 
        const test = readme.length; // test to see if readme is empty
        const size_kb = (test / 1024).toFixed(2); // convert to kb
        const size_kb_int = parseInt(size_kb); // convert to int
        
        if (test === 0) {
            //console.error(`Readme for ${username}/${repo}: No readme found`);
            if(logLevel == 2){
                fs.appendFile(logFilePath, `Readme for ${username}/${repo}: No readme found\n`, (err)=>{});
            }
        }
        return calcRampUpScore(size_kb_int); // calculate rampup time
        
    } catch (error) {
        //console.error(`Failed to get repo readme for ${username}/${repo}`);
        if(logLevel == 2){
            fs.appendFile(logFilePath, `Failed to get repo readme for ${username}/${repo}\n`, (err)=>{});
        }
        return 0; 
    }
}


//function for getting all typescript and javascript files from a repo
// function getRepoFiles(username: string, repo: string) {

interface RepoFile {
    name: string;
}

async function fetchTsAndJsFiles(username: string, repo: string)  {
    // not gonna worry about overwriting files, we just need a decent amount to lint 
    try {

        const limitFiles = 25000; // changing this will limit how many files we get from a repo
        let charsAccumulated = 0; // keep track of characters accumulated
        let filesCounted = 0; // files counted
        // needs to handle sha thats not master branch
        //https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28#get-a-tree
        const repoInfo = await fetchRepoInfo(username, repo);
        const defaultBranch = repoInfo?.data?.default_branch;

        if (!defaultBranch) {
            //console.error(`Failed to fetch default branch for ${username}/${repo}`);
            if(logLevel == 2){
                fs.appendFile(logFilePath, `Failed to fetch default branch for ${username}/${repo}\n`, (err)=>{});
            }
            return;
        }
        

        const response = await octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
            owner: username,
            repo: repo,
            tree_sha: defaultBranch,
            recursive: "1",
            headers: {
                'X-GitHub-Api-Version': '2022-11-28'
            }
        });

        

        // only grab ts and js files
        const tsAndJsFiles = response.data.tree.filter(file => {
            const eslintFiles = [
                '.eslintrc', 
                '.eslintrc.js', 
                '.eslintrc.json', 
                '.eslintrc.yaml', 
                '.eslintrc.yml', 
                '.eslintignore',
                '.commitlintrc.js'
            ];
            if (eslintFiles.includes(file.path?.split('/').pop() || '')) return false; // skip eslint files
            return (file.type === "blob" && file.path && (file.path.endsWith(".ts") || file.path.endsWith(".js")));
        });

        const fileCount = tsAndJsFiles.length;
        

        // create directory for repo
        const dirPath = `./temp_linter_test/${repo}`;
        createLintDirs(username, repo);

        for (const file of tsAndJsFiles) {
            
            if (file.type === "blob" || file.type === "file") {
                const fileResponse = await octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                    owner: username,
                    repo: repo,
                    path: file.path ?? '',
                    headers: {
                        'X-GitHub-Api-Version': '2022-11-28'
                    }
                });

                

                if ('content' in fileResponse.data) {
                    const fileContent = fileResponse.data.content;
                    const fileContentDecoded = Buffer.from(fileContent, 'base64').toString('utf8');
                    const length = fileContentDecoded.length;
                    charsAccumulated += length;
                    if (length === 0 || length < 1000) {
                        continue; // skip empty files and files less than 100 characters
                    }
                    const fileName = file.path?.split('/').pop();
                    if (!fileName) {
                        //console.error(`Failed to get file name for ${username}/${repo}/${file.path}`);
                        if(logLevel == 2){
                            fs.appendFile(logFilePath, `Failed to get file name for ${username}/${repo}/${file.path}\n`, (err)=>{});
                        }
                        continue;
                    }
                    
                    fs.writeFileSync(`${dirPath}/${fileName}`, fileContentDecoded);
                    filesCounted++;
                    if (charsAccumulated > limitFiles) {
                        break;
                    }
                } else {
                    //console.error(`Failed to get file content for ${username}/${repo}/${file.path}`);
                    if(logLevel == 2){
                        fs.appendFile(logFilePath, `Failed to get file content for ${username}/${repo}/${file.path}\n`, (err)=>{});
                    }
                }
            }
        }
        return filesCounted;
    } catch (error) {
        //console.error(`Failed to fetch TS and JS files for ${username}/${repo}: ${error}`);
        if(logLevel == 2){
            fs.appendFile(logFilePath, `Failed to fetch TS and JS files for ${username}/${repo}\n`, (err)=>{});
        }
    }

}

async function createLintDirs(username: string, repo: string) {
    const appendRepo = `/${repo}`;
    const subDir = `./temp_linter_test${appendRepo}`;
    ensureDirectoryExistence(subDir);
    const esLintconfig = `/* eslint-env node */
module.exports = {
    extends: ['eslint:recommended'],
    "parserOptions": {
        "ecmaVersion": 5,
    },
    "overrides": [
        {
            "files": ["*.ts", "*.tsx"],
            "parser": "@typescript-eslint/parser",
            "plugins": ['@typescript-eslint'],
            "extends": [
                "plugin:@typescript-eslint/recommended",
            ],
        }
    ],
    root: true,
};
    `;
    const config = esLintconfig.trim(); // remove whitespace
    fs.writeFileSync(`${subDir}/.eslintrc.cjs`, config);
}

async function fetchLintOutput(username: string, repo: string): Promise<number> {
    const subDir = `./temp_linter_test/${repo}`;
    try {
        let fileCount = await fetchTsAndJsFiles(username, repo);
        if (!fileCount) {
            fileCount = 0;
            //console.error(`No TS or JS files found for ${username}/${repo}`);
            if(logLevel == 2){
                fs.appendFile(logFilePath, `No TS or JS files found for ${username}/${repo}\n`, (err)=>{});
            }
            process.exit(1);
        }
        await runEslint(subDir);
        if (!fs.existsSync(`${subDir}/result.json`)) {
            
            //correctness = 1; // if we dont have a result.json file, we will assume the code is correct
            return calcCorrectnessScore(0,fileCount);
        
        }
        const {errors} = getErrorAndWarningCount(`${subDir}/result.json`);
        return calcCorrectnessScore(errors,fileCount);
        

    } catch (error) {
        //console.error(`Failed to get lint output for ${username}/${repo}: ${error}`);
        if(logLevel == 2){
            fs.appendFile(logFilePath, `Failed to get lint output for ${username}/${repo}\n`, (err)=>{});
        }
        return 0;
    }
}

function getErrorAndWarningCount(filepath: fs.PathOrFileDescriptor) {
    const file = fs.readFileSync(filepath, 'utf8');
    const lines = file.trim().split('\n');
    for (let i = lines.length - 1; i >= 0; i--) {
        const line = lines[i];
        if (line.startsWith('✖')) {
            const errorMatch = line.match(/(\d+) error/);
            const errors = errorMatch ? parseInt(errorMatch[1],10) : 0;
            return {errors};
        }
    }
    return {errors: 0};

}


async function fetchRepoIssues(username: string, repo: string) {

    try {
        const timeDifference: number[] = []; //list to keep track of time differences for avg
        //var openIssueCnt = 0;
        const response = await octokit.request("GET /repos/{owner}/{repo}/issues", {
            owner: username,
            repo: repo,
            state: "all", // Fetch both open and closed issues
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });
        
        if (response.data.length === 0) {
            //console.error(`No issues found for ${username}/${repo}`);
            if (logLevel == 2) {
                fs.appendFile(logFilePath, `No issues found for ${username}/${repo}\n`, (err)=>{});
            }
            return 0;
        }

        response.data.forEach((issue) => {
            const createdAt = new Date(issue.created_at);
            var closedAt;
            if (issue.closed_at) {
                closedAt = new Date(issue.closed_at);
                var difference = closedAt.valueOf() - createdAt.valueOf();
                timeDifference.push(difference);
            }
            else {
                closedAt = null;
            }
        });  
        return calcRespMaintScore(timeDifference, username, repo);
    } catch (error) {
        //console.error(`Failed to get issues for ${username}/${repo}`);
        if(logLevel == 2){
            fs.appendFile(logFilePath, `Failed to get issues for ${username}/${repo}\n`, (err)=>{});
        }
        return 0;
    }
}

interface RepoData {
    URL: string;
    NET_SCORE: number;
    RAMP_UP_SCORE: number;
    CORRECTNESS_SCORE: number;
    BUS_FACTOR_SCORE: number;
    LICENSE_SCORE: number;
    RESPONSIVE_MAINTAINER_SCORE: number;
}




async function outputResults(username: string, repo: string, busFactor: number, rampup: number, license: number, correctness: number, maintainer: number, score: number) {
    const url = `https://github.com/${username}/${repo}`;
    
    
    const repoData: RepoData = {
        URL: url,
        NET_SCORE: parseFloat(score.toFixed(5)),
        RAMP_UP_SCORE: parseFloat(rampup.toFixed(5)),
        CORRECTNESS_SCORE: parseFloat(correctness.toFixed(5)),
        BUS_FACTOR_SCORE: parseFloat(busFactor.toFixed(5)),
        LICENSE_SCORE: license,
        RESPONSIVE_MAINTAINER_SCORE: parseFloat(maintainer.toFixed(5)),
    };
    console.log(JSON.stringify(repoData));
    if(logLevel >= 1){
        fs.appendFileSync(logFilePath, JSON.stringify(repoData) + "\n");
    }
}


async function get_metric_info(gitDetails: { username: string, repo: string }[]): Promise<void> {
    for (let i = 0; i < gitDetails.length; i++) {
        const gitInfo = gitDetails[i];
        try {
            //console.log(`Getting Metric info for ${gitInfo.username}/${gitInfo.repo}`);
            //await fetchRepoInfo(gitInfo.username, gitInfo.repo);
            await createLintDirs(gitInfo.username, gitInfo.repo);
            const busFactor = await fetchRepoContributors(gitInfo.username, gitInfo.repo);
            const license = await fetchRepoLicense(gitInfo.username, gitInfo.repo); 
            const rampup = await fetchRepoReadme(gitInfo.username, gitInfo.repo);
            const correctness = await fetchLintOutput(gitInfo.username, gitInfo.repo);
            const maintainer = await fetchRepoIssues(gitInfo.username, gitInfo.repo);
            let score = await calcTotalScore(busFactor, rampup, license, correctness, maintainer);
            outputResults(gitInfo.username, gitInfo.repo, busFactor, rampup, license, correctness, maintainer, score);
            //console.log(`~~~~~~~~~~~~~~~~\n`);
          
        } catch (error) {
            //console.error(`Failed to get Metric info for ${gitInfo.username}/${gitInfo.repo}`);
            if(logLevel == 2){
                fs.appendFile(logFilePath, `Failed to get Metric info for ${gitInfo.username}/${gitInfo.repo}\n`, (err)=>{});
            }
        }
    }

    

}





//////////////////////////////////////////////////////////////////////
// now actual metric score calculations

function calcuBusFactor(x: number): number {
    const result = (Math.pow((Math.log(x + 1) / (Math.log(1500+1))), 1.22));
    //console.log(`Bus Factor: ${result}`);
    return result;
  }


function calcRampUpScore(x: number): number {
    const result = (1 - (Math.pow((Math.log(x + 1) / (Math.log(105906+1))), 1.22)));
    //console.log(`Ramp Up: ${result}`);
    return result;
}

function calcLicenseScore(x: string): number { 
    let licenseScore = 0; 
    if (x.includes(apache) || x.includes(mit) || x.includes(gpl) || x.includes(bsd)) {
        licenseScore = 1;
    } else { 
        licenseScore = 0;
    }
    //console.log(`License: ${licenseScore}`);
    return licenseScore;
}

function calcCorrectnessScore(errors: number, filecount: number) {

    // lets get the errors/warnings per file
    // we really only care about errors
 
    const errorsPerFile = errors / filecount;

    let scaledError = 0;
    let correctnessScore = 0;  
    
    if (errorsPerFile > 1 && errorsPerFile < 10) { 
        scaledError = errorsPerFile / 10;
    } else if (errorsPerFile > 10 && errorsPerFile < 100) {
        scaledError = errorsPerFile / 100;
    } else if (errorsPerFile > 100) { // if we have 100 errors per file this is not good 
        scaledError = 1; 
    }

    
    if (scaledError === 1) { // we got way too many errors per file, cannot be a good file
        correctnessScore = 0;
    }  else {
        correctnessScore = (1 - (scaledError));
    }
   
   //console.log(`Correctness: ${correctnessScore}`);
    return correctnessScore;
}


function calcRespMaintScore(timeDifference: number[], username: string, repo: string) {
    const sum = timeDifference.reduce((acc, value) => acc + value, 0);
    const avg = sum / timeDifference.length;
    let maintainer = (1 - (avg / (86400000 * 30)));
    if (maintainer < 0) { // if average response is greater than a month 
        maintainer = 0;
    } else {
        maintainer = (1 - (avg / (86400000 * 30)));
    }

    //console.log(`Responsive Maintainer: ${maintainer}`);
    
    return maintainer;
}

async function calcTotalScore(busFactor: number, rampup: number, license: number, correctness: number, maintainer: number) {
    /*
    Sarah highest priority is is not enough maintainers, we tie this into the responsive maintainer score
    responsive ^
    bus factor
        important as we dont want package to die when one person leaves
    ramp up
        she explicitly wants a good ramp up score so engineers can work with the package easier
    */ 
    const busWeight = 0.10;
    const rampupWeight = 0.20;
    const respMaintWeight = 0.30;
    const correctnessWeight = 0.40;
    const busScore = busFactor * busWeight;
    const rampupScore = rampup * rampupWeight;
    const respMaintScore = maintainer * respMaintWeight;
    const correctnessScore = correctness * correctnessWeight;
    const score = license*(busScore + rampupScore + respMaintScore + correctnessScore);
    //console.log(`Total Score: ${score.toFixed(5)}`); // can allow more or less decimal, five for now
    return score;
}

//////////////////////////////////////////////////////////////////////

async function main() { 

   

    if (fs.existsSync(logFilePath)) { 
        fs.unlinkSync(logFilePath); // delete log file
    }

    ensureDirectoryExistence('./temp_linter_test'); // make temp directory for linter test files
    ensureDirectoryExistence('./temp_npm_json'); // make temp directory for npm json files

    // user tokens are limited to 5000 requests per hour, so we need to limit the amount of requests we make
    // we will make 1 request per second
    const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
    await delay(1000); // wait 1 second


    if (arg == "install") {
        for(const pkg of dependencies) {
            try{
                execSync(`npm install ${pkg}`);
            } catch {
                //console.error(`Error installing dependency ${pkg}`);
                if(logLevel == 2){
                    fs.appendFile(logFilePath, `Error installing dependency ${pkg}\n`, (err)=>{});
                }
                process.exit(1);
            }

        }

        console.log(`${dependencies.length} dependencies installed...\n`);
        process.exit(0);
    } else if (arg == "test") {
        console.log("Run test suite...\n");
        process.exit(0);

    
    } else if (/\.txt$/.test(arg)) {

        const filename = arg;
        const urls = url_list(filename); // grab urls from file. 
        if (urls.length === 0) {
            //console.error("No URLS found");
            if (logLevel == 2) {
                fs.appendFile(logFilePath, `No URLS found\n`, (err)=>{});
            }
            process.exit(1); 
        }
        urls.forEach(url => {
            const npmPackageName = get_npm_package_name(url); // get package name 
            const gitInfo = get_github_info(url); // get github info
            if (npmPackageName) { // since they return the package name or null, we can check for null
                npmPkgName.push(npmPackageName) // push to package name array
            } else if (gitInfo) {
                gitDetails.push(gitInfo); // push to github details array
            } else {
                //console.error(`Error, invalid url: ${url}`); // non git or npm url
                if(logLevel == 2){
                    fs.appendFile(logFilePath, `Error, invalid url: ${url}\n`, (err)=>{});
                }
            }
        }); 

        await get_npm_package_json(npmPkgName);
        try {
            execSync(`curl -f -H "Authorization: token ${gitHubToken}" https://api.github.com/user/repos 2>/dev/null`);
        } catch (error) {
            console.error(`Invalid GitHub token: ${gitHubToken}`);
            if(logLevel == 2){
                fs.appendFile(logFilePath, `Invalid GitHub token: ${gitHubToken}\n`, (err)=>{});
            }
            
        }
        await get_metric_info(gitDetails);
        fs.rmdirSync('./temp_linter_test', { recursive: true });
        fs.rmdirSync('./temp_npm_json', { recursive: true });

        process.exit(0);

    } else {
        console.log("Invalid command...\n")
        process.exit(1)
    }
}

main();
