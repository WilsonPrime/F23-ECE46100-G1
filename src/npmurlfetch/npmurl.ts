// Purpose: Read a list of NPM Urls and fetch the JSON data from each URL.

//import setup for task
import * as fs from 'fs';
import * as https from 'https';

let regex = /https:\/\/www\.npmjs\.com\/package\/([\w-]+)/i; // regex to check if url is valid


// read urls from file 
const url_list = (filename:string): string[] => {
    return fs.readFileSync(filename, 'utf8').split(/\r?\n/).filter(Boolean);
}

// match url with regex and return registry url to pull json data
const get_package_name = (npmUrl: string): string | null => {
    const match = npmUrl.match(regex);
    if (match) { // if url is found with proper regex (package identifier)
        return `https://registry.npmjs.org/${match[1]}`;
    }
    return null // if url is invalid;
}

// create array of urls (.txt in project folder)
const urls = url_list('url.txt'); // creates array of urls accessed via urls[0], urls[1], etc.

// fetch json data from each url and print to console 
let i = 0; 
for (let url of urls) {
    const npmLink = get_package_name(url);
    if (npmLink) {
        https.get(npmLink, (res) => {
            let body = "";
            res.on("data", (chunk) => {
                body += chunk;
            });
    
            res.on("end", () => {
                try {
                    let json = JSON.parse(body);
                    //console.log("Start of JSON data:\n");
                    fs.writeFile(`npm_url[${i}].json`, JSON.stringify(json, null, 4), (err) => {
                        if (err) throw err;
                        console.log(`File npm_url[${i}].json has been saved!`);
                    }); 
                    
                    //console.log(json);
                    //console.log("End of JSON data");
                    i++; 
    
                } catch (error) {
                    console.error((error as Error).message); 
    
                };
        });
    }).on("error", (error) => {
        console.error((error as Error).message); 
        }); 
    } else {
        console.error(`Invalid URL: ${url}`);
    }
    
} 