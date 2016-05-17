function tabMainLoad() {
	mainActionsBinding();
	mainLocalizationBinding();
	mainCheckChromeSettings();
}


function mainActionsBinding() {
	$("#main_tab .cb-enable").click(function(){
    	mainSwitchCheckboxChange(this, true, true);
    });
    $("#main_tab .cb-disable").click(function(){
    	mainSwitchCheckboxChange(this, false, true);
    });
    $("#incognito").click(function(){
    	runIncognito();
    });
    
    if(chrome.privacy.websites.protectedContentEnabled == undefined) {
		$("#protectedContentEnabled .cb-enable").unbind("click");
		$("#protectedContentEnabled .settingName").css("color", "grey");
	}
	$("#instantEnabled .cb-enable").unbind("click");
	$("#instantEnabled .settingName").css("color", "grey");
}

function runIncognito () {
	chrome.tabs.query({active:true},function(tab){
		var currentUrl = tab[0].url.toString();
		if(currentUrl.indexOf("chrome://") ==-1) {
			chrome.windows.create({url: tab[0].url, incognito: true});
		}
		else {
			alert("Sorry you can't run current active page in incognito mode.");
		}
	});
}

function mainSwitchCheckboxChange(obj, onOff, changeSettings) {
	if(onOff) {
		var parent = $(obj).parents('.switch');
		$('.cb-disable',parent).removeClass('selected');
		$(obj).addClass('selected');
		$('.checkbox',parent).attr('checked', true);
		if(changeSettings) {
			mainUpdateChromeSettings($(obj).parents('.rowContainer')[0].id, true)
		}
	}
	else {
        var parent = $(obj).parents('.switch');
        $('.cb-enable',parent).removeClass('selected');
        $(obj).addClass('selected');
        $('.checkbox',parent).attr('checked', false);
        if(changeSettings) {
			mainUpdateChromeSettings($(obj).parents('.rowContainer')[0].id, false)
		}
	}
}

