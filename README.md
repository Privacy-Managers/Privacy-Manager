# Privacy Manager

[![Build Status](https://travis-ci.com/Privacy-Managers/Privacy-Manager.svg?branch=release)](https://travis-ci.com/Privacy-Managers/Privacy-Manager)

## About

Privacy Manager is a chrome extension for data transparency and control.
Privacy Manager can help users with:

* Privacy Management
* Cookie Management
* Browsing data deletion on browser start
* Network monitoring

## Installation

### Stable version (Chrome Web Store)

Install the extension from Chrome Web Store using [current link](https://chrome.google.com/webstore/detail/privacy-manager/giccehglhacakcfemddmfhdkahamfcmd).

### Development version

* Clone current repository
* Visit *chrome://extensions* in your browser
* Ensure that the **Developer mode** checkbox in the top right-hand corner is checked
* Click **Load unpacked extension…** to pop up a file-selection dialog
* Navigate to *cloned directory's* `src` folder and select it.

## Publishing

Run command below for zipped bundle creation:

```
npm run build
```

## Contribution

### Reporting bugs, suggestions and questions

Use [Github issue tracker](https://github.com/Manvel/Privacy-Manager/issues) for requesting features, reporting bugs and questions. See [github issues documentation](https://guides.github.com/features/issues/).

### Translations

#### Updating existing translation

Please use [Crowdin project](https://crowdin.com/project/privacy-manager) for suggesting or improving translation, please note that you might need a crowdin account for that reason, see [crowdin translation introduction documentation](https://support.crowdin.com/crowdin-intro/).

#### Requesting new translation

In case you can't see the language you want to translate in [Crowdin project](https://crowdin.com/project/privacy-manager), please use [Github issue tracker](https://github.com/Manvel/Privacy-Manager/issues) for requesting new translation language in crowdin.

### Thanks to the awesome contributors
- [@jeroen7s](https://github.com/jeroen7s)
  - For [making whitelisting of cookies possible](https://github.com/Manvel/Privacy-Manager/pull/31)
- [@leonid-panich](https://github.com/leonid-panich)
  - For helping with Russian Translations
