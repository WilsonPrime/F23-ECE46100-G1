# F23-ECE46100-G1

Repo for ECE461 ACME Project Phase 1

Group 1 Members
Devon Holloway, Wilson Wong, Ben Roath, Andrew Zhang, Jaden Guidry

To install dependencies, use the bash script "run" with install as the first argument to install all required dependencies. The list of dependency install commands is hosted as an array near the top of main.ts, which is where any extra dependencies should be added. This uses child_process execSync to run "npm install" with all dependency package names and conditional arguments, or exits the process with code 1 if errors occur.

use ./run install in a terminal to execute this branch

Once all dependencies are installed, URLs can be fed via .txt files as arguments to execute the data retrieving and calculating metric scores. This works by first extracting the list of urls from the text file with the url_list function, and then looping through them all to find which ones are for npm packages and which ones are for github packages using npmPackageName and gitInfo respectively, and saves the info for each to respective arrays. All npm packages are then used to retrive their respective json files, and parsed to verify a valid open source github repository. The branch then checks for a valid github token, which should be located within the .env file on a local device, before moving into the metric calculations for each github repo.

The metric calculation is done using the get_metric_info function, which first creates directories for the linter files using createLintDirs for each github repo. Then for each repo, bus factor, license, ramp up, correctness, and responsiveness are all calculated with calls to fetchRepoContributors, fetchRepoLicense, fetchRepoReadme, fetchLintOutput, and fetchRepoIssues respectively. Once each of these are calculated, they are fed into calcTotalScore to properly weigh the results in accordance with the clients priorities, and then the results for each repo/username are output to stdout using outputResults. If at any point in this process an error occurs, the error is logged alongside the respective repo where the log level setting is appropriate, and the process moves on to the next repo in the list.

Breakdown of metric calculations:

Bus Factor: fetchRepoContributors does an API call with octokit to github to get the list of contributors and converts that to a passable number. With that passed into calcuBusFactor, it is sent through this formula: (Math.pow((Math.log(x + 1) / (Math.log(1500+1))), 1.22)) which gives a value normalized between 0 and 1 for the bus factor, which is then returned from fetchRepoContributors.

License: fetchRepoLicense does an API call with octokit to github to get the license data for the input repo. If a license is found, the function calls calcLicenseScore and checks the string against a list of valid licenses, including mit, apache, gpl, and bsd. If it matches one of these 4, it returns 1, otherwise it returns 0 for no valid license.

Ramp Up: fetchRepoReadme does an API call with octokit to github to get the readme, and then parses it into a workable utf8 string. From there, it grabs the length, converts it to kb, then converts that into an integer. If the length is 0 (no readme found) it logs an error, otherwise it branches into calcRampUpScore using the final integer conversion. CalcRampUpScore simply passes the input into this function: (1 - (Math.pow((Math.log(x + 1) / (Math.log(105906+1))), 1.22))), and returns that as the output to fetchRepoReadme as the ramp up score.

Correctness: fetchLintOutput initially uses fetchTsAndJsFiles to grab all files within a character limit from the repo and add it to the linter directory corresponding to that repo. Assuming files were found, EsLint is ran on the linter directory to retrieve the number of errors found and the number of files scanned. These two numbers are passed to calcCorrectnessScore where the average errors per file is calculated and normalized between 0 and 1, then returned.

Responsiveness: fetchRepoIssues does an API call with octokit to github to get the issues data. If no issues are found, 0 is returned, otherwise each issues is used to find the response time, or the difference in the open time and close time of the issue, where this difference is appended to an array of differences. This array is passed to calcRespMaintScore, where the average time difference is found. A time conversion is created, and if the average time is greater than a month the score is returned as 0, otherwise it returns a score normalized between 0 and 1.

use ./run urls.txt, where urls.txt can be any text file that contains your testing urls, to run the metric scoring branch

currently using ./run test will technically run the test branch, but it is not properly implemented with the CLI so all that happens is a print statement with console.log acknowledging it is there.

All log branches happen at log level 2, which is set in the .env file. Any errors encountered here will be printed to a log.txt file in root directory.
