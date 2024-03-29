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

const browser = require("webextension-polyfill");
const additionalPermission = {"origins": ["<all_urls>"]};
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
  browser.declarativeNetRequest.updateEnabledRulesets({
    enableRulesetIds: ["block-agent"]
  });
}

function removeBlockAgentListener()
{
  browser.declarativeNetRequest.updateEnabledRulesets({
    disableRulesetIds: ["block-agent"]
  });
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

module.exports = {additionalPermission, getAllCookies,
                  removeCookie, getUrl, addRequestListener,
                  removeRequestListener, updateRequestObj,
                  addBlockAgentListener, removeBlockAgentListener,
                  deleteCookies};
