//imported functions
import { check_npm_for_open_source } from '../main.js';

describe('check_npm_for_open_source', () => {
    it('should return https link if valid github repository is present', async () => {
      const result1 = await check_npm_for_open_source('./temp_npm_json/browserify_info.json');
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