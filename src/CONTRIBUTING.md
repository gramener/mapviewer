# Set up

To set up locally, clone this repo and run:

    yarn install
    npm run build     # Optional: build the dist/ directory

Here is a list of npm commands available:

    npm test          # Run all unit tests on puppeteer
    npm run lint      # Check for basic errors using eslint
    npm run server    # Start a HTTP server at the current folder for manual testing
    npm run dev       # Start a rollup watch that re-builds dist/ if files change

To test unit tests on other browsers using Selenium:

- `npm run test-chrome`. Requires [ChromeDriver](https://sites.google.com/a/chromium.org/chromedriver/downloads) in your PATH
- `npm run test-edge`. Requires [WebDriver](https://developer.microsoft.com/en-us/microsoft-edge/tools/webdriver/) in your PATH
- `npm run test-firefox`. Requires [GeckoDriver](https://github.com/mozilla/geckodriver/releases/) in your PATH

# File structure

- `dist/` has output files. It is re-created via  `npm run build`. It has:
  - [g1.js](dist/g1.js) - non-minified source created via rollup on [index.js](index.js)
  - [g1.min.js](dist/g1.min.js) - minified source created via rollup on [index.js](index.js)
  - `<module>.min.js` for each module - minified source created via rollup on `index-<module>.js`
- `./` has setup files.
  - [index.js](index.js) is the rollup configuration to create the full `g1` package
  - `index-<module>.js` is the rollup configuration to create each module
  - Other support files
- `src/` has source files. This includes:
  - `<module>.js` - underlying source for each module, which may import other dependencies. TODO: rename jquery.* to this
  - `<library>.js` - for internally used libraries
- `test/` has test cases. It is run via `npm test`. It has:
  - `test-<module>.html` for each browser module
  - `test-<library>.js` for each library that can be tested directly on node.js
  - `server.js` runs tests on [Puppeteer](https://github.com/GoogleChrome/puppeteer)
  - `tape.js` is dynamically created using browserify to help with test cases. This is not committed. To locally create `tape.js` file, run `npm test`.
  - Other test dependencies

# Interaction conventions

All interaction components use this naming convention:

- Interactions are enabled on a *container*, typically `body`. For example,
  `$('body').urlfilter()`. Containers have these common attributes:
    - `data-selector`: selector to identify triggers. e.g. `.urlfilter`, `.highlight`
    - `data-target`: selector that all triggers act on by default
    - `data-mode`: mode of interaction for all triggers
    - `data-attr`: attribute that contains the interaction data, e.g. `href` for `.urlfilter`
    - `data-event`: event that triggers urlfilter. Defaults to `'click'`
- Interactions are triggered on a *trigger*. For example, `.urlfilter` for `$().urlfilter()`.
  Clicking / hovering on / typing in a trigger triggers the interaction.
    - `data-target`: selector that this trigger acts on
    - `data-mode`: mode of interaction for this trigger
- Interactions change a *target*. For example, `urlfilter` changes `location.href` by default. The
  `data-target` on containers and triggers define this.
- Interactions data is contained in an attribute. This is applied to the target. For example,
  `.urlfilter` applied `href` to the target. The attribute name is stored in `data-attr`.
- Interactions have *modes*. This can be controlled using `data-mode=`.

All container `data-` attributes can also be passed as an option to the
function. For example, `<body data-selector=".link">` is the same as
`$('body').urlfilter({selector: '.link'})`.

# Release

To publish a new version on npm:

    # Run tests on dev branch
    git checkout dev
    npm run lint
    npm test
    npm run test-chrome
    npm run test-edge
    npm run test-firefox

    # Update package.json version
    # Update CHANGELOG.md
    # Ensure that there are no build errors on the server
    git commit . -m"DOC: Release version x.x.x"
    git push

    # Merge into dev branch
    git checkout master
    git merge dev
    git tag -a v0.x.x -m"Add a one-line summary"
    git push --follow-tags

    # Publish to https://www.npmjs/package/g1
    # Maintained currently by @sanand0
    npm publish

    git checkout dev

Once published:

- Update the version on [gramex/apps/ui/package.json](https://code.gramener.com/cto/gramex/blob/master/gramex/apps/ui/package.json)
