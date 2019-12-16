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

const {$, getMessage} = require("../helpers/utils");
const {registerActionListener} = require("../helpers/actionListener");
const {additionalPermission, addRequestListener, removeRequestListener,
       updateRequestObj, addBlockAgentListener, removeBlockAgentListener} = require("../../common");
const {addStorageToggle, addPermissionToggle, getSettingListData, resetSettingListData} = require("../helpers/settingList");

const blockUserAgentId = "blockUserAgent";
const collectHeadersId = "collectHeaders";
const permissionNotificationMsgId = "additionalPermissions_notification";
const filterParams = ["statusLine", "statusCode", "type", "url", "method"];

let collectedRequests = [];
let tableList = null;

document.addEventListener("DOMContentLoaded" , async function()
{
  const networkTab = $("#panel-network");
  const leftSettingList = $("ul.settings-list:nth-of-type(1)", networkTab);
  const rightSettingList = $("ul.settings-list:nth-of-type(2)", networkTab);

  addPermissionToggle("additionalPermissions", leftSettingList);

  addStorageToggle(blockUserAgentId, leftSettingList, (enabled) =>
  {
    onNetworkSettingChange(blockUserAgentId, enabled);
  });
  onNetworkSettingChange(blockUserAgentId,
                         await getSettingListData(blockUserAgentId));

  addStorageToggle(collectHeadersId,rightSettingList, (enabled) =>
  {
    onNetworkSettingChange(collectHeadersId, enabled);
  });
  onNetworkSettingChange(collectHeadersId,
                         await getSettingListData(collectHeadersId));

  tableList = document.querySelector("#panel-network pm-table");

  registerActionListener($("#requestsWidget"), onRequestsWidgetAction);
  tableList.setListener(onRequestsWidgetActionComp);
  const window = await browser.runtime.getBackgroundPage();

  collectedRequests = window.collectedRequests;
  tableList.addItems(collectedRequests);
},false);

async function onNetworkSettingChange(settingName, isActive)
{
  switch(settingName)
  {
    case "blockUserAgent":
      if (isActive)
      {
        const result = await browser.permissions.contains(additionalPermission);
        if (result)
        {
          addBlockAgentListener();
        }
        else
        {
          alert(await getMessage(permissionNotificationMsgId));
          await resetSettingListData(settingName);
        }
      }
      else
      {
        removeBlockAgentListener();
      }
      break;
    case "collectHeaders":
      if (isActive)
      {
        const result = await browser.permissions.contains(additionalPermission);
        if (result)
        {
          addRequestListener(onSendHeaders, onHeadersReceived);
        }
        else
        {
          alert(await getMessage(permissionNotificationMsgId));
          await resetSettingListData(settingName);
        }
      }
      else
      {
        removeRequestListener(onSendHeaders, onHeadersReceived);
      }
      break;
  }
}

browser.permissions.onRemoved.addListener(async(result) =>
{
  await resetSettingListData([blockUserAgentId, collectHeadersId]);
  removeBlockAgentListener();
  removeRequestListener(onSendHeaders, onHeadersReceived);
});


function onSendHeaders(details)
{
  const itemObj = updateRequestObj(details, "send");
  tableList.addItems([itemObj]);
}


function onHeadersReceived(details)
{
  const itemObj = updateRequestObj(details, "receive");
  tableList.addItems([itemObj]);
}

function onRequestsWidgetActionComp(action, item, parentItem)
{
  switch (action)
  {
    case "get-request":
    {
      if (item.subItems)
      {
        onRequestsWidgetActionComp("close-expanded-request", null, item);
        return;
      }

      const {request} = item;
      for (const param in request)
      {
        const headers = request[param];
        if (param == "requestHeaders" || param == "responseHeaders")
        {
          for (const {name, value} of headers)
          {
            const id = name;
            tableList.addItems([{id, texts: {name, value}}], item.id);
          }
        }
        else if (filterParams.indexOf(param) >= 0)
        {
          const name = param;
          const value = headers;
          tableList.addItems([{id: name, texts: {name, value}}], item.id);
        }
      }
      break;
    }
    case "close-expanded-request":
      tableList.empty(parentItem.id);
      break;
  }
}

async function onRequestsWidgetAction(action, element)
{
  switch (action)
  {
    case "delete-all": {
      const window = await browser.runtime.getBackgroundPage();
      window.collectedRequests = [];
      tableList.empty();
      break;
    }
    case "download-all": {
      const downloadJson = [];
      for (const {request, data} of collectedRequests)
      {
        const requestObj = {};
        requestObj["action"] = data.type;
        for (const param in request)
        {
          if (param == "requestHeaders" || param == "responseHeaders")
          {
            requestObj["headers"] = {};
            for (const {name, value} of request[param])
            {
              requestObj["headers"][name] = value;
            }
          }
          else if (filterParams.indexOf(param) >= 0)
          {
            requestObj[param] = request[param];
          }
        }
        downloadJson.push(requestObj);
      }

      //Download requests
      const anchorElem = document.createElement("a");
      anchorElem.setAttribute("href", "data:text/plain;charset=utf-8," +
        encodeURIComponent(JSON.stringify(downloadJson, null, 2)));

      anchorElem.setAttribute("download", "requests.json");
      anchorElem.style.display = 'none';
      document.body.appendChild(anchorElem);
      anchorElem.click();
      document.body.removeChild(anchorElem);
      break;
    }
  }
}
