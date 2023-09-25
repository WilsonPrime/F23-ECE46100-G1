//imported functions
import { check_npm_for_open_source, fetchRepoInfo, fetchRepoContributors, fetchRepoLicense, fetchRepoReadme, fetchRepoIssues, 
  outputResults, createLintDirs, get_metric_info, ensureDirectoryExistence, calcTotalScore, calcRespMaintScore, calcCorrectnessScore } from '../main.js';
import * as fs from 'fs'; // Replace with the actual fs import

//handle any mock creations for test suites
// Mock the fs module to track function calls
jest.mock('fs', () => ({
  appendFile: jest.fn(),
}));

//begin test suites
describe('check_npm_for_open_source', () => {
    it('should return https link if valid github repository is present', async () => {
      const result1 = await check_npm_for_open_source('./test_files/browserify_info.json');
      expect(result1).toBe('https://github.com/browserify/browserify');
    });
  
    it('should return "Invalid" if no github repo is present', async () => {
      const result2 = await check_npm_for_open_source('./test_files/browserify_fake_type.json');
      expect(result2).toBe('Invalid');
    });
  
    it('should return null if file cannot be read', async () => {
      const result3 = await check_npm_for_open_source('./test_files/no_file');
      expect(result3).toBeNull;
    });
});

describe('fetchRepoInfo', () => {
    it('should fetch repo info successfully', async () => {
      const username = 'nullivex';
      const repo = 'nodist';

      const repoInfo = await fetchRepoInfo(username, repo);
  
      expect(repoInfo).not.toBeNull();
      expect(typeof repoInfo).toEqual('object');
    });
  
    it('should handle errors and log', async () => {
      //feed in nonexistant info so call returns error
      const username = 'invaliduser';
      const repo = 'invalidrepo';
  
      try{
        await fetchRepoInfo(username, repo);
      } catch (error: any){
        expect(fs.appendFile).toHaveBeenCalled();
      }
    });
  });

  describe('fetchRepoContributors', () => {
    it('should fetch bus factor calculation successfully', async () => {
      const username = 'nullivex';
      const repo = 'nodist';

      const busFactor = await fetchRepoContributors(username, repo);
  
      expect(busFactor).toBeLessThanOrEqual(1);
      expect(busFactor).toBeGreaterThanOrEqual(0);
    });
  
    it('should handle errors and log', async () => {
      //feed in nonexistant info so call returns error
      const username = 'invaliduser';
      const repo = 'invalidrepo';
  
      try{
        await fetchRepoContributors(username, repo);
      } catch (error: any){
        expect(fs.appendFile).toHaveBeenCalled();
      }
    });
  });

  describe('fetchRepoLicense', () => {
    it('should return 1 for valid license', async () => {
      const username = 'nullivex';
      const repo = 'nodist';

      const license = await fetchRepoLicense(username, repo);
  
      expect(license).toEqual(1);
    });

    it('should return 0 for invalid or missing license', async () => {
      const username = 'cloudinary';
      const repo = 'cloudinary_npm';

      const license = await fetchRepoLicense(username, repo);
  
      expect(license).toEqual(0);
    });
  
    it('should handle errors and log', async () => {
      //feed in nonexistant info so call returns error
      const username = 'invaliduser';
      const repo = 'invalidrepo';
  
      try{
        await fetchRepoLicense(username, repo);
      } catch (error: any){
        expect(fs.appendFile).toHaveBeenCalled();
      }
    });
  });

  describe('fetchRepoReadme', () => {
    it('should fetch bus factor calculation successfully', async () => {
      const username = 'nullivex';
      const repo = 'nodist';

      const ramp_up = await fetchRepoReadme(username, repo);
  
      expect(ramp_up).toBeLessThanOrEqual(1);
      expect(ramp_up).toBeGreaterThanOrEqual(0);
    });
  
    it('should handle errors and log', async () => {
      //feed in nonexistant info so call returns error
      const username = 'invaliduser';
      const repo = 'invalidrepo';
  
      try{
        await fetchRepoReadme(username, repo);
      } catch (error: any){
        expect(fs.appendFile).toHaveBeenCalled();
      }
    });
  });

  describe('fetchRepoIssues', () => {
    it('should fetch maintainer calculation successfully', async () => {
      const username = 'nullivex';
      const repo = 'nodist';

      const ramp_up = await fetchRepoIssues(username, repo);
  
      expect(ramp_up).toBeLessThanOrEqual(1);
      expect(ramp_up).toBeGreaterThanOrEqual(0);
    });
  
    it('should handle errors and log', async () => {
      //feed in nonexistant info so call returns error
      const username = 'invaliduser';
      const repo = 'invalidrepo';
  
      try{
        await fetchRepoReadme(username, repo);
      } catch (error: any){
        expect(fs.appendFile).toHaveBeenCalled();
      }
    });
  });

  describe('createLintDirs', () => {
    it('should create linting directories', async () => {
      const username = 'nullivex';
      const repo = 'nodist';

      const result = await createLintDirs(username, repo);
  
      expect(result).toEqual(1);
    });
  });

  /*describe('get_metric_info', () => {
    it('should calculate and output metric values', async () => {
      ensureDirectoryExistence('./temp_linter_test'); // make temp directory for linter test files
      ensureDirectoryExistence('./temp_npm_json'); // make temp directory for npm json files
      const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
      await delay(1000); // wait 1 second

      const username = 'nullivex';
      const repo = 'nodist';

      const repoList = [{username, repo}];
      // Create a spy for console.log
      const consoleSpy = jest.spyOn(console, 'log');

      await get_metric_info(repoList);
      await delay(1000); // wait 1 second
      expect(consoleSpy).toHaveBeenCalledWith(expect.any(String)); // Ensure it logs to console

      // Restore the original console.log
      consoleSpy.mockRestore();

      fs.rmSync('./temp_linter_test', { recursive: true });
      fs.rmSync('./temp_npm_json', { recursive: true });
    });
  
    it('should handle errors and log', async () => {
      //feed in nonexistant info so call returns error
      const username = 'invaliduser';
      const repo = 'invalidrepo';
      const repoList = [{username, repo}];
      try{
        await get_metric_info(repoList);
      } catch (error: any){
        expect(fs.appendFile).toHaveBeenCalled();
      }
    });
  });*/

  describe('calcTotalScore', () => {
    it('should return score as a sum of weighted components', async () => {

    const score = await calcTotalScore(0.5, 0.5, 1, 0.5, 0.5);

    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('calcRespMaintScore', () => {
    it('should return score as a sum of weighted components', async () => {
      const username = 'nullivex';
      const repo = 'nodist';
      const score = await calcRespMaintScore([5,10,15,20,25,30], username, repo);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });

  describe('calcCorrectnessScore', () => {
    it('should return correctness score based on num errors per num lines', async () => {
      const score = calcCorrectnessScore(300, 10000);

      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(1);
    });
  });


  describe('outputResults', () => {
    it('should print results as a json to string format', async () => {
      const username = 'nullivex';
    const repo = 'nodist';

    // Create a spy for console.log
    const consoleSpy = jest.spyOn(console, 'log');

    await outputResults(username, repo, 0.5, 0.5, 1, 0.5, 0.5, 0.5);

    expect(consoleSpy).toHaveBeenCalledWith(expect.any(String)); // Ensure it logs to console

    // Restore the original console.log
    consoleSpy.mockRestore();
    });
  });