function mainLocalizationBinding() {
	$("#privacyManagement .serviceHeader").html(chrome.i18n.getMessage("privacyManagement"));
	$("#startupClear .serviceHeader").html(chrome.i18n.getMessage("startupClear"));
	$("#incognito").val(chrome.i18n.getMessage("incognitoButton"));
	if(window.navigator.language == "ru") {
		$(".serviceHeader").css('font-size', "18px");
		$("#incognito").css('padding', "1px 25px");
		
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
	
	
	$("#thirdPartyCookiesAllowed .settingName").html(chrome.i18n.getMessage("thirdPartyCookiesAllowed"));
	$("#thirdPartyCookiesAllowed .settingName").attr("title", chrome.i18n.getMessage("thirdPartyCookiesAllowed_desc"));
	$("#thirdPartyCookiesAllowed .infoIcon").attr("title", chrome.i18n.getMessage("thirdPartyCookiesAllowed_desc"));
	
	$("#autofillEnabled .settingName").html(chrome.i18n.getMessage("autofillEnabled"));
	$("#autofillEnabled .settingName").attr("title", chrome.i18n.getMessage("autofillEnabled_desc"));
	$("#autofillEnabled .infoIcon").attr("title", chrome.i18n.getMessage("autofillEnabled_desc"));
	
	$("#instantEnabled .settingName").html(chrome.i18n.getMessage("instantEnabled"));
	$("#instantEnabled .settingName").attr("title", chrome.i18n.getMessage("instantEnabled_desc"));
	$("#instantEnabled .infoIcon").attr("title", chrome.i18n.getMessage("instantEnabled_desc"));
	
	$("#safeBrowsingEnabled .settingName").html(chrome.i18n.getMessage("safeBrowsingEnabled"));
	$("#safeBrowsingEnabled .settingName").attr("title", chrome.i18n.getMessage("safeBrowsingEnabled_desc"));
	$("#safeBrowsingEnabled .infoIcon").attr("title", chrome.i18n.getMessage("safeBrowsingEnabled_desc"));
	
	$("#searchSuggestEnabled .settingName").html(chrome.i18n.getMessage("searchSuggestEnabled"));
	$("#searchSuggestEnabled .settingName").attr("title", chrome.i18n.getMessage("searchSuggestEnabled_desc"));
	$("#searchSuggestEnabled .infoIcon").attr("title", chrome.i18n.getMessage("searchSuggestEnabled_desc"));
	
	$("#spellingServiceEnabled .settingName").html(chrome.i18n.getMessage("spellingServiceEnabled"));
	$("#spellingServiceEnabled .settingName").attr("title", chrome.i18n.getMessage("spellingServiceEnabled_desc"));
	$("#spellingServiceEnabled .infoIcon").attr("title", chrome.i18n.getMessage("spellingServiceEnabled_desc"));
		
	$("#translationServiceEnabled .settingName").html(chrome.i18n.getMessage("translationServiceEnabled"));
	$("#translationServiceEnabled .settingName").attr("title", chrome.i18n.getMessage("translationServiceEnabled_desc"));
	$("#translationServiceEnabled .infoIcon").attr("title", chrome.i18n.getMessage("translationServiceEnabled_desc"));
			
	$("#hyperlinkAuditingEnabled .settingName").html(chrome.i18n.getMessage("hyperlinkAuditingEnabled"));
	$("#hyperlinkAuditingEnabled .settingName").attr("title", chrome.i18n.getMessage("hyperlinkAuditingEnabled_desc"));
	$("#hyperlinkAuditingEnabled .infoIcon").attr("title", chrome.i18n.getMessage("hyperlinkAuditingEnabled_desc"));
			
	$("#referrersEnabled .settingName").html(chrome.i18n.getMessage("referrersEnabled"));
	$("#referrersEnabled .settingName").attr("title", chrome.i18n.getMessage("referrersEnabled_desc"));
	$("#referrersEnabled .infoIcon").attr("title", chrome.i18n.getMessage("referrersEnabled_desc"));
			
	$("#networkPredictionEnabled .settingName").html(chrome.i18n.getMessage("networkPredictionEnabled"));
	$("#networkPredictionEnabled .settingName").attr("title", chrome.i18n.getMessage("networkPredictionEnabled_desc"));
	$("#networkPredictionEnabled .infoIcon").attr("title", chrome.i18n.getMessage("networkPredictionEnabled_desc"));
				
	$("#alternateErrorPagesEnabled .settingName").html(chrome.i18n.getMessage("alternateErrorPagesEnabled"));
	$("#alternateErrorPagesEnabled .settingName").attr("title", chrome.i18n.getMessage("alternateErrorPagesEnabled_desc"));
	$("#alternateErrorPagesEnabled .infoIcon").attr("title", chrome.i18n.getMessage("alternateErrorPagesEnabled_desc"));
	
	$("#protectedContentEnabled .settingName").html(chrome.i18n.getMessage("protectedContentEnabled"));
	$("#protectedContentEnabled .settingName").attr("title", chrome.i18n.getMessage("protectedContentEnabled_desc"));
	$("#protectedContentEnabled .infoIcon").attr("title", chrome.i18n.getMessage("protectedContentEnabled_desc"));
	
	$("#deleteAllData .settingName").html(chrome.i18n.getMessage("deleteAllData"));
	$("#deleteAllData .settingName").attr("title", chrome.i18n.getMessage("deleteAllData_desc"));
	$("#deleteAllData .infoIcon").attr("title", chrome.i18n.getMessage("deleteAllData_desc"));				
	
	$("#cookies .settingName").html(chrome.i18n.getMessage("cookies"));
	$("#cookies .settingName").attr("title", chrome.i18n.getMessage("cookies_desc"));
	$("#cookies .infoIcon").attr("title", chrome.i18n.getMessage("cookies_desc"));
	
	$("#appcache .settingName").html(chrome.i18n.getMessage("appcache"));
	$("#appcache .settingName").attr("title", chrome.i18n.getMessage("appcache_desc"));
	$("#appcache .infoIcon").attr("title", chrome.i18n.getMessage("appcache_desc"));
		
	$("#cache .settingName").html(chrome.i18n.getMessage("cache"));
	$("#cache .settingName").attr("title", chrome.i18n.getMessage("cache_desc"));
	$("#cache .infoIcon").attr("title", chrome.i18n.getMessage("cache_desc"));
			
	$("#downloads .settingName").html(chrome.i18n.getMessage("downloads"));
	$("#downloads .settingName").attr("title", chrome.i18n.getMessage("downloads_desc"));
	$("#downloads .infoIcon").attr("title", chrome.i18n.getMessage("downloads_desc"));
				
	$("#fileSystems .settingName").html(chrome.i18n.getMessage("fileSystems"));
	$("#fileSystems .settingName").attr("title", chrome.i18n.getMessage("fileSystems_desc"));
	$("#fileSystems .infoIcon").attr("title", chrome.i18n.getMessage("fileSystems_desc"));
					
	$("#formData .settingName").html(chrome.i18n.getMessage("formData"));
	$("#formData .settingName").attr("title", chrome.i18n.getMessage("formData_desc"));
	$("#formData .infoIcon").attr("title", chrome.i18n.getMessage("formData_desc"));
						
	$("#history .settingName").html(chrome.i18n.getMessage("history"));
	$("#history .settingName").attr("title", chrome.i18n.getMessage("history_desc"));
	$("#history .infoIcon").attr("title", chrome.i18n.getMessage("history_desc"));
							
	$("#indexedDB .settingName").html(chrome.i18n.getMessage("indexedDB"));
	$("#indexedDB .settingName").attr("title", chrome.i18n.getMessage("indexedDB_desc"));
	$("#indexedDB .infoIcon").attr("title", chrome.i18n.getMessage("indexedDB_desc"));
								
	$("#localStorage .settingName").html(chrome.i18n.getMessage("localStorage"));
	$("#localStorage .settingName").attr("title", chrome.i18n.getMessage("localStorage_desc"));
	$("#localStorage .infoIcon").attr("title", chrome.i18n.getMessage("localStorage_desc"));
									
	$("#pluginData .settingName").html(chrome.i18n.getMessage("pluginData"));
	$("#pluginData .settingName").attr("title", chrome.i18n.getMessage("pluginData_desc"));
	$("#pluginData .infoIcon").attr("title", chrome.i18n.getMessage("pluginData_desc"));
										
	$("#passwords .settingName").html(chrome.i18n.getMessage("passwords"));
	$("#passwords .settingName").attr("title", chrome.i18n.getMessage("passwords_desc"));
	$("#passwords .infoIcon").attr("title", chrome.i18n.getMessage("passwords_desc"));
											
	$("#webSQL .settingName").html(chrome.i18n.getMessage("webSQL"));
	$("#webSQL .settingName").attr("title", chrome.i18n.getMessage("webSQL_desc"));
	$("#webSQL .infoIcon").attr("title", chrome.i18n.getMessage("webSQL_desc"));
}

function mainCheckChromeSettings(){
	/*
	// Check for thirdPartyCookiesAllowed
	var thirdParty = chrome.privacy.websites.thirdPartyCookiesAllowed;
	thirdParty.get({}, function(details) {
		console.log("here");
		if (details.value) {
			var myElement = $("#thirdPartyCookiesAllowed .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#thirdPartyCookiesAllowed .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
	});
	
	// Check for autofillEnabled
	var autoFill = chrome.privacy.services.autofillEnabled;
	autoFill.get({}, function(details) {
		if (details.value) {
			var myElement = $("#autofillEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#autofillEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for instantEnabled
	chrome.privacy.services.instantEnabled.get({}, function(details) {
		if (details.value) {
			var myElement = $("#instantEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#instantEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for safeBrowsingEnabled
	var safeBrowsing = chrome.privacy.services.safeBrowsingEnabled;
	safeBrowsing.get({}, function(details) {
		if (details.value) {
			var myElement = $("#safeBrowsingEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#safeBrowsingEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for searchSuggestEnabled
	var searchSuggest = chrome.privacy.services.searchSuggestEnabled;
	searchSuggest.get({}, function(details) {
		if (details.value) {
			var myElement = $("#searchSuggestEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#searchSuggestEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for spellingServiceEnabled
	var spellingService = chrome.privacy.services.spellingServiceEnabled;
	spellingService.get({}, function(details) {
		if (details.value) {
			var myElement = $("#spellingServiceEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#spellingServiceEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for translationServiceEnabled
	var translationService = chrome.privacy.services.translationServiceEnabled;
	translationService.get({}, function(details) {
		if (details.value) {
			var myElement = $("#translationServiceEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#translationServiceEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for hyperlinkAuditingEnabled
	var hyperlinkAuditing = chrome.privacy.websites.hyperlinkAuditingEnabled;
	hyperlinkAuditing.get({}, function(details) {
		if (details.value) {
			var myElement = $("#hyperlinkAuditingEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#hyperlinkAuditingEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for referrersEnabled
	var referrersEnabled = chrome.privacy.websites.referrersEnabled;
	referrersEnabled.get({}, function(details) {
		if (details.value) {
			var myElement = $("#referrersEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#referrersEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for networkPredictionEnabled
	var networkPrediction = chrome.privacy.network.networkPredictionEnabled;
	networkPrediction.get({}, function(details) {
		if (details.value) {
			var myElement = $("#networkPredictionEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#networkPredictionEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	
	// Check for alternateErrorPagesEnabled
	var alternateError = chrome.privacy.services.alternateErrorPagesEnabled;
	alternateError.get({}, function(details) {
		if (details.value) {
			var myElement = $("#alternateErrorPagesEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#alternateErrorPagesEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
	});
	var protectedContent = chrome.privacy.websites.protectedContentEnabled;
	if(protectedContent == null) {
		$("#main_tab #protectedContentEnabled .cb-enable").unbind();
		$("#main_tab #protectedContentEnabled .cb-disable").unbind();
		$("#protectedContentEnabled").css("color", "grey");
	}
	else {
		// Check for protectedContentEnabled
		protectedContent.get({}, function(details) {
			if (details.value) {
				var myElement = $("#protectedContentEnabled .cb-enable");
				mainSwitchCheckboxChange(myElement, true, false);
			}
			else {
				var myElement = $("#protectedContentEnabled .cb-disable");
				mainSwitchCheckboxChange(myElement, false, false);
			}
		});
	}
	*/
	
	BGPage.updatePrivacySettings();
	var settings = localStorage.getItem("settings");
	if(settings == null) {
		var settingsJson = {};
		localStorage.setItem("settings", JSON.stringify(settingsJson));
	}
	else {
		var settingsJson = JSON.parse(settings);
		
		
		/*
		 * thirdPartyCookiesAllowed
		 */
		if(settingsJson.thirdParty == true) {
			var myElement = $("#thirdPartyCookiesAllowed .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#thirdPartyCookiesAllowed .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * autofillEnabled
		 */
		if(settingsJson.autoFill == true) {
			var myElement = $("#autofillEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#autofillEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * safeBrowsingEnabled
		 */
		if(settingsJson.safeBrowsing == true) {
			var myElement = $("#safeBrowsingEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#safeBrowsingEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * searchSuggestEnabled
		 */
		if(settingsJson.searchSuggest == true) {
			var myElement = $("#searchSuggestEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#searchSuggestEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * spellingServiceEnabled
		 */
		if(settingsJson.spellingService == true) {
			var myElement = $("#spellingServiceEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#spellingServiceEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * translationServiceEnabled
		 */
		if(settingsJson.translationService == true) {
			var myElement = $("#translationServiceEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#translationServiceEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * hyperlinkAuditingEnabled
		 */
		if(settingsJson.hyperlinkAuditing == true) {
			var myElement = $("#hyperlinkAuditingEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#hyperlinkAuditingEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * referrersEnabled
		 */
		if(settingsJson.referrersEnabled == true) {
			var myElement = $("#referrersEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#referrersEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * networkPredictionEnabled
		 */
		if(settingsJson.networkPrediction == true) {
			var myElement = $("#networkPredictionEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#networkPredictionEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * alternateErrorPagesEnabled
		 */
		if(settingsJson.alternateError == true) {
			var myElement = $("#alternateErrorPagesEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#alternateErrorPagesEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		/*
		 * protectedContentEnabled
		 */
		if(settingsJson.protectedContent == true) {
			var myElement = $("#protectedContentEnabled .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		else {
			var myElement = $("#protectedContentEnabled .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		
		
		
		
		/*
		 * Cookies
		 */
		if(settingsJson.cookies == null) {
			settingsJson.cookies = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#cookies .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.cookies == false) {
			var myElement = $("#cookies .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#cookies .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * appcache
		 */
		if(settingsJson.appcache == null) {
			settingsJson.appcache = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#appcache .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.appcache == false) {
			var myElement = $("#appcache .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#appcache .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * cache
		 */
		if(settingsJson.cache == null) {
			settingsJson.cache = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#cache .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.cache == false) {
			var myElement = $("#cache .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#cache .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * downloads
		 */
		if(settingsJson.downloads == null) {
			settingsJson.downloads = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#downloads .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.downloads == false) {
			var myElement = $("#downloads .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#downloads .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * fileSystems
		 */
		if(settingsJson.fileSystems == null) {
			settingsJson.fileSystems = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#fileSystems .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.fileSystems == false) {
			var myElement = $("#fileSystems .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#fileSystems .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * formData
		 */
		if(settingsJson.formData == null) {
			settingsJson.formData = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#formData .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.formData == false) {
			var myElement = $("#formData .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#formData .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * history
		 */
		if(settingsJson.history == null) {
			settingsJson.history = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#history .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.history == false) {
			var myElement = $("#history .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#history .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * indexedDB
		 */
		if(settingsJson.indexedDB == null) {
			settingsJson.indexedDB = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#indexedDB .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.indexedDB == false) {
			var myElement = $("#indexedDB .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#indexedDB .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * localStorage
		 */
		if(settingsJson.localStorage == null) {
			settingsJson.localStorage = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#localStorage .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.localStorage == false) {
			var myElement = $("#localStorage .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#localStorage .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * pluginData
		 */
		if(settingsJson.pluginData == null) {
			settingsJson.pluginData = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#pluginData .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.pluginData == false) {
			var myElement = $("#pluginData .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#pluginData .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * passwords
		 */
		if(settingsJson.passwords == null) {
			settingsJson.passwords = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#passwords .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.passwords == false) {
			var myElement = $("#passwords .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#passwords .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		/*
		 * webSQL
		 */
		if(settingsJson.webSQL == null) {
			settingsJson.webSQL = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#webSQL .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.webSQL == false) {
			var myElement = $("#webSQL .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			var myElement = $("#webSQL .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
		}
		
		
		/*
		 * deleteAllData
		 */
		if(settingsJson.deleteAllData == null) {
			settingsJson.deleteAllData = false;
			localStorage.setItem("settings", JSON.stringify(settingsJson));
			var myElement = $("#deleteAllData .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else if(settingsJson.deleteAllData == false) {
			var myElement = $("#deleteAllData .cb-disable");
			mainSwitchCheckboxChange(myElement, false, false);
		}
		else {
			//TODO add here logic to disable all other options
			$("#main_tab #startupClear .cb-enable").not("#main_tab #startupClear #deleteAllData .cb-enable").unbind();
			var AllStartDisableArray = $("#main_tab #startupClear .cb-disable").not("#main_tab #startupClear #deleteAllData .cb-disable").unbind();
			$("#main_tab #startupClear .rowContainer").not("#main_tab #startupClear #deleteAllData").css("color", "grey");
			
			var myElement = $("#deleteAllData .cb-enable");
			mainSwitchCheckboxChange(myElement, true, false);
			for (var i=0; i < AllStartDisableArray.length; i++) {
				mainSwitchCheckboxChange(AllStartDisableArray[i], false, false);
			};
		}
	}
}

function mainUpdateChromeSettings(settingName, onOff) {
	var settings = localStorage.getItem("settings");
	var settingsJson = JSON.parse(settings);
	
	switch(settingName)
	{
		
		case "thirdPartyCookiesAllowed":
				if(onOff) {	
					var thirdParty = chrome.privacy.websites.thirdPartyCookiesAllowed; 
					thirdParty.set({value:true});	
				}
				else { 
					var thirdParty = chrome.privacy.websites.thirdPartyCookiesAllowed; 
					thirdParty.set({value:false}); 
				}
		break;
		case "autofillEnabled":
				if(onOff) {	
					var autofill = chrome.privacy.services.autofillEnabled; 
					autofill.set({value:true});	
				}
				else { 
					var autofill = chrome.privacy.services.autofillEnabled; 
					autofill.set({value:false}); 
				}
		break;
		//case "instantEnabled":
		//		if(onOff) {	chrome.privacy.services.instantEnabled.set({value:true});	}
		//		else { chrome.privacy.services.instantEnabled.set({value:false}); }
		//break;
		case "safeBrowsingEnabled":
				if(onOff) {	
					var safeBrowsing = chrome.privacy.services.safeBrowsingEnabled; 
					safeBrowsing.set({value:true});	
				}
				else { 
					var safeBrowsing = chrome.privacy.services.safeBrowsingEnabled; 
					safeBrowsing.set({value:false}); 
				}
		break;
		case "searchSuggestEnabled":
				if(onOff) {	
					var searchSuggest = chrome.privacy.services.searchSuggestEnabled; 
					searchSuggest.set({value:true});	
				}
				else { 
					var searchSuggest = chrome.privacy.services.searchSuggestEnabled; 
					searchSuggest.set({value:false}); 
				}
		break;
		case "spellingServiceEnabled":
				if(onOff) {	
					var spellingService = chrome.privacy.services.spellingServiceEnabled; 
					spellingService.set({value:true});	
				}
				else { 
					var spellingService = chrome.privacy.services.spellingServiceEnabled; 
					spellingService.set({value:false}); 
				}
		break;
		case "translationServiceEnabled":
				if(onOff) {	
					var translationService = chrome.privacy.services.translationServiceEnabled; 
					translationService.set({value:true});	
				}
				else { 
					var translationService = chrome.privacy.services.translationServiceEnabled; 
					translationService.set({value:false}); 
				}
		break;
		case "hyperlinkAuditingEnabled":
				if(onOff) {	
					var hyperlinkAudition = chrome.privacy.websites.hyperlinkAuditingEnabled; 
					hyperlinkAudition.set({value:true});	
				}
				else { 
					var hyperlinkAudition = chrome.privacy.websites.hyperlinkAuditingEnabled; 
					hyperlinkAudition.set({value:false}); 
				}
		break;
		case "referrersEnabled":
				if(onOff) {	
					var referrer = chrome.privacy.websites.referrersEnabled; 
					referrer.set({value:true});	
				}
				else { 
					var referrer = chrome.privacy.websites.referrersEnabled; 
					referrer.set({value:false}); 
				}
		break;
		case "networkPredictionEnabled":
				if(onOff) {	
					var networkPrediction = chrome.privacy.network.networkPredictionEnabled; 
					networkPrediction.set({value:true});	
				}
				else { 
					var networkPrediction = chrome.privacy.network.networkPredictionEnabled; 
					networkPrediction.set({value:false}); 
				}
		break;
		case "alternateErrorPagesEnabled":
				if(onOff) {	
					var alternateError = chrome.privacy.services.alternateErrorPagesEnabled; 
					alternateError.set({value:true});	
				}
				else { 
					var alternateError = chrome.privacy.services.alternateErrorPagesEnabled; 
					alternateError.set({value:false}); 
				}
		break;
		case "protectedContentEnabled":
				var protectedContent = chrome.privacy.websites.protectedContentEnabled;
				
				if(protectedContent == null) {
					
				}
				else {
					if(onOff) {	
						protectedContent.set({value:true});	
					}
					else { 
						protectedContent.set({value:false}); 
					}
				}
		break;
		// Chrome browser close part
		case "deleteAllData":
				if(onOff) {
					$("#main_tab #startupClear .cb-enable").not("#main_tab #startupClear #deleteAllData .cb-enable").unbind();
					var AllStartDisableArray = $("#main_tab #startupClear .cb-disable").not("#main_tab #startupClear #deleteAllData .cb-disable").unbind();
					for (var i=0; i < AllStartDisableArray.length; i++) {
						mainSwitchCheckboxChange(AllStartDisableArray[i], false, false);
					};
					$("#main_tab #startupClear .rowContainer").not("#main_tab #startupClear #deleteAllData").css("color", "grey");
					settingsJson.deleteAllData = true; 
					localStorage.setItem("settings", JSON.stringify(settingsJson));
				}
				else {
					//TODO Enable here
					$("#main_tab #startupClear .cb-enable").not("#main_tab #startupClear #deleteAllData .cb-enable").unbind();
					$("#main_tab #startupClear .cb-disable").not("#main_tab #startupClear #deleteAllData .cb-disable").unbind();
					$("#main_tab #startupClear .cb-enable").not("#main_tab #startupClear #deleteAllData .cb-enable").click(function(){
    					mainSwitchCheckboxChange(this, true, true);
   					});
					$("#main_tab #startupClear .cb-disable").not("#main_tab #startupClear #deleteAllData .cb-disable").click(function(){
    					mainSwitchCheckboxChange(this, false, true);
    				});
					$("#main_tab #startupClear .rowContainer").not("#main_tab #startupClear #deleteAllData").css("color", "black");
					settingsJson.deleteAllData = false; 
					localStorage.setItem("settings", JSON.stringify(settingsJson));
					mainCheckChromeSettings();
				}
		break;
		case "cookies":
				if(onOff) {	settingsJson.cookies = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.cookies = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "appcache":
				if(onOff) {	settingsJson.appcache = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.appcache = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "cache":
				if(onOff) {	settingsJson.cache = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.cache = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "downloads":
				if(onOff) {	settingsJson.downloads = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.downloads = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "fileSystems":
				if(onOff) {	settingsJson.fileSystems = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.fileSystems = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "formData":
				if(onOff) {	settingsJson.formData = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.formData = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "history":
				if(onOff) {	settingsJson.history = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.history = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "indexedDB":
				if(onOff) {	settingsJson.indexedDB = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.indexedDB = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "localStorage":
				if(onOff) {	settingsJson.localStorage = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.localStorage = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "pluginData":
				if(onOff) {	settingsJson.pluginData = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.pluginData = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "passwords":
				if(onOff) {	settingsJson.passwords = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.passwords = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
		case "webSQL":
				if(onOff) {	settingsJson.webSQL = true; localStorage.setItem("settings", JSON.stringify(settingsJson));}
				else { settingsJson.webSQL = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
	}
	BGPage.updatePrivacySettings();
}