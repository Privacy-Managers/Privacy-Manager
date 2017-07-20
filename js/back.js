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

(function(global)
{
  global.collectedRequests = [];
  const requestCollectionLength = 500;

  function profileStart()
  {
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
      var browsingDataObj = browsingData.reduce(function(accumulator, dataType)
      {
        if (dataType != "removeAll")
          accumulator[dataType] = true;

        return accumulator;
      }, {});
      chrome.browsingData.remove({}, browsingDataObj);
    }
    else
    {
      delete browsingDataObj.removeAll;
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
    if(collectedRequests.length > requestCollectionLength)
      collectedRequests.shift();

    collectedRequests.push(details);
  }

  chrome.storage.onChanged.addListener(function(change)
  {
    if (change.settingList)
    {
      var newValue = change.settingList.newValue.collectHeaders;
      var oldValue = change.settingList.oldValue.collectHeaders;
      if (newValue != oldValue)
      {
        if(newValue)
          startCollectingRequests();
        else
          stopCollectingRequests();
      }

      var newValue = change.settingList.newValue.blockUserAgent;
      var oldValue = change.settingList.oldValue.blockUserAgent;
      if (newValue != oldValue)
      {
        if(newValue)
          addBlockAgentListener();
        else
          removeBlockAgentListener();
      }
    }
  });

  // Fired on a profile start up
  chrome.runtime.onStartup.addListener(profileStart);
})(this);
