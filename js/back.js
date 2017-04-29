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

	//TODO: Think about duplication
	getStorage("settingList", function(data)
	{
		if (data.settingList.collectHeaders)
			startCollectingRequests();
	});

	function deleteBrowsingData(data)
	{
		if (!data)
			return;

		if (data.removeAll == true)
		{
			var data = browsingData.reduce(function(accumulator, dataType)
			{
				if (dataType != "removeAll")
					accumulator[dataType] = true;

				return accumulator;
			}, {});
			chrome.browsingData.remove({}, data);
		}
		else
		{
			delete data.removeAll;
			chrome.browsingData.remove({}, data);
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
	  }
	});

	// Fired on a profile start up
	chrome.runtime.onStartup.addListener(profileStart);


	chrome.webRequest.onBeforeSendHeaders.addListener(
		function(details) {
			var settings = localStorage.getItem("settings");
			if(settings == null) {
				var settingsJson = {};
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				var settingsJson = JSON.parse(settings);
				if(settingsJson.blockUserAgent == true) {
					for (var i = 0; i < details.requestHeaders.length; ++i) {
				      if (details.requestHeaders[i].name === 'User-Agent') {
				        details.requestHeaders.splice(i, 1);
				        break;
				      }
				    }
				    return {requestHeaders: details.requestHeaders};
				}
			}
	  },
	  {urls: ["http://*/*", "https://*/*"]},
		["blocking", "requestHeaders"]);
})(this);
