function tabNetworkLoad() {
	$("#network_tab").show();
	networkActionsBinding();
	networkLocalizationBinding();
	$("#headersTextArea").show();
	showHeaders();
	checkHostsPermissionNetwork(true);
	
}

function networkActionsBinding() {
	$("#network_tab .cb-enable").click(function(){
       networkSwitchCheckboxChange(this, true, true);
    });
    $("#network_tab .cb-disable").click(function(){
        networkSwitchCheckboxChange(this, false, true);
    });
    $("#selectHeaders").click(function(){
    	$("#headersTextArea").select();
    });
    $("#deleteHeaders").click(function(){
    	var bg = chrome.extension.getBackgroundPage();
		bg.headersArray = new Array();
		$("#headersTextArea").html("");
    });
     $("#refreshHeaders").click(function(){
     	showHeaders();
     });
}

function networkSwitchCheckboxChange(obj, onOff, changeSettings) {
    if(onOff) {
        var parent = $(obj).parents('.switch');
        $('.cb-disable',parent).removeClass('selected');
        $(obj).addClass('selected');
        $('.checkbox',parent).attr('checked', true);
        if(changeSettings) {
            networkUpdateSettings($(obj).parents('.rowContainer')[0].id, true)
        }
    }
    else {
        var parent = $(obj).parents('.switch');
        $('.cb-enable',parent).removeClass('selected');
        $(obj).addClass('selected');
        $('.checkbox',parent).attr('checked', false);
        if(changeSettings) {
            networkUpdateSettings($(obj).parents('.rowContainer')[0].id, false)
        }
    }
}

function networkLocalizationBinding() {
	if(window.navigator.language == "ru") {
		$("#selectHeaders").css("font-size", "10px");	
		$("#deleteHeaders").css("font-size", "10px");	
		$("#refreshHeaders").css("font-size", "10px");	
		$("#network_tab").css("padding-right", "20px");	
		var onButtons = $(".cb-enable span");
		var offButtons = $(".cb-disable span");
		onButtons.css("font-size", "9px");
		onButtons.css("padding", "0 4px");
		offButtons.css("font-size", "9px");
		offButtons.css("padding", "0 4px");
		
		for (var i=0; i < onButtons.length; i++) {
		  onButtons[i].innerHTML= chrome.i18n.getMessage("onButton");
		  offButtons[i].innerHTML= chrome.i18n.getMessage("offButton");
		}
	}
	$("#allowHostPermissionsNetwork .settingName").html(chrome.i18n.getMessage("allowHostPermissionsNetwork"));
	$("#allowHostPermissionsNetwork .settingName").attr("title", chrome.i18n.getMessage("allowHostPermissionsNetwork_desc"));
	$("#allowHostPermissionsNetwork .infoIcon").attr("title", chrome.i18n.getMessage("allowHostPermissionsNetwork_desc"));
	
	$("#blockUserAgent .settingName").html(chrome.i18n.getMessage("blockUserAgent"));
	$("#blockUserAgent .settingName").attr("title", chrome.i18n.getMessage("blockUserAgent_desc"));
	$("#blockUserAgent .infoIcon").attr("title", chrome.i18n.getMessage("blockUserAgent_desc"));
	
	$("#collectHeaders .settingName").html(chrome.i18n.getMessage("collectHeaders"));
	$("#collectHeaders .settingName").attr("title", chrome.i18n.getMessage("collectHeaders_desc"));
	$("#collectHeaders .infoIcon").attr("title", chrome.i18n.getMessage("collectHeaders_desc"));
	
	$("#selectHeaders").val(chrome.i18n.getMessage("selectHeaders"));
	$("#deleteHeaders").val(chrome.i18n.getMessage("deleteHeaders"));
	$("#refreshHeaders").val(chrome.i18n.getMessage("refreshHeaders"));
	
}

