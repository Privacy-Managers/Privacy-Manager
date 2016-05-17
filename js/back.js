
var listenerRunning = false; 
deleteBrowsingData();
checkHostPermissionsBackground ();
var headersArray = new Array();
chrome.privacy.services.autofillEnabled.get({},function(){console.log("hello")});
updatePrivacySettings();

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

function updatePrivacySettings() {
	var settings = localStorage.getItem("settings");
	if(settings == null) {
		var settingsJson = {};
		localStorage.setItem("settings", JSON.stringify(settingsJson));
	}
	else {
		var settingsJson = JSON.parse(settings);
		// Check for thirdPartyCookiesAllowed
		var thirdParty = chrome.privacy.websites.thirdPartyCookiesAllowed;
		thirdParty.get({}, function(details) {
			if (details.value) {
				settingsJson.thirdParty = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.thirdParty = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			
		});
		
		// Check for autofillEnabled
		var autoFill = chrome.privacy.services.autofillEnabled;
		autoFill.get({}, function(details) {
			if (details.value) {
				settingsJson.autoFill = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.autoFill = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for safeBrowsingEnabled
		var safeBrowsing = chrome.privacy.services.safeBrowsingEnabled;
		safeBrowsing.get({}, function(details) {
			if (details.value) {
				settingsJson.safeBrowsing = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.safeBrowsing = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for searchSuggestEnabled
		var searchSuggest = chrome.privacy.services.searchSuggestEnabled;
		searchSuggest.get({}, function(details) {
			if (details.value) {
				settingsJson.searchSuggest = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.searchSuggest = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for searchSuggestEnabled
		var spellingService = chrome.privacy.services.spellingServiceEnabled;
		spellingService.get({}, function(details) {
			if (details.value) {
				settingsJson.spellingService = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.spellingService = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for translationServiceEnabled
		var translationService = chrome.privacy.services.translationServiceEnabled;
		translationService.get({}, function(details) {
			if (details.value) {
				settingsJson.translationService = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.translationService = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for hyperlinkAuditingEnabled
		var hyperlinkAuditing = chrome.privacy.websites.hyperlinkAuditingEnabled;
		hyperlinkAuditing.get({}, function(details) {
			if (details.value) {
				settingsJson.hyperlinkAuditing = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.hyperlinkAuditing = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for referrersEnabled
		var referrersEnabled = chrome.privacy.websites.referrersEnabled;
		referrersEnabled.get({}, function(details) {
			if (details.value) {
				settingsJson.referrersEnabled = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.referrersEnabled = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for networkPredictionEnabled
		var networkPrediction = chrome.privacy.network.networkPredictionEnabled;
		networkPrediction.get({}, function(details) {
			if (details.value) {
				settingsJson.networkPrediction = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.networkPrediction = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		
		// Check for alternateErrorPagesEnabled
		var alternateError = chrome.privacy.services.alternateErrorPagesEnabled;
		alternateError.get({}, function(details) {
			if (details.value) {
				settingsJson.alternateError = true;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
			else {
				settingsJson.alternateError = false;
				localStorage.setItem("settings", JSON.stringify(settingsJson));
			}
		});
		var protectedContent = chrome.privacy.websites.protectedContentEnabled;
		if(protectedContent == null) {
			settingsJson.protectedContent = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
		}
		else {
			// Check for protectedContentEnabled
			protectedContent.get({}, function(details) {
				if (details.value) {
					settingsJson.protectedContent = true;
					localStorage.setItem("settings", JSON.stringify(settingsJson));
				}
				else {
					settingsJson.protectedContent = false;
					localStorage.setItem("settings", JSON.stringify(settingsJson));
				}
			});
		}
	}
}

