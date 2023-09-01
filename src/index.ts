// Octokit used for GitHub token interactions
import { Octokit } from "@octokit/rest";
import { fetch_package_metadata } from "./fetch_package_metadata";

// You need to create an access token on GitHub and put it here
const personalAccessToken = "YOUR_ACCESS_TOKEN";

// chatgpt may or may not have generated the rest of this
const octokit = new Octokit({
  auth: personalAccessToken,
});

async function listUserRepos() {
  try {
    const response = await octokit.repos.listForAuthenticatedUser();
    console.log(response.data);
  } catch (error) {
    console.error("Error:", error);
  }
}

listUserRepos();

// 