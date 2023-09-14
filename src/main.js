"use strict";
/*~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/
/ NPM/GITHUB URL-to-JSON                    /
/     Program takes in text file of URLS,   /
/     we return output files of JSON data   /
/     from each npm/github url.             /
/~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~*/
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
// setup
var fs = require("fs"); // use filesystem
var child_process_1 = require("child_process"); // to execute shell cmds
var npmRegex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to get package name from npm url
var gitRegex = /https:\/\/github\.com\/([^/]+)\/([^/]+)/i; // regex to get user/repo name  from git url
var arg = process.argv[2]; // this is the url(s).txt arguement passed to the js executable
var pkgName = []; // setup array for package names
var gitDetails = []; // setup array for git user/repo name 
// sleep function to avoid rate limit
function sleep(ms) {
    return new Promise(function (resolve) { return setTimeout(resolve, ms); });
}
// read urls from file
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
var get_npm_package_name = function (npmUrl) {
    var npm_match = npmUrl.match(npmRegex);
    if (npm_match) { // if url is found with proper regex (package identifier)
        return npm_match[1]; // return this package name
    }
    return null;
};
// gets github username and repo
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
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/
// we could probably stick the below into a function, but for now it works :3 
if (!arg || typeof arg !== 'string') {
    console.log("No URL argument provided");
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
            pkgName.push(npmPackageName); // push to package name array
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
//~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~/
function get_npm_package_json(pkgName) {
    return __awaiter(this, void 0, void 0, function () {
        var i, pkg, output, error_1;
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
                    fs.writeFileSync("./".concat(pkg, "_info.json"), output); // write json to file
                    return [4 /*yield*/, sleep(2000)];
                case 3:
                    _a.sent(); // sleep to avoid rate limit
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
function get_github_package_json(gitDetails) {
    return __awaiter(this, void 0, void 0, function () {
        var _i, gitDetails_1, detail, repoURL, output, data, prettyData, error_2;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _i = 0, gitDetails_1 = gitDetails;
                    _a.label = 1;
                case 1:
                    if (!(_i < gitDetails_1.length)) return [3 /*break*/, 8];
                    detail = gitDetails_1[_i];
                    repoURL = "https://api.github.com/repos/".concat(detail.username, "/").concat(detail.repo);
                    _a.label = 2;
                case 2:
                    _a.trys.push([2, 6, , 7]);
                    return [4 /*yield*/, fetch(repoURL)];
                case 3:
                    output = _a.sent();
                    if (!output.ok) {
                        throw new Error("Error: ".concat(output.status, " ").concat(output.statusText));
                    }
                    return [4 /*yield*/, output.json()];
                case 4:
                    data = _a.sent();
                    prettyData = JSON.stringify(data, null, 4);
                    fs.writeFileSync("./".concat(detail.username, "_").concat(detail.repo, "_info.json"), prettyData); // write to file
                    return [4 /*yield*/, sleep(2000)];
                case 5:
                    _a.sent(); // sleep to avoid rate limit
                    return [3 /*break*/, 7];
                case 6:
                    error_2 = _a.sent();
                    console.error("Failed to get github info for user: ".concat(detail.username, " and repo: ").concat(detail.repo)); // throw error for now, might need to exit on error instead for no console outputs other than desired *we can ask*
                    return [3 /*break*/, 7];
                case 7:
                    _i++;
                    return [3 /*break*/, 1];
                case 8: return [2 /*return*/];
            }
        });
    });
}
get_npm_package_json(pkgName);
get_github_package_json(gitDetails);
