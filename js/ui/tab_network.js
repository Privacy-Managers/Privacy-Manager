"use strict";

(function()
{
	const blockUserAgentId = "blockUserAgent";
	const collectHeadersId = "collectHeaders";
	var collectedRequests = [];

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
			collectedRequests = window.collectedRequests;
			for (var i = 0; i < collectedRequests.length; i++)
  		{
  			tableList.addItem(cloneObj(collectedRequests[i]));
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

	      const filterParams = ["statusLine", "statusCode", "type", "url", 
	      	"method"];
      	var accessor = element.dataset.access;
      	var itemObj = tableList.getItem(accessor);
      	for (var param in itemObj)
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
      case "copy-all":
      	var dowanloadText = "";
      	for (var i = 0; i < collectedRequests.length; i++)
      	{
      		dowanloadText += "\n\n";
      		var requestObj = collectedRequests[i];
      		for (var param in requestObj)
      		{
      			if (param == "requestHeaders" || param == "responseHeaders")
      			{
              for (var id in requestObj[param])
              {
                var header = requestObj[param][id];
                dowanloadText += "  " + header.name + " : " + header.value + 
                  "\n";
              }
      			}
            else if (param == "dataset")
            {
              dowanloadText += "Action type : " + requestObj[param].type + 
                "\n";
            }
            else if (param != "texts")
            {
              dowanloadText += param + " : " + requestObj[param] + "\n";
            }
      		}
      	}
      	download("requests.txt", dowanloadText);
      	break;
    }
  }

  function download(filename, text)
  {
	  var element = document.createElement("a");
	  element.setAttribute("href", "data:text/plain;charset=utf-8," + 
	  	encodeURIComponent(text));
	  element.setAttribute("download", filename);
	  element.style.display = 'none';
	  document.body.appendChild(element);
	  element.click();
	  document.body.removeChild(element);
	}

  function addSubItem(name, value, accessor)
  {
  	tableList.addSubItem({
			"dataset": {"access": name},
			"texts": {"name": name, "value": value}
		}, accessor);
  }
})();
