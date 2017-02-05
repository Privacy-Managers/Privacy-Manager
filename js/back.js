var listenerRunning = false; 
deleteBrowsingData();
checkHostPermissionsBackground ();
var headersArray = new Array();
chrome.privacy.services.autofillEnabled.get({},function(){});

function deleteBrowsingData () {
	var settings = localStorage.getItem("settings");
	if(settings == null) {
		var settingsJson = {};
		settingsJson.activeTabCookies = true;
		localStorage.setItem("settings", JSON.stringify(settingsJson));
	}
	else {
		var settingsJson = JSON.parse(settings);
		if(settingsJson.deleteAllData == true) {
			console.log("Delete All");
				chrome.browsingData.remove({}, {
				"appcache": true,
				"cache": true,
				"cookies": true,
				"downloads": true,
				"fileSystems": true,
				"formData": true,
				"history": true,
				"indexedDB": true,
				"localStorage": true,
				"pluginData": true,
				"passwords": true,
				"webSQL": true
			});
		}
		else {
			console.log("Delete Partial");
			chrome.browsingData.remove({}, {
				
				"appcache": settingsJson.appcache==true?true:false,
				"cache": settingsJson.cache==true?true:false,
				"cookies": settingsJson.cookies==true?true:false,
				"downloads": settingsJson.downloads==true?true:false,
				"fileSystems": settingsJson.fileSystems==true?true:false,
				"formData": settingsJson.formData==true?true:false,
				"history": settingsJson.history==true?true:false,
				"indexedDB": settingsJson.indexedDB==true?true:false,
				"localStorage": settingsJson.localStorage==true?true:false,
				"pluginData": settingsJson.pluginData==true?true:false,
				"passwords": settingsJson.passwords==true?true:false,
				"webSQL": settingsJson.webSQL==true?true:false
			});
		}
		
	}	
}

function checkHostPermissionsBackground () {
	console.log("CHEKC BAKC");
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
