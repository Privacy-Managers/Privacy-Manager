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

const {additionalPermission, getStorage, setStorage, addRequestListener,
      removeRequestListener, updateRequestObj, addBlockAgentListener,
      removeBlockAgentListener, deleteCookies} = require("./common");

window.collectedRequests = [];
const requestCollectionLength = 500;

function profileStart()
{
  getStorage("cookieWhitelist", function(data)
  {
    if (!data || !data.cookieWhitelist)
    {
      setStorage({"cookieWhitelist": {} });
    }
  });
  getStorage("settingList", function(data)
  {
    deleteBrowsingData(data.settingList);
  });
}

//TODO: Find a solution to avoide duplication
getStorage("settingList", function(data)
{
  if (data.settingList && data.settingList.collectHeaders)
    startCollectingRequests();

  if (data.settingList && data.settingList.blockUserAgent)
    addBlockAgentListener();
});

function deleteBrowsingData(data)
{
  if (!data)
    return;

  // Filter "data" object to only match properties from "browsingData".
  var browsingDataObj = Object.keys(data).filter(function(key)
  {
    return browsingData.includes(key);
  }).reduce(function(accumulator, dataType)
  {
    accumulator[dataType] = data[dataType];
    return accumulator;
  }, {});

  if (browsingDataObj.removeAll == true)
  {
    browsingDataObj = browsingData.reduce(function(accumulator, dataType)
    {
      if (dataType != "removeAll")
        accumulator[dataType] = true;

      return accumulator;
    }, {});

    if (browsingDataObj.cookies)
    {
      deleteCookies();
    }
    browsingDataObj.cookies = false;
    chrome.browsingData.remove({}, browsingDataObj);
  }
  else
  {
    if (browsingDataObj.cookies)
    {
      deleteCookies();
    }
    browsingDataObj.cookies = false;
    chrome.browsingData.remove({}, browsingDataObj);
  }
}

global.startCollectingRequests = function()
{
  addRequestListener(onSendHeaders, onHeadersReceived);
};

global.stopCollectingRequests = function()
{
  removeRequestListener(onSendHeaders, onHeadersReceived);
};

function onSendHeaders(details)
{
  updateRequestObj(details, "send");
  addToRequestArray(details);
}

function onHeadersReceived(details)
{
  updateRequestObj(details, "receive");
  addToRequestArray(details);
}

function addToRequestArray(details)
{
  if (collectedRequests.length > requestCollectionLength)
    collectedRequests.shift();

  collectedRequests.push(details);
}

chrome.storage.onChanged.addListener(function(change)
{
  if (change.settingList)
  {
    chrome.permissions.contains(additionalPermission, function(result)
    {
      var newValue = change.settingList.newValue.collectHeaders;
      var oldValue = change.settingList.oldValue;
      if (oldValue && newValue != oldValue.collectHeaders)
      {
        if (result && newValue)
          startCollectingRequests();
        else
          stopCollectingRequests();
      }

      newValue = change.settingList.newValue.blockUserAgent;
      oldValue = change.settingList.oldValue;
      if (oldValue && newValue != oldValue.blockUserAgent)
      {
        if (result && newValue)
          addBlockAgentListener();
        else
          removeBlockAgentListener();
      }
    });
  }
});

chrome.permissions.onRemoved.addListener(function()
{
  removeBlockAgentListener();
  removeRequestListener(onSendHeaders, onHeadersReceived);
});

// Fired on a profile start up
chrome.runtime.onInstalled.addListener(profileStart);
chrome.runtime.onStartup.addListener(profileStart);
