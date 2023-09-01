// src/index.ts
import { Octokit } from "@octokit/rest";

// Replace with your GitHub Personal Access Token
const personalAccessToken = "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";

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