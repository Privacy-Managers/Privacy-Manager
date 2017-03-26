"use strict";

(function()
{
	var networkSettingIds = ["blockUserAgent", "collectHeaders"];

	document.addEventListener("DOMContentLoaded" , function()
	{
		networkSettingIds.forEach(function(id)
		{
			manageSwitcherById(id);
		});
	},false);

	function manageSwitcherById(id)
	{
		var switcherElem = getSwitcher(id);
		getStorage(id, function(data)
	  {
	  	switcherElem.setAttribute("aria-checked", data[id]);
	  	onNetworkSettingChange(id, data[id]);
	  });

	  switcherElem.addEventListener("click", function()
	  {
	    getStorage(id, function(data)
	    {
	      var obj = {};
	      obj[id] = !data[id];
	      setStorage(obj);
	    });
	  }, false);
	}

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

	}

	chrome.storage.onChanged.addListener(function(change)
	{
		for (var settingName in change)
		{
			if (networkSettingIds.indexOf(settingName) != -1)
			{
				var switcherElem = getSwitcher(settingName);
				switcherElem.setAttribute("aria-checked", change[settingName].newValue);
				onNetworkSettingChange(settingName, change[settingName].newValue);
			}
		}
	});
})();
