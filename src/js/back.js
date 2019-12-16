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

const {additionalPermission, addRequestListener, removeRequestListener,
      updateRequestObj, addBlockAgentListener, removeBlockAgentListener,
      deleteCookies} = require("./common");
const {browsingData} = require("./data");

window.collectedRequests = [];
const requestCollectionLength = 500;

async function profileStart()
{
  const data = await browser.storage.local.get("cookieWhitelist");
  if (!data || !data.cookieWhitelist)
    browser.storage.local.set({"cookieWhitelist": {} });
  const {settingList} = await browser.storage.local.get("settingList");
  deleteBrowsingData(settingList);
}

browser.storage.local.get("settingList").then((data) =>
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
  let browsingDataObj = Object.keys(data).filter((key) =>
  {
    return browsingData.includes(key);
  }).reduce((accumulator, dataType) =>
  {
    accumulator[dataType] = data[dataType];
    return accumulator;
  }, {});

  if (browsingDataObj.removeAll == true)
  {
    browsingDataObj = browsingData.reduce((accumulator, dataType) =>
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
    browser.browsingData.remove({}, browsingDataObj);
  }
  else
  {
    if (browsingDataObj.cookies)
    {
      deleteCookies();
    }
    browsingDataObj.cookies = false;
    browser.browsingData.remove({}, browsingDataObj);
  }
}

window.deleteBrowsingData = async() =>
{
  const {settingList} = await browser.storage.local.get("settingList");
  deleteBrowsingData(settingList);
};

window.startCollectingRequests = () =>
{
  addRequestListener(onSendHeaders, onHeadersReceived);
};

window.stopCollectingRequests = () =>
{
  removeRequestListener(onSendHeaders, onHeadersReceived);
};

function onSendHeaders(details)
{
  const itemObj = updateRequestObj(details, "send");
  addToRequestArray(itemObj);
}

function onHeadersReceived(details)
{
  const itemObj = updateRequestObj(details, "receive");
  addToRequestArray(itemObj);
}

function addToRequestArray(details)
{
  if (collectedRequests.length > requestCollectionLength)
    collectedRequests.shift();

  collectedRequests.push(details);
}

browser.storage.onChanged.addListener(async(change) =>
{
  if (change.settingList)
  {
    const result = await browser.permissions.contains(additionalPermission);
    let newValue = change.settingList.newValue.collectHeaders;
    let oldValue = change.settingList.oldValue;
    if (!oldValue || newValue != oldValue.collectHeaders)
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
  }
});

browser.permissions.onRemoved.addListener(() =>
{
  removeBlockAgentListener();
  removeRequestListener(onSendHeaders, onHeadersReceived);
});

// Fired on a profile start up
browser.runtime.onInstalled.addListener(profileStart);
browser.runtime.onStartup.addListener(profileStart);
