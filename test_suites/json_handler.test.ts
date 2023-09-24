import { check_npm_for_open_source } from './json_handler';

describe('check_npm_for_open_source', () => {
    it('should return https link if valid github repository is present', async () => {
      const result1 = await check_npm_for_open_source('./src/temp_npm_json/browserify_info.json');
      expect(result1).toBe('https://git@github.com/browserify/browserify.git');
    });
  
    it('should return "Invalid" if no github repo is present', async () => {
      const result2 = await check_npm_for_open_source('./src/test_files/browserify_fake_type.json');
      expect(result2).toBe('Invalid');
    });
  
    it('should return null if file cannot be read', async () => {
      const result3 = await check_npm_for_open_source('./src/test_files/no_file');
      expect(result3).toBe('File Error');
    });
});