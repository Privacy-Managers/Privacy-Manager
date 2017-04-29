"use strict";

const setStorage = chrome.storage.local.set;
const getStorage = chrome.storage.local.get;

// Besides of "removeAll" item, all other dataTypes needs to be consistent with
// https://developer.chrome.com/extensions/browsingData#type-DataTypeSet
const browsingData = ["removeAll", "appcache", "cache", "cookies", "downloads",
                      "fileSystems", "formData", "history", "indexedDB", 
                      "localStorage", "serverBoundCertificates", "passwords", 
                      "pluginData", "serviceWorkers", "webSQL"];

function addRequestListener(onSendHeadersCallback, onHeadersReceivedCallback)
{
  chrome.webRequest.onSendHeaders.addListener(onSendHeadersCallback, 
    {urls: ["<all_urls>"]}, ["requestHeaders"]);
  chrome.webRequest.onHeadersReceived.addListener(onHeadersReceivedCallback, 
    {urls: ["<all_urls>"]}, ["responseHeaders"]);
}

function removeRequestListener(onSendHeadersCallback, onHeadersReceivedCallback)
{
  chrome.webRequest.onSendHeaders.removeListener(onSendHeadersCallback);
  chrome.webRequest.onHeadersReceived.removeListener(onHeadersReceivedCallback);
}

function updateRequestObj(details, actionType)
{
  details.dataset = {type: actionType};
  details.texts = {url: details.url, type: details.type};
}
