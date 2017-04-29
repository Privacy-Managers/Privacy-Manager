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

		tableList = new TableList(Elem("#requestList"), Elem("#requestListTemplate"), null, null);

		chrome.runtime.getBackgroundPage(function(window)
		{
			for (var i = 0; i < window.collectedRequests.length; i++)
  		{
  			tableList.addItem(window.collectedRequests[i]);
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

	function createRequestObj(url, statusCode)
  {
    return {
      dataset: {
        access: "id"
      },
      texts: {
        url: url,
        statusCode: statusCode
      }
    };
  }
})();
