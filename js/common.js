/*
 * This file is part of Privacy Manager.
 * Copyright (C) 2017 Manvel Saroyan
 * 
 * Privacy Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Privacy Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Privacy Manager. If not, see <http://www.gnu.org/licenses/>.
 */

"use strict";

const setStorage = chrome.storage.local.set;
const getStorage = chrome.storage.local.get;
const additionalPermission = {"origins": ["http://*/*", "https://*/*"]};

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
