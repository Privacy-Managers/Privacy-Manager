"use strict";

(function()
{
	const blockUserAgentId = "blockUserAgent";
	const collectHeadersId = "collectHeaders";

	var tableList = null;

	document.addEventListener("DOMContentLoaded" , function()
	{
		var leftSettingList = Elem("#network_tab ul.settings-list:nth-of-type(1)");
		var rightSettingList = Elem("#network_tab ul.settings-list:nth-of-type(2)");
		addSettingItem(leftSettingList, "allowHostPermissions", "permission");
		addSettingItem(leftSettingList, blockUserAgentId, "storage", function(enabled)
		{
			onNetworkSettingChange(blockUserAgentId, enabled)
		});

		addSettingItem(rightSettingList, collectHeadersId, "storage", function(enabled)
		{
			onNetworkSettingChange(collectHeadersId, enabled)
		});

		tableList = new TableList(Elem("#requestsWidget .tableList"), 
			Elem("#requestListTemplate"), Elem("#requestSubListTemplate"), null);

		registerActionListener(Elem("#requestsWidget"), onRequestsWidgetAction);
		chrome.runtime.getBackgroundPage(function(window)
		{
			for (var i = 0; i < window.collectedRequests.length; i++)
  		{
  			tableList.addItem(cloneObj(window.collectedRequests[i]));
  		}
		});
	},false);

	function onNetworkSettingChange(settingName, isActive)
	{
		switch(settingName)
		{
			case "blockUserAgent":
				if (isActive)
				{

				}
				else
				{

				}
				break;
			case "collectHeaders":
				if (isActive)
				{
					addRequestListener(onSendHeaders, onHeadersReceived);
				}
				else
				{
					removeRequestListener(onSendHeaders, onHeadersReceived);
				}
				break;
		}

	}

	function onSendHeaders(details)
	{
		updateRequestObj(details, "send");
		tableList.addItem(details);
	}

	function onHeadersReceived(details)
	{
		updateRequestObj(details, "receive");
		tableList.addItem(details);
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
      	createSubItem(tableList.getItem(accessor), accessor);
        break;
      case "close-expanded-request":
      	//TODO: Remove duplications
      	var requestElem = getParentData(element, "data-expanded", true);
        tableList.removeAllSubItems(requestElem.dataset.access);
        requestElem.focus(); 
        requestElem.dataset.expanded = false;
      	break;
    }
  }

  function createSubItem(itemObj, accessor)
  {
  	for (var param in itemObj)
  	{
  		if (param == "texts" || param == "dataset")
  			continue;

  		if (param == "requestHeaders" || param == "responseHeaders")
  		{
  			var headers = itemObj[param];
  			for (var i = 0; i < headers.length; i++)
  			{
  				tableList.addSubItem({
		  			"dataset": {"access": headers[i].name},
		  			"texts": {"name": headers[i].name, "value": headers[i].value}
		  		}, accessor);
  			}
  			continue;
  		}
  		tableList.addSubItem({
  			"dataset": {"access": param},
  			"texts": {"name": param, "value": itemObj[param]}
  		}, accessor);
  		//tableList.addSubItem(itemObj, accessor)
  		//console.log(itemObj[param]);
  	}
  }

})();
