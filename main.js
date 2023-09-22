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
var npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
var gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
var arg = process.argv[2]; // this is the url(s).txt arguement passed to the js executable
var npmPkgName = []; // setup array for package names
var gitDetails = []; // setup array for git user/repo name 
function ensureDirectoryExistence(directory) {
    if (!fs.existsSync(directory)) {
        fs.mkdirSync(directory, { recursive: true });
    }
}
// octokit setup
var octokit = new octokit_1.Octokit({
    auth: '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',
    userAgent: 'pkg-manager/v1.0.0'
});
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
// gets npm package names
// returns package name
// returns null if not found
// npm package names are found in the url after /package/
// example: https://www.npmjs.com/package/express
var get_npm_package_name = function (npmUrl) {
    var npm_match = npmUrl.match(npmRegex);
    if (npm_match) { // if url is found with proper regex (package identifier)
        return npm_match[1]; // return this package name
    }
    return null;
};
// gets github username and repo
// returns object with username and repo
// returns null if not found
// example: https://github.com/nullivex/nodist
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
ensureDirectoryExistence('./temp_npm_json'); // make temp directory for npm json files
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
                    console.log(gitUrl);
                    //return github url
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
                    return [3 /*break*/, 3];
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
        var repo_contributors, numberOfContributors, busFactor, error_3;
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
                    busFactor = calculateBusFactor(numberOfContributors);
                    console.log("Bus Factor for ".concat(username, "/").concat(repo, ": ").concat(busFactor.toFixed(5)));
                    return [3 /*break*/, 3];
                case 2:
                    error_3 = _a.sent();
                    console.error("Failed to get repo collaborators for ".concat(username, "/").concat(repo, " due to: "), error_3.message);
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoLicense(username, repo) {
    var _a, _b;
    return __awaiter(this, void 0, void 0, function () {
        var repo_license, error_4;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/license", {
                            owner: username,
                            repo: repo,
                            headers: {
                                'X-GitHub-Api-Version': '2022-11-28'
                            }
                        })];
                case 1:
                    repo_license = _c.sent();
                    console.log("License for ".concat(username, "/").concat(repo, ": ").concat((_b = (_a = repo_license.data.license) === null || _a === void 0 ? void 0 : _a.name) !== null && _b !== void 0 ? _b : 'Unknown'));
                    return [3 /*break*/, 3];
                case 2:
                    error_4 = _c.sent();
                    console.error("Failed to get repo license for ".concat(username, "/").concat(repo));
                    return [3 /*break*/, 3];
                case 3: return [2 /*return*/];
            }
        });
    });
}
function fetchRepoReadme(username, repo) {
    return __awaiter(this, void 0, void 0, function () {
        var repo_readme, readme, test, error_5;
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
                    if (test === 0) {
                        console.log("Readme for ".concat(username, "/").concat(repo, ": No readme found"));
                    }
                    console.log(test);
                    console.log("Readme for ".concat(username, "/").concat(repo, ": ").concat(readme));
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
function get_git_info(gitDetails) {
    return __awaiter(this, void 0, void 0, function () {
        var i, gitInfo, error_6;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    i = 0;
                    _a.label = 1;
                case 1:
                    if (!(i < gitDetails.length)) return [3 /*break*/, 9];
                    gitInfo = gitDetails[i];
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 7, , 8]);
                    return [4 /*yield*/, fetchRepoInfo(gitInfo.username, gitInfo.repo)];
                case 3:
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
                    return [3 /*break*/, 8];
                case 7:
                    error_6 = _a.sent();
                    console.error("Failed to get Metric info for ".concat(gitInfo.username, "/").concat(gitInfo.repo));
                    return [3 /*break*/, 8];
                case 8:
                    i++;
                    return [3 /*break*/, 1];
                case 9: return [2 /*return*/];
            }
        });
    });
}
//////////////////////////////////////////////////////////////////////
// now actual metric score calculations
function calculateBusFactor(x) {
    var result = Math.pow((Math.log(x + 1) / (Math.log(1500) + 1)), 1.22);
    return result;
}
//////////////////////////////////////////////////////////////////////
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var filename, urls;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    if (!(arg == "install")) return [3 /*break*/, 1];
                    console.log("Install the packages here...\n"); // probably just exit
                    process.exit(0);
                    return [3 /*break*/, 6];
                case 1:
                    if (!(arg == "test")) return [3 /*break*/, 2];
                    console.log("Run test suite...\n");
                    process.exit(0);
                    return [3 /*break*/, 6];
                case 2:
                    if (!(arg == "test.txt")) return [3 /*break*/, 5];
                    filename = arg;
                    urls = url_list(filename);
                    if (urls.length === 0) {
                        console.log("No URLS found");
                        process.exit(1);
                    }
                    urls.forEach(function (url) {
                        var npmPackageName = get_npm_package_name(url); // get package name 
                        var gitInfo = get_github_info(url); // get github info
                        if (npmPackageName) {
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
                case 3:
                    _a.sent();
                    return [4 /*yield*/, get_git_info(gitDetails)];
                case 4:
                    _a.sent();
                    process.exit(0);
                    return [3 /*break*/, 6];
                case 5:
                    console.log("Invalid command...\n");
                    process.exit(1);
                    _a.label = 6;
                case 6: return [2 /*return*/];
            }
        });
    });
}
main();
