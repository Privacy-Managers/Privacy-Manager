"use strict";

(function()
{
	function profileStart()
	{
		getStorage("browsingData", function(data){
			deleteBrowsingData(data.browsingData);
		});
	}

	function deleteBrowsingData(data)
	{
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

	// Fired on a profile start up
	chrome.runtime.onStartup.addListener(profileStart);


	var listenerRunning = false; 
	checkHostPermissionsBackground ();
	var headersArray = new Array();

	function checkHostPermissionsBackground () {
		chrome.permissions.contains({
			origins: ['http://*/*', 'https://*/*']
		}, function(result) {
			if (result) {
				if(!listenerRunning) {
					addListenersNetwork();
				}
			} else {
			}
		});
	}

	function addListenersNetwork() {
		chrome.webRequest.onHeadersReceived.addListener(
		function (details){
			listenerRunning = true;
			var settings = localStorage.getItem("settings");
			if(settings == null) {
				var settingsJson = {};
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				var settingsJson = JSON.parse(settings);
				if(settingsJson.collectHeaders == true) {
					if(headersArray.length>1000) {
						headersArray.shift();
					}
					headersArray.push(details);
				}
		}
	}, {urls: ["http://*/*", "https://*/*"]});



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
	}
})();
