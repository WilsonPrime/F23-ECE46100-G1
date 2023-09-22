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
    userAgent: 'pkg-manager/v1.0.0'
});
// test octokit request
function fetchIssues() {
    return __awaiter(this, void 0, void 0, function () {
        var response;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, octokit.request("GET /repos/{owner}/{repo}/issues", {
                        owner: "octocat",
                        repo: "Spoon-Knife",
                    })];
                case 1:
                    response = _a.sent();
                    console.log(response);
                    return [2 /*return*/];
            }
        });
    });
}
fetchIssues();
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
        process.exit(0);
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
// we could probably stick the below into a function, but for now it works :3 
// this section will take in the urls.txt arguement from the command line and parse it for npm package names and github user/repo names
if (!arg || typeof arg !== 'string') {
    console.log("No URL argument provided"); // probably just exit
    process.exit(1);
}
if (arg.length > 2) { // string at least have .txt, if we dont see more than 2 characters we havent gotten a proper file name
    var filename = arg;
    var urls = url_list(filename); // grab urls from file. 
    if (urls.length === 0) {
        console.log("No URLS found");
        process.exit(0);
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
}
else {
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
