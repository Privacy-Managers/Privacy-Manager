# Privacy Manager

[![Build Status](https://travis-ci.com/Privacy-Managers/Privacy-Manager.svg?branch=release)](https://travis-ci.com/Privacy-Managers/Privacy-Manager)

## About

Privacy Manager is a chrome extension for data transparency and control.
Privacy Manager can help users with:

- Privacy Management
- Cookie Management
- Browsing data deletion on browser start
- Network monitoring

Stable version of Privacy Manager can be downloaded from the Chrome Web Store
[here](https://chrome.google.com/webstore/detail/privacy-manager/giccehglhacakcfemddmfhdkahamfcmd).

## Installation

```bash
npm install
```

### Setting up development environment

- Run one of the commands below
```bash
npm run build:webpack       # builds extension in `dist` directory
npm run build:webpack:watch # builds extension and watches for changes 
build:webpack:prod          # builds production version with minified files
```
- Visit `chrome://extensions` in your browser
- Ensure that the **Developer mode** checkbox in the top right-hand corner is
  checked
- Click **Load unpacked** button
- Locate and load generated `dist` folder in the repository root directory

**Note:** When rebuilding the extension changes in background scripts might not
be loaded in the chrome unless actual extension is reloaded in the
`chrome://extensions` page (i.e. By clicking on the reload button).

## Testing

```bash
npm test                # Run all tests
npm run test:puppeteer  # Run only puppeteer tests
npm run test:eslint     # Run Eslint tests
npm run test:stylelint  # Run Style linters
```

## Publishing

Command below bundles the extension into `privacy-manager.zip` file:
```bash
npm run build
```

## Contribution

### Reporting bugs, suggestions and questions

Use [Github issue tracker](https://github.com/Manvel/Privacy-Manager/issues) for
requesting features, reporting bugs and questions. See [github issues
documentation](https://guides.github.com/features/issues/).

### Code contribution

Code contributions are welcome, you can always consult with me (in issues, or
PRs) when you have a question. If you are developing a new feature, please
consider creating also tests for them when possible.

### Translations

#### Updating existing translation

Please use [Crowdin project](https://crowdin.com/project/privacy-manager) for
suggesting or improving translation, please note that you might need a crowdin
account for that reason, see [crowdin translation introduction
documentation](https://support.crowdin.com/crowdin-intro/).

#### Requesting new translation

In case you can't see the language you want to translate in [Crowdin
project](https://crowdin.com/project/privacy-manager), please use [Github issue
tracker](https://github.com/Manvel/Privacy-Manager/issues) for requesting new
translation language in crowdin.

### Thanks to the awesome contributors

- [@jeroen7s](https://github.com/jeroen7s)
  - For [making whitelisting of cookies possible](https://github.com/Manvel/Privacy-Manager/pull/31)
- [@leonid-panich](https://github.com/leonid-panich)
  - For helping with Russian Translations
