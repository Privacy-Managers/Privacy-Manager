/*
 * This file is part of Privacy Manager.
 * Copyright (C) 2017-present Manvel Saroyan
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
const getAllCookies = browser.cookies.getAll;
const removeCookie = browser.cookies.remove;
const onBeforeSendHeaders = browser.webRequest.onBeforeSendHeaders;
const onSendHeaders = browser.webRequest.onSendHeaders;
const onHeadersReceived = browser.webRequest.onHeadersReceived;

function getUrl(domain, path, isSecure)
{
  return "http" + (isSecure ? "s" : "") + "://" + domain + path;
}
function addRequestListener(sendHeaders, headersReceived)
{
  const urls = {urls: ["<all_urls>"]};
  onSendHeaders.addListener(sendHeaders, urls, ["requestHeaders"]);
  onHeadersReceived.addListener(headersReceived, urls, ["responseHeaders"]);
}

function removeRequestListener(sendHeaders, headersReceived)
{
  onSendHeaders.removeListener(sendHeaders);
  onHeadersReceived.removeListener(headersReceived);
}

function updateRequestObj(details, actionType)
{
  const {url, type} = details;
  return {texts: {url, type}, data: {type: actionType}, request: details};
}

/*******************************************************************************
 * Block user agent
 ******************************************************************************/
function addBlockAgentListener()
{
  onBeforeSendHeaders.addListener(blockUserAgent,
                                  {urls: ["<all_urls>"]},
                                  ["blocking", "requestHeaders"]);
}

function removeBlockAgentListener()
{
  onBeforeSendHeaders.removeListener(blockUserAgent);
}

function blockUserAgent(details)
{
  const filterUserAgent = (request) => request.name != "User-Agent";
  const requestHeaders = details.requestHeaders.filter(filterUserAgent);
  return {requestHeaders};
}

function removeStartDot(string)
{
  return string.replace(/^\./, "");
}

async function deleteCookies()
{
  const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
  const cookies = await browser.cookies.getAll({});
  for (const cookie of cookies)
  {
    const url = getUrl(cookie.domain, cookie.path, cookie.secure);
    const domainWhitelist = cookieWhitelist[removeStartDot(cookie.domain)];
    if (!domainWhitelist || (!domainWhitelist.cookies.includes(cookie.name) &&
        !domainWhitelist.domainWhitelist))
    {
      removeCookie({ "url": url, "name": cookie.name });
    }
  }
}

module.exports = {additionalPermission, browsingData, getAllCookies,
                  removeCookie, getUrl, addRequestListener,
                  removeRequestListener, updateRequestObj,
                  addBlockAgentListener, removeBlockAgentListener,
                  deleteCookies};
