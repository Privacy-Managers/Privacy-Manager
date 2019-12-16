const privacyData = {
  websites:
    ["thirdPartyCookiesAllowed", "hyperlinkAuditingEnabled",
     "referrersEnabled", "protectedContentEnabled"],
  services:
    ["alternateErrorPagesEnabled", "autofillEnabled",
     "hotwordSearchEnabled", "passwordSavingEnabled",
     "safeBrowsingEnabled",
     "safeBrowsingExtendedReportingEnabled",
     "searchSuggestEnabled", "spellingServiceEnabled",
     "translationServiceEnabled"],
  network:
    ["networkPredictionEnabled"]
};

// https://developer.chrome.com/extensions/browsingData#type-DataTypeSet
const browsingData = ["removeAll", "appcache", "cache", "cookies", "downloads",
                      "fileSystems", "formData", "history", "indexedDB",
                      "localStorage", "serverBoundCertificates", "passwords",
                      "pluginData", "serviceWorkers", "webSQL"];

module.exports = {privacyData, browsingData};
