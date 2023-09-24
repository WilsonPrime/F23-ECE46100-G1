"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var octokit_1 = require("octokit"); // Octokit v17
var fs = require("fs"); // use filesystem
var child_process_1 = require("child_process"); // to execute shell cmds
var exec = require('child_process').exec; // to execute shell cmds
var npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
var gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
var arg = process.argv[2]; // this is the url(s).txt arguement passed to the js executable
var npmPkgName = []; // setup array for package names
var gitDetails = []; // setup array for git user/repo name 
var dependencies = ["octokit", "--save-dev @typescript-eslint/parser @typescript-eslint/eslint-plugin eslint typescript"]; // setup array for dependencies
var gitUrls = []; // setup array for git urls
// could probably put in array but,"kiss"
var mit = "MIT";
var apache = "Apache";
var gpl = "GPL";
var bsd = "BSD";
var rampup = 0;
var license = 0;
var correctness = 0;
var maintainer = 0;
var busFactor = 0;
var score = 0;
//  we will destroy this directory later
function ensureDirectoryExistence(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}
// octokit setup
var octokit = new octokit_1.Octokit({
    auth: '',
    userAgent: 'pkg-manager/v1.0.0'
});
// run es lint
function runEslint(directory) {
    return new Promise(function (resolve, reject) {
        exec("npx eslint ".concat(directory, " -o ").concat(directory, "/result.json"), { encoding: 'utf8' }, function (error, stdout, stderr) {
            if (error) {
                // Check if the error is due to linting issues
                if (error.code === 1) {
                    resolve(stdout); // if error is due to linting, it's not a "real" error for us
                }
                else {
                    reject(error);
                }
            }
            else {
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
var url_list = function (filename) {
    try {
        return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean);
    }
    catch (error) {
        console.error("File does not exist");
        process.exit(1);
    }
};
/*
 gets npm package names
 returns package name
 npm package names are found in the url after /package/
 example: https://www.npmjs.com/package/express
*/
var get_npm_package_name = function (npmUrl) {
    var npm_match = npmUrl.match(npmRegex);
    if (npm_match) { // if url is found with proper regex (package identifier)
        return npm_match[1]; // return this package name
    }
    return null;
};
/*
 gets github username and repo
 returns object with username and repo
 example: https://github.com/nullivex/nodist
*/
var get_github_info = function (gitUrl) {
    var gitMatch = gitUrl.match(gitRegex);
    if (gitMatch) {
        return {
            username: gitMatch[1],
            repo: gitMatch[2]
        };
    }
    return null;
};
////////////////////////////////////////////////////////////////////////////////
// now we want to get the package.json file from the npm package name and the github repo/username
// npmPkgName and gitDetails are the arrays we will use to get the package.json files, they hold:
// the package names and github user/repo names
var readJSON = function (jsonPath, callback) {
    fs.readFile(jsonPath, 'utf-8', function (err, data) {
        if (err) {
            console.error('Error reading file:', err);
            callback(null); // Pass null to the callback to indicate an error
            return;
        }
        try {
            var jsonData = JSON.parse(data);
            callback(jsonData); // Pass the parsed JSON data to the callback
        }
        catch (parseError) {
            console.error('Error parsing JSON:', parseError);
            callback(null); // Pass null to the callback to indicate an error
        }
    });
};
function check_npm_for_open_source(filePath) {
    return new Promise(function (resolve) {
        readJSON(filePath, function (jsonData) {
            if (jsonData !== null) {
                var repository = jsonData.repository;
                if (repository.type == 'git') {
                    var gitUrl = repository.url;
                    if (gitUrl.startsWith('git+ssh://git@')) {
                        // Convert SSH URL to HTTPS URL
                        gitUrl = gitUrl.replace('git+ssh://git@', 'https://');
                    }
                    else if (gitUrl.startsWith('git+https://')) {
                        gitUrl = gitUrl.replace('git+https://', 'https://');
                    }
                    if (gitUrl.endsWith('.git')) {
                        gitUrl = gitUrl.substring(0, gitUrl.length - 4);
                    }
                    //return github url
                    gitUrls.push(gitUrl);
                    resolve(gitUrl);
                }
                else {
                    console.log('No git repository found.');
                    resolve("Invalid");
                }
            }
            else {
                console.error('Failed to read or parse JSON.');
                resolve(null);
            }
        });
    });
}
function get_npm_package_json(pkgName) {
    return __awaiter(this, void 0, void 0, function () {
        var i, pkg, output, file, gitURLfromNPM, gitInfo, error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < pkgName.length)) return [3 /*break*/, 6];
                    pkg = pkgName[i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 4, , 5]);
                    output = (0, child_process_1.execSync)("npm view ".concat(pkg, " --json"), { encoding: 'utf8' });
                    fs.writeFileSync("./temp_npm_json/".concat(pkg, "_info.json"), output); // write json to file
                    file = "./temp_npm_json/".concat(pkg, "_info.json");
                    return [4 /*yield*/, check_npm_for_open_source(file)];
                case 3:
                    gitURLfromNPM = _a.sent();
                    if (gitURLfromNPM) {
                        gitInfo = get_github_info(gitURLfromNPM);
                        if (gitInfo) {
                            gitDetails.push(gitInfo); // push to github details array
                        }
                    }
                    return [3 /*break*/, 5];
                case 4:
                    error_1 = _a.sent();
                    console.error("Failed to get npm info for package: ".concat(pkg));
                    return [3 /*break*/, 5];
                case 5:
                    i++;
                    return [3 /*break*/, 1];
                case 6: return [2 /*return*/];
            }
        });
    });
}
//////////////////////////////////////////////////////////////////////
// here we are getting everything we need for our metrics from the api  (contributors, license, readme, issues, etc)
function fetchRepoInfo(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var repo_info, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}", {
                            owner: username,
                            repo: repo
                        })];
                case 1:
                    repo_info = _a.sent();
                    return [2 /*return*/, repo_info];
                case 2:
                    error_2 = _a.sent();
                    console.error("Failed to get repo info for ".concat(username, "/").concat(repo));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoContributors(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var repo_contributors, numberOfContributors, error_3;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, octokit.paginate("GET /repos/".concat(username, "/").concat(repo, "/contributors"), {
                            per_page: 100,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 1:
                    repo_contributors = _a.sent();
                    numberOfContributors = repo_contributors.length;
                    busFactor = calcuBusFactor(numberOfContributors);
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Failed to get repo contributors for ".concat(username, "/").concat(repo, " due to: "), error_3);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoLicense(username, repo) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var licenseScore, response, error_4;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    licenseScore = 0;
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/license", {
                            owner: username,
                            repo: repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 1:
                    response = _c.sent();
                    license = calcLicenseScore((_b = (_a = response.data.license) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : "");
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _c.sent();
                    console.error("Failed to get repo license for ".concat(username, "/").concat(repo));
                    license = 0;
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoReadme(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var repo_readme, readme, test, size_kb, size_kb_int, error_5;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/readme", {
                            owner: username,
                            repo: repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 1:
                    repo_readme = _a.sent();
                    readme = Buffer.from(repo_readme.data.content, 'base64').toString('utf8');
                    test = readme.length;
                    size_kb = (test / 1024).toFixed(2);
                    size_kb_int = parseInt(size_kb);
                    if (test === 0) {
                        console.log("Readme for ".concat(username, "/").concat(repo, ": No readme found"));
                    }
                    rampup = calcRampUpScore(size_kb_int); // calculate rampup time
                    return [3 /*break*/, 3];
                case 2:
                    error_5 = _a.sent();
                    console.error("Failed to get repo readme for ".concat(username, "/").concat(repo));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchTsAndJsFiles(username, repo) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function () {
        var limitFiles, charsAccumulated, filesCounted, repoInfo, defaultBranch, response, tsAndJsFiles, fileCount, dirPath, _i, tsAndJsFiles_1, file, fileResponse, fileContent, fileContentDecoded, length_1, fileName, error_6;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    _d.trys.push([0, 7, , 8]);
                    limitFiles = 25000;
                    charsAccumulated = 0;
                    filesCounted = 0;
                    return [4 /*yield*/, fetchRepoInfo(username, repo)];
                case 1:
                    repoInfo = _d.sent();
                    defaultBranch = (_a = repoInfo === null || repoInfo === void 0 ? void 0 : repoInfo.data) === null || _a === void 0 ? void 0 : _a.default_branch;
                    if (!defaultBranch) {
                        console.error("Failed to fetch default branch for ".concat(username, "/").concat(repo));
                        return [2 /*return*/];
                    }
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/git/trees/{tree_sha}", {
                            owner: username,
                            repo: repo,
                            tree_sha: defaultBranch,
                            recursive: "1",
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 2:
                    response = _d.sent();
                    tsAndJsFiles = response.data.tree.filter(function (file) {
                        var _a;
                        var eslintFiles = [
                            '.eslintrc',
                            '.eslintrc.js',
                            '.eslintrc.json',
                            '.eslintrc.yaml',
                            '.eslintrc.yml',
                            '.eslintignore',
                            '.commitlintrc.js'
                        ];
                        if (eslintFiles.includes(((_a = file.path) === null || _a === void 0 ? void 0 : _a.split('/').pop()) || ''))
                            return false; // skip eslint files
                        return (file.type === "blob" && file.path && (file.path.endsWith(".ts") || file.path.endsWith(".js")));
                    });
                    fileCount = tsAndJsFiles.length;
                    dirPath = "./temp_linter_test/".concat(repo);
                    createLintDirs(username, repo);
                    _i = 0, tsAndJsFiles_1 = tsAndJsFiles;
                    _d.label = 3;
                case 3:
                    if (!(_i < tsAndJsFiles_1.length)) return [3 /*break*/, 6];
                    file = tsAndJsFiles_1[_i];
                    if (!(file.type === "blob" || file.type === "file")) return [3 /*break*/, 5];
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/contents/{path}", {
                            owner: username,
                            repo: repo,
                            path: (_b = file.path) !== null && _b !== void 0 ? _b : '',
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 4:
                    fileResponse = _d.sent();
                    if ('content' in fileResponse.data) {
                        fileContent = fileResponse.data.content;
                        fileContentDecoded = Buffer.from(fileContent, 'base64').toString('utf8');
                        length_1 = fileContentDecoded.length;
                        charsAccumulated += length_1;
                        if (length_1 === 0 || length_1 < 1000) {
                            return [3 /*break*/, 5]; // skip empty files and files less than 100 characters
                        }
                        fileName = (_c = file.path) === null || _c === void 0 ? void 0 : _c.split('/').pop();
                        if (!fileName) {
                            console.error("Failed to get file name for ".concat(username, "/").concat(repo, "/").concat(file.path));
                            return [3 /*break*/, 5];
                        }
                        fs.writeFileSync("".concat(dirPath, "/").concat(fileName), fileContentDecoded);
                        filesCounted++;
                        if (charsAccumulated > limitFiles) {
                            return [3 /*break*/, 6];
                        }
                    }
                    else {
                        console.error("Failed to get file content for ".concat(username, "/").concat(repo, "/").concat(file.path));
                    }
                    _d.label = 5;
                case 5:
                    _i++;
                    return [3 /*break*/, 3];
                case 6: return [2 /*return*/, filesCounted];
                case 7:
                    error_6 = _d.sent();
                    console.error("Failed to fetch TS and JS files for ".concat(username, "/").concat(repo, ": ").concat(error_6));
                    return [3 /*break*/, 8];
                case 8: return [2 /*return*/];
            }
        });
    });
}
function createLintDirs(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var appendRepo, subDir, esLintconfig, config;
        return __generator(this, function (_a) {
            appendRepo = "/".concat(repo);
            subDir = "./temp_linter_test".concat(appendRepo);
            ensureDirectoryExistence(subDir);
            esLintconfig = "/* eslint-env node */\nmodule.exports = {\n    extends: ['eslint:recommended'],\n    \"parserOptions\": {\n        \"ecmaVersion\": 5,\n    },\n    \"overrides\": [\n        {\n            \"files\": [\"*.ts\", \"*.tsx\"],\n            \"parser\": \"@typescript-eslint/parser\",\n            \"plugins\": ['@typescript-eslint'],\n            \"extends\": [\n                \"plugin:@typescript-eslint/recommended\",\n            ],\n        }\n    ],\n    root: true,\n};\n    ";
            config = esLintconfig.trim();
            fs.writeFileSync("".concat(subDir, "/.eslintrc.cjs"), config);
            return [2 /*return*/];
        });
    });
}
function fetchLintOutput(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var subDir, fileCount, errors, error_7;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    subDir = "./temp_linter_test/".concat(repo);
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 4, , 5]);
                    return [4 /*yield*/, fetchTsAndJsFiles(username, repo)];
                case 2:
                    fileCount = _a.sent();
                    if (!fileCount) {
                        fileCount = 0;
                        console.log("No TS or JS files found for ".concat(username, "/").concat(repo));
                        process.exit(1);
                    }
                    return [4 /*yield*/, runEslint(subDir)];
                case 3:
                    _a.sent();
                    if (!fs.existsSync("".concat(subDir, "/result.json"))) {
                        //correctness = 1; // if we dont have a result.json file, we will assume the code is correct
                        correctness = calcCorrectnessScore(0, fileCount);
                        return [2 /*return*/];
                    }
                    errors = getErrorAndWarningCount("".concat(subDir, "/result.json")).errors;
                    correctness = calcCorrectnessScore(errors, fileCount);
                    return [3 /*break*/, 5];
                case 4:
                    error_7 = _a.sent();
                    console.error("Failed to get lint output for ".concat(username, "/").concat(repo, ": ").concat(error_7));
                    return [3 /*break*/, 5];
                case 5: return [2 /*return*/];
            }
        });
    });
}
function getErrorAndWarningCount(filepath) {
    var file = fs.readFileSync(filepath, 'utf8');
    var lines = file.trim().split('\n');
    for (var i = lines.length - 1; i >= 0; i--) {
        var line = lines[i];
        if (line.startsWith('✖')) {
            var errorMatch = line.match(/(\d+) error/);
            var errors = errorMatch ? parseInt(errorMatch[1], 10) : 0;
            return { errors: errors };
        }
    }
    return { errors: 0 };
}
function fetchRepoIssues(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var timeDifference_1, response, error_8;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    timeDifference_1 = [];
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/issues", {
                            owner: username,
                            repo: repo,
                            state: "all",
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28',
                            },
                        })];
                case 1:
                    response = _a.sent();
                    if (response.data.length === 0) {
                        console.log("No issues found for ".concat(username, "/").concat(repo));
                        return [2 /*return*/];
                    }
                    response.data.forEach(function (issue) {
                        var createdAt = new Date(issue.created_at);
                        var closedAt;
                        if (issue.closed_at) {
                            closedAt = new Date(issue.closed_at);
                            var difference = closedAt.valueOf() - createdAt.valueOf();
                            timeDifference_1.push(difference);
                        }
                        else {
                            closedAt = null;
                        }
                    });
                    calcRespMaintScore(timeDifference_1, username, repo);
                    return [3 /*break*/, 3];
                case 2:
                    error_8 = _a.sent();
                    console.error("Failed to get issues for ".concat(username, "/").concat(repo));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function get_metric_info(gitDetails) {
    return __awaiter(this, void 0, void 0, function () {
        var i, gitInfo, error_9;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < gitDetails.length)) return [3 /*break*/, 11];
                    gitInfo = gitDetails[i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 9, , 10]);
                    console.log("Getting Metric info for ".concat(gitInfo.username, "/").concat(gitInfo.repo));
                    //await fetchRepoInfo(gitInfo.username, gitInfo.repo);
                    return [4 /*yield*/, createLintDirs(gitInfo.username, gitInfo.repo)];
                case 3:
                    //await fetchRepoInfo(gitInfo.username, gitInfo.repo);
                    _a.sent();
                    return [4 /*yield*/, fetchRepoContributors(gitInfo.username, gitInfo.repo)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, fetchRepoLicense(gitInfo.username, gitInfo.repo)];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, fetchRepoReadme(gitInfo.username, gitInfo.repo)];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, fetchLintOutput(gitInfo.username, gitInfo.repo)];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, fetchRepoIssues(gitInfo.username, gitInfo.repo)];
                case 8:
                    _a.sent();
                    calcTotalScore(busFactor, rampup, license, correctness, maintainer);
                    console.log("~~~~~~~~~~~~~~~~\n");
                    return [3 /*break*/, 10];
                case 9:
                    error_9 = _a.sent();
                    console.error("Failed to get Metric info for ".concat(gitInfo.username, "/").concat(gitInfo.repo));
                    return [3 /*break*/, 10];
                case 10:
                    i++;
                    return [3 /*break*/, 1];
                case 11: return [2 /*return*/];
            }
        });
    });
}
//////////////////////////////////////////////////////////////////////
// now actual metric score calculations
function calcuBusFactor(x) {
    var result = (Math.pow((Math.log(x + 1) / (Math.log(1500 + 1))), 1.22));
    console.log("Bus Factor: ".concat(result));
    return result;
}
function calcRampUpScore(x) {
    var result = (1 - (Math.pow((Math.log(x + 1) / (Math.log(105906 + 1))), 1.22)));
    console.log("Ramp Up: ".concat(result));
    return result;
}
function calcLicenseScore(x) {
    var licenseScore = 0;
    if (x.includes(apache) || x.includes(mit) || x.includes(gpl) || x.includes(bsd)) {
        licenseScore = 1;
    }
    else {
        licenseScore = 0;
    }
    console.log("License: ".concat(licenseScore));
    return licenseScore;
}
function calcCorrectnessScore(errors, filecount) {
    // lets get the errors/warnings per file
    // we really only care about errors
    var errorsPerFile = errors / filecount;
    var scaledError = 0;
    var correctnessScore = 0;
    if (errorsPerFile > 1 && errorsPerFile < 10) {
        scaledError = errorsPerFile / 10;
    }
    else if (errorsPerFile > 10 && errorsPerFile < 100) {
        scaledError = errorsPerFile / 100;
    }
    else if (errorsPerFile > 100) { // if we have 100 errors per file this is not good 
        scaledError = 1;
    }
    if (scaledError === 1) { // we got way too many errors per file, cannot be a good file
        correctnessScore = 0;
    }
    else {
        correctnessScore = (1 - (scaledError));
    }
    console.log("Correctness: ".concat(correctnessScore));
    return correctnessScore;
}
function calcRespMaintScore(timeDifference, username, repo) {
    var sum = timeDifference.reduce(function (acc, value) { return acc + value; }, 0);
    var avg = sum / timeDifference.length;
    var maintainer = (1 - (avg / (86400000 * 30)));
    console.log("Responsive Maintainer: ".concat(maintainer));
    return maintainer;
}
function calcTotalScore(busFactor, rampup, license, correctness, maintainer) {
    /*
    Sarah highest priority is is not enough maintainers, we tie this into the responsive maintainer score
    responsive ^
    bus factor
        important as we dont want package to die when one person leaves
    ramp up
        she explicitly wants a good ramp up score so engineers can work with the package easier
    */
    var busWeight = 0.10;
    var rampupWeight = 0.20;
    var respMaintWeight = 0.30;
    var correctnessWeight = 0.40;
    var busScore = busFactor * busWeight;
    var rampupScore = rampup * rampupWeight;
    var respMaintScore = maintainer * respMaintWeight;
    var correctnessScore = correctness * correctnessWeight;
    var score = busScore + rampupScore + respMaintScore + correctnessScore;
    console.log("Total Score: ".concat(score));
}
/*
function outputResults(
    gitDetails: { username: string; repo: string }[],
    maintainer: number,
    busFactor: number,
    rampup: number,
    license: number,
    correctness: number,
    totalScore: number
) {
    const urls: string[] = gitDetails.map(
        (detail) => `https://github.com/${detail.username}/${detail.repo}`
    );
    
    for (let i = 0; i < urls.length; i++) {
        const repoData: RepoData = {
            URL: urls[i],
            NET_SCORE: totalScore.toFixed(5),
            RAMP_UP_SCORE: rampup.toFixed(5),
            CORRECTNESS_SCORE: correctness.toFixed(5),
            BUS_FACTOR_SCORE: busFactor.toFixed(5),
            LICENSE_SCORE: license,
            RESPONSIVE_MAINTAINER_SCORE: maintainer.toFixed(5),
        };
        console.log(JSON.stringify(repoData));
    }
    
}
*/
//////////////////////////////////////////////////////////////////////
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var delay, _i, dependencies_1, pkg, filename, urls;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    ensureDirectoryExistence('./temp_linter_test'); // make temp directory for linter test files
                    ensureDirectoryExistence('./temp_npm_json'); // make temp directory for npm json files
                    delay = function (ms) { return new Promise(function (res) { return setTimeout(res, ms); }); };
                    return [4 /*yield*/, delay(1000)];
                case 1:
                    _a.sent(); // wait 1 second
                    if (!(arg == "install")) return [3 /*break*/, 2];
                    for (_i = 0, dependencies_1 = dependencies; _i < dependencies_1.length; _i++) {
                        pkg = dependencies_1[_i];
                        try {
                            (0, child_process_1.execSync)("npm install ".concat(pkg));
                        }
                        catch (_b) {
                            console.error("Error installing dependency ".concat(pkg));
                            process.exit(1);
                        }
                    }
                    console.log("".concat(dependencies.length, " dependencies installed...\n"));
                    process.exit(0);
                    return [3 /*break*/, 7];
                case 2:
                    if (!(arg == "test")) return [3 /*break*/, 3];
                    console.log("Run test suite...\n");
                    process.exit(0);
                    return [3 /*break*/, 7];
                case 3:
                    if (!/\.txt$/.test(arg)) return [3 /*break*/, 6];
                    filename = arg;
                    urls = url_list(filename);
                    if (urls.length === 0) {
                        console.log("No URLS found");
                        process.exit(1);
                    }
                    urls.forEach(function (url) {
                        var npmPackageName = get_npm_package_name(url); // get package name 
                        var gitInfo = get_github_info(url); // get github info
                        if (npmPackageName) { // since they return the package name or null, we can check for null
                            npmPkgName.push(npmPackageName); // push to package name array
                        }
                        else if (gitInfo) {
                            gitDetails.push(gitInfo); // push to github details array
                        }
                        else {
                            console.error("Error, invalid contents of file"); // non git or npm url
                        }
                    });
                    return [4 /*yield*/, get_npm_package_json(npmPkgName)];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, get_metric_info(gitDetails)];
                case 5:
                    _a.sent();
                    process.exit(0);
                    return [3 /*break*/, 7];
                case 6:
                    console.log("Invalid command...\n");
                    process.exit(1);
                    _a.label = 7;
                case 7: return [2 /*return*/];
            }
        });
    });
}
main();
