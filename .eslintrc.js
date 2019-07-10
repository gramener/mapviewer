module.exports = {
  "parserOptions": {
    "ecmaVersion": 2017,
    "sourceType": "module",
  },
  "overrides": [{
    "files": ["test/server.js"],
    "parserOptions": {
      "ecmaVersion": 8
    }
  }],
  "env": {
    "node": true,       // Include node globals
    "browser": true,    // Include browser globals
    "jquery": true,     // Include jQuery and $
    "mocha": true,      // Include it(), assert(), etc
    "es6": true,        // Include ES6 features
  },
  "globals": {
    "_": true,          // lodash
    "d3": true,         // d3
    "L": true,          // leaflet
    "topojson": true    // topojson
  },
  "extends": "eslint:recommended",
  "rules": {
    /* Override default rules */
    "indent": [2, 2, {"VariableDeclarator": 2}],  // Force 2 space indentation
    "linebreak-style": ["error", "unix"],         // Force UNIX style line
    "semi": ["error", "never"],                   // Force no-semicolon style
    "no-cond-assign": ["off", "always"],          // Allow this for loops
    "quotes": ["off", "double"]                   // We may go for a double-quotes style
  }
};
