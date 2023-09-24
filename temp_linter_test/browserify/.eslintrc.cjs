/* eslint-env node */
module.exports = {
    extends: ['eslint:recommended'],
    "parserOptions": {
        "ecmaVersion": 5,
    },
    "overrides": [
        {
            "files": ["*.ts", "*.tsx"],
            "parser": "@typescript-eslint/parser",
            "plugins": ['@typescript-eslint'],
            "extends": [
                "plugin:@typescript-eslint/recommended",
            ],
        }
    ],
    root: true,
};