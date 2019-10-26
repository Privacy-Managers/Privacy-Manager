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

const {getParentData, Elem, getMsg, cloneObj, createBasicSettingObj} = require("./utils");
const {registerActionListener} = require("./actionListener");
const {additionalPermission, addRequestListener, removeRequestListener,
       updateRequestObj, addBlockAgentListener, removeBlockAgentListener} = require("../common");
const {addSettingItem, resetSettingListData, Listener} = require("./components/settingList");
const {TableList} = require("./components/tableList");

(function()
{
  const blockUserAgentId = "blockUserAgent";
  const collectHeadersId = "collectHeaders";
  const permissionNotificationMsgId = "additionalPermissions_notification";
  const filterParams = ["statusLine", "statusCode", "type", "url", "method"];

  var downloadText = "";
  var collectedRequests = [];

  var tableList = null;

  document.addEventListener("DOMContentLoaded" , function()
  {
    const networkTab = Elem("#panel-network");
    const leftSettingList = Elem("ul.settings-list:nth-of-type(1)", networkTab);
    const rightSettingList = Elem("ul.settings-list:nth-of-type(2)", networkTab);

    var settingObj = createBasicSettingObj("additionalPermissions");
    addSettingItem(leftSettingList, settingObj, "permission");
    settingObj = createBasicSettingObj(blockUserAgentId);
    const settingListListener = new Listener();
    addSettingItem(leftSettingList, settingObj, "storage");
    settingListListener.on(blockUserAgentId, (enabled) =>
    {
      onNetworkSettingChange(blockUserAgentId, enabled);
    });

    settingObj = createBasicSettingObj(collectHeadersId);
    addSettingItem(rightSettingList, settingObj, "storage");
    settingListListener.on(collectHeadersId, (enabled) =>
    {
      onNetworkSettingChange(collectHeadersId, enabled);
    });

    tableList = new TableList(Elem("#requestsWidget .tableList"),
                              Elem("#requestListTemplate"),
                              Elem("#requestSubListTemplate"), null);

    registerActionListener(Elem("#requestsWidget"), onRequestsWidgetAction);
    chrome.runtime.getBackgroundPage(function(window)
    {
      collectedRequests = window.collectedRequests;
      var requestsCopy =  collectedRequests.map(function(request)
      {
        return cloneObj(request); //Deep cloning
      });
      tableList.addItems(requestsCopy);
    });
  },false);

  function onNetworkSettingChange(settingName, isActive)
  {
    switch(settingName)
    {
      case "blockUserAgent":
        if (isActive)
        {
          chrome.permissions.contains(additionalPermission, async(result) =>
          {
            if (result)
            {
              addBlockAgentListener();
            }
            else
            {
              alert(getMsg(permissionNotificationMsgId));
              await resetSettingListData(settingName);
            }
          });
        }
        else
        {
          removeBlockAgentListener();
        }
        break;
      case "collectHeaders":
        if (isActive)
        {
          chrome.permissions.contains(additionalPermission, async(result) =>
          {
            if (result)
              addRequestListener(onSendHeaders, onHeadersReceived);
            else
            {
              alert(getMsg(permissionNotificationMsgId));
              await resetSettingListData(settingName);
            }
          });
        }
        else
        {
          removeRequestListener(onSendHeaders, onHeadersReceived);
        }
        break;
    }
  }

  chrome.permissions.onRemoved.addListener(async(result) =>
  {
    await resetSettingListData([blockUserAgentId, collectHeadersId]);
    removeBlockAgentListener();
    removeRequestListener(onSendHeaders, onHeadersReceived);
  });

  function onSendHeaders(details)
  {
    updateRequestObj(details, "send");
    tableList.addItems([details]);
  }

  function onHeadersReceived(details)
  {
    updateRequestObj(details, "receive");
    tableList.addItems([details]);
  }

  function onRequestsWidgetAction(action, element)
  {
    switch (action)
    {
      case "get-request":
        if (element.dataset.expanded == "true")
        {
          onRequestsWidgetAction("close-expanded-request", element);
          return;
        }

        var accessor = element.dataset.access;
        var itemObj = tableList.getItem(accessor);
        for (const param in itemObj)
        {
          if (param == "requestHeaders" || param == "responseHeaders")
          {
            var headers = itemObj[param];
            for (var i = 0; i < headers.length; i++)
              addSubItem(headers[i].name, headers[i].value, accessor);
          }
          else if (filterParams.indexOf(param) >= 0)
          {
            addSubItem(param, itemObj[param], accessor);
          }
        }
        break;
      case "close-expanded-request":
        //TODO: Remove duplications
        var requestElem = getParentData(element, "data-expanded", true);
        tableList.removeAllSubItems(requestElem.dataset.access);
        requestElem.focus();
        requestElem.dataset.expanded = false;
        break;
      case "delete-all":
        chrome.runtime.getBackgroundPage(function(window)
        {
          window.collectedRequests = [];
          tableList.empty();
        });
        break;
      case "download-all": {
        for (let i = 0; i < collectedRequests.length; i++)
        {
          var requestObj = collectedRequests[i];
          for (const param in requestObj)
          {
            if (param == "requestHeaders" || param == "responseHeaders")
            {
              for (var j = 0; j < requestObj[param].length; j++)
              {
                var header = requestObj[param][j];
                downloadText += "  ";
                updateDownloadText(header.name, header.value);
              }
            }
            else if (param == "dataset")
            {
              updateDownloadText("Action type", requestObj[param].type);
            }
            else if (filterParams.indexOf(param) >= 0)
            {
              updateDownloadText(param, requestObj[param]);
            }
          }
          downloadText += "\n\n";
        }

        //Download requests
        const anchorElem = document.createElement("a");
        anchorElem.setAttribute("href", "data:text/plain;charset=utf-8," +
          encodeURIComponent(downloadText));

        anchorElem.setAttribute("download", "requests.txt");
        anchorElem.style.display = 'none';
        document.body.appendChild(anchorElem);
        anchorElem.click();
        document.body.removeChild(anchorElem);
        downloadText = "";
        break;
      }
    }
  }

  function updateDownloadText(name, value)
  {
    downloadText += name + " : " + value + "\n";
  }

  function addSubItem(name, value, accessor)
  {
    tableList.addSubItem({
      "dataset": {"access": name},
      "texts": {"name": name, "value": value}
    }, accessor);
  }
})();