function networkUpdateSettings(settingName, onOff) {
	var settings = localStorage.getItem("settings");
	var settingsJson = JSON.parse(settings);
	
	switch(settingName)
	{
		case "allowHostPermissionsNetwork":
				if(onOff) {hostPermissionNetwork(true);}
				else {hostPermissionNetwork(false);}
		break;
		case "collectHeaders":
				if(onOff) {	settingsJson.collectHeaders = true; localStorage.setItem("settings", JSON.stringify(settingsJson)); checkHostsPermissionNetwork(true);}
				else { settingsJson.collectHeaders = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "blockUserAgent":
				if(onOff) {	settingsJson.blockUserAgent = true; localStorage.setItem("settings", JSON.stringify(settingsJson));checkHostsPermissionNetwork(true);}
				else { settingsJson.blockUserAgent = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
    }
}

function hostPermissionNetwork(allow) {
	var settings = localStorage.getItem("settings");
	var settingsJson = JSON.parse(settings);
	
	if(allow) {
		chrome.permissions.request({
			origins: ['http://*/*', 'https://*/*']
		}, function(granted) {
			// The callback argument will be true if the user granted the permissions.
			if (granted) {
				checkNetworkSettings(true);
			//	$("#selectHeaders").prop('disabled', false);
			//	$("#deleteHeaders").prop('disabled', false);
			//	$("#headersTextArea").prop('disabled', false);
			} else {
			}
		});
	}
	else {
		chrome.permissions.remove({
			origins: ['http://*/*', 'https://*/*']
		}, function(removed) {
			if (removed) {
			//	$("#selectHeaders").prop('disabled', true);
			//	$("#deleteHeaders").prop('disabled', true);
			//	$("#headersTextArea").prop('disabled', true);
				
				var myElement = $("#blockUserAgent .cb-disable");
				cookiesSwitchCheckboxChange(myElement, false, false);
				var myElement = $("#collectHeaders .cb-disable");
				cookiesSwitchCheckboxChange(myElement, false, false);
			} else {
	  		}
		});
	}
}

function checkHostsPermissionNetwork(load) {
	chrome.permissions.contains({
		origins: ['http://*/*', 'https://*/*']
	}, function(result) {
		if (result) {
			var myElement = $("#allowHostPermissionsNetwork .cb-enable");
			networkSwitchCheckboxChange(myElement, true, false);
			
			checkNetworkSettings(load);
			return true;
		} else {
		//	$("#selectHeaders").prop('disabled', true);
		//	$("#deleteHeaders").prop('disabled', true);
		//	$("#headersTextArea").prop('disabled', true);
			
			var myElement = $("#blockUserAgent .cb-disable");
			cookiesSwitchCheckboxChange(myElement, false, false);
			var myElement = $("#collectHeaders .cb-disable");
			cookiesSwitchCheckboxChange(myElement, false, false);
			
			var myElement = $("#allowHostPermissionsNetwork .cb-disable");
			networkSwitchCheckboxChange(myElement, false, false);
			return false;
		}
	});
}
function checkNetworkSettings(load) {
	
	
	var settings = localStorage.getItem("settings");
	if(settings == null) {
		var settingsJson = {};
		localStorage.setItem("settings", JSON.stringify(settingsJson));
	}
	else {
		var settingsJson = JSON.parse(settings);
		
		/*
		 * Allow Collect Headers
		 */
		if(settingsJson.collectHeaders == null) {
			settingsJson.collectHeaders = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#collectHeaders .cb-disable");
			networkSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.collectHeaders == false) {
			var myElement = $("#collectHeaders .cb-disable");
			networkSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var bg = chrome.extension.getBackgroundPage();
			bg.checkHostPermissionsBackground ();
			var myElement = $("#collectHeaders .cb-enable");
			networkSwitchCheckboxChange(myElement, true, false);
			showHeaders();
		}
		
		/*
		 * Block User Agent
		 */
		if(settingsJson.blockUserAgent == null) {
			settingsJson.blockUserAgent = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#blockUserAgent .cb-disable");
			networkSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.blockUserAgent == false) {
			var myElement = $("#blockUserAgent .cb-disable");
			networkSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#blockUserAgent .cb-enable");
			networkSwitchCheckboxChange(myElement, true, false);
		}
	}
}


function showHeaders() {
	var bg = chrome.extension.getBackgroundPage();
	var headersArray = bg.headersArray;
	console.log(headersArray.length);
	var headersTextAreaText = "";
	for (var i=0; i < headersArray.length; i++) {
		
	  headersTextAreaText+= "method: "+headersArray[i].method+"\n";
	  headersTextAreaText+= "statusLine: "+headersArray[i].statusLine+"\n";
	  headersTextAreaText+= "url: "+headersArray[i].url+(i==headersArray.length-1?"":"\n\n");
	};
	
	$("#headersTextArea").html(headersTextAreaText);
}
