module.exports = {
    "env": {
        "browser": true,
        "node": true,
        "commonjs": true,
        "es2021": true,
        "jest/globals": true
    },
    "extends": [
        "eslint:recommended",
        "plugin:@typescript-eslint/recommended"
    ],
    "overrides": [
        { "files" : ["*.js", "*.mjs", "*.ts", "*.jsx", "*.tsx"] }
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
        "ecmaVersion": "latest"
    },
    "plugins": [
       "@typescript-eslint"
    ],
    "rules": {
    }
}
