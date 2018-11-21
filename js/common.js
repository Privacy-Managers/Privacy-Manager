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

const additionalPermission = {"origins": ["<all_urls>"]};

// Besides of "removeAll" item, all other dataTypes needs to be consistent with
// https://developer.chrome.com/extensions/browsingData#type-DataTypeSet
const browsingData = ["removeAll", "appcache", "cache", "cookies", "downloads",
                      "fileSystems", "formData", "history", "indexedDB", 
                      "localStorage", "serverBoundCertificates", "passwords", 
                      "pluginData", "serviceWorkers", "webSQL"];
const getAllCookies = chrome.cookies.getAll;
const removeCookie = chrome.cookies.remove;

function getStorage(keys, callback)
{
  // See -> https://github.com/Manvel/Privacy-Manager/issues/24
  chrome.storage.local.get(keys, callback);
}

function setStorage(items, callback)
{
  chrome.storage.local.set(items, callback);
}

function getUrl(domain, path, isSecure)
{
  return "http" + (isSecure ? "s" : "") + "://" + domain + path;
}
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

/*******************************************************************************
 * Block user agent
 ******************************************************************************/
function addBlockAgentListener()
{
  chrome.webRequest.onBeforeSendHeaders.addListener(blockUserAgent,
    {urls: ["<all_urls>"]}, ["blocking", "requestHeaders"]);
}

function removeBlockAgentListener()
{
  chrome.webRequest.onBeforeSendHeaders.removeListener(blockUserAgent);
}

function blockUserAgent(details)
{
  for (var i = 0; i < details.requestHeaders.length; ++i)
  {
    if (details.requestHeaders[i].name == "User-Agent")
    {
      details.requestHeaders.splice(i, 1);
      break;
    }
  }
  return {requestHeaders: details.requestHeaders};
}

function deleteCookies() {
  // delete cookies here + ignore whitelisted cookies
  getStorage("cookieWhitelist", function (data) {
    let domainList = data.cookieWhitelist
    getAllCookies({}, function (cookies) {
      let callbackCount = 0;
      for (let cookie of cookies) {
        let url = getUrl(cookie.domain, cookie.path, cookie.secure);
        // replace leading dots sometimes present in cookie domains
        let domainWhitelist = domainList[cookie.domain.replace(/^\./, "")]
        if (!domainWhitelist || domainWhitelist.indexOf(cookie.name) < 0) {
          removeCookie({ "url": url, "name": cookie.name });
        }
      }
    });
  });
}
