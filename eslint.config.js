// eslint/-disable-next-line no/-undef
export default [
  {
    files: ["**/*.tsx"],
    "env": {
      "browser": true,
      "es2021": true
    },
    "extends": [
      "react-app",
      "eslint:recommended",
      "plugin:react/recommended",
      "plugin:react-hooks/recommended",
      "plugin:@typescript-eslint/recommended"
    ],
    "parser": "@typescript-eslint/parser",
    "parserOptions": {
      "ecmaFeatures": {
        "jsx": true
      },
      "ecmaVersion": "latest",
      "sourceType": "module"
    },
    "plugins": [
      "react",
      "@typescript-eslint"
    ],
    "rules": {
      "@typescript-eslint/ban-types": [
        "error",
        {
          "extendDefaults": true,
          "types": {
            "{}": false
          }
        }
      ],
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
    },
  },
  {
    files: ["**/gulpfile.js"],
    languageOptions: { sourceType: "node" }
  },
]