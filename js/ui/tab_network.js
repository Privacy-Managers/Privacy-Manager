"use strict";

(function()
{
	const blockUserAgentId = "blockUserAgent";
	const collectHeadersId = "collectHeaders";

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
					collectHeaders();
				}
				else
				{
					
				}
				break;
		}

	}

	function collectHeaders()
	{
		chrome.webRequest.onHeadersReceived.addListener(function(details)
		{
			console.log(details);
		}, {urls: ["<all_urls>"]});
	}
})();
