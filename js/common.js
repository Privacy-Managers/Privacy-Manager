"use strict";

const setStorage = chrome.storage.local.set;
const getStorage = chrome.storage.local.get;

// Besides of "removeAll" item, all other dataTypes needs to be consistent with
// https://developer.chrome.com/extensions/browsingData#type-DataTypeSet
const browsingData = ["removeAll", "appcache", "cache", "cookies", "downloads",
                      "fileSystems", "formData", "history", "indexedDB", 
                      "localStorage", "serverBoundCertificates", "passwords", 
                      "pluginData", "serviceWorkers", "webSQL"];
