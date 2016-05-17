var activeHostNameContId = "";
var finalCookiesArray = new Array();
var searchLastVal = "";

function tabCookiesLoad() {
    cookiesActionsBinding();
    cookiesLocalizationBinding();
    checkHostsPermission(true);
}

function cookiesActionsBinding() {
    $("#cookies_tab .cb-enable").click(function(){
        cookiesSwitchCheckboxChange(this, true, true);
    });
    $("#cookies_tab .cb-disable").click(function(){
        cookiesSwitchCheckboxChange(this, false, true);
    });
    $("#searchCookies").keyup(function(){
    	if((searchLastVal == "")&&($("#searchCookies").val()=="")) {
    		return;	
    	}
    	searchLastVal = $("#searchCookies").val();
    	getCookies();
    });
    
    var searchCookies = document.getElementById("searchCookies")
    searchCookies.addEventListener("search", function(e) {
    	$("#searchCookies").trigger('keyup')
    }, false);
    
    $("#removeAllCookies").click(function(){
        cookieRemove("", "all");
    });
}

function cookiesSwitchCheckboxChange(obj, onOff, changeSettings) {
    if(onOff) {
        var parent = $(obj).parents('.switch');
        $('.cb-disable',parent).removeClass('selected');
        $(obj).addClass('selected');
        $('.checkbox',parent).attr('checked', true);
        if(changeSettings) {
            cookiesUpdateSettings($(obj).parents('.rowContainer')[0].id, true)
        }
    }
    else {
        var parent = $(obj).parents('.switch');
        $('.cb-enable',parent).removeClass('selected');
        $(obj).addClass('selected');
        $('.checkbox',parent).attr('checked', false);
        if(changeSettings) {
            cookiesUpdateSettings($(obj).parents('.rowContainer')[0].id, false)
        }
    }
}


function cookiesLocalizationBinding() {
	if(window.navigator.language == "ru") {
		$("#cookies_tab .closeBrowserName").css("width", "120px");
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
	$("#allowHostPermissions .settingName").html(chrome.i18n.getMessage("allowHostPermissions"));
	$("#allowHostPermissions .settingName").attr("title", chrome.i18n.getMessage("allowHostPermissions_desc"));
	$("#allowHostPermissions .infoIcon").attr("title", chrome.i18n.getMessage("allowHostPermissions_desc"));
	
	$("#activeTabCookies .settingName").html(chrome.i18n.getMessage("activeTabCookies"));
	$("#activeTabCookies .settingName").attr("title", chrome.i18n.getMessage("activeTabCookies_desc"));
	$("#activeTabCookies .infoIcon").attr("title", chrome.i18n.getMessage("activeTabCookies_desc"));
	
	$("#cookiesHeadlineTitle").html(chrome.i18n.getMessage("cookiesHeadlineTitle"));
	$("#removeAllCookies").val(chrome.i18n.getMessage("removeAllCookies"));
	
}


function cookiesUpdateSettings(settingName, onOff) {
	var settings = localStorage.getItem("settings");
	var settingsJson = JSON.parse(settings);
	
	switch(settingName)
	{
		case "allowHostPermissions":
				if(onOff) {hostPermissionCookies(true);}
				else {hostPermissionCookies(false);	}
		break;
		case "activeTabCookies":
			if(onOff) {	settingsJson.activeTabCookies = true; localStorage.setItem("settings", JSON.stringify(settingsJson)); checkHostsPermission(true);}
			else { settingsJson.activeTabCookies = false; localStorage.setItem("settings", JSON.stringify(settingsJson)); }
		break;
    }
}


function hostPermissionCookies(allow) {
	var settings = localStorage.getItem("settings");
	var settingsJson = JSON.parse(settings);
	
	if(allow) {
		chrome.permissions.request({
			origins: ['http://*/*', 'https://*/*']
		}, function(granted) {
			// The callback argument will be true if the user granted the permissions.
			if (granted) {
				checkActiveTabCookies();
				$("#searchCookies").prop('disabled', false);
				$("#removeAllCookies").prop('disabled', false);
				getCookies();
				
				return true;
			} else {
				return false;
			}
		});
	}
	else {
		chrome.permissions.remove({
			origins: ['http://*/*', 'https://*/*']
		}, function(removed) {
			if (removed) {
				var myElement = $("#activeTabCookies .cb-disable");
				$("#cookiesContainer").html("");
				$("#searchCookies").prop('disabled', true);
				$("#removeAllCookies").prop('disabled', true);
				cookiesSwitchCheckboxChange(myElement, false, false);
				return true;
			} else {
				return false;
	  		}
		});
	}
}

function checkHostsPermission(load) {
	chrome.permissions.contains({
		origins: ['http://*/*', 'https://*/*']
	}, function(result) {
		if (result) {
			var myElement = $("#allowHostPermissions .cb-enable");
			cookiesSwitchCheckboxChange(myElement, true, false);
			checkActiveTabCookies();
			$("#searchCookies").prop('disabled', false);
			$("#removeAllCookies").prop('disabled', false);
			if(load) {
				getCookies();
			}
			else {
				if($("#cookiesContainer").html()=="") {
					getCookies();
				}
				
			}
			return true;
		} else {
			$("#searchCookies").prop('disabled', true);
			$("#removeAllCookies").prop('disabled', true);
			var myElement = $("#activeTabCookies .cb-disable");
			cookiesSwitchCheckboxChange(myElement, false, false);
			
			var myElement = $("#allowHostPermissions .cb-disable");
			cookiesSwitchCheckboxChange(myElement, false, false);
			return false;
		}
	});
}

function checkActiveTabCookies() {
	var settings = localStorage.getItem("settings");
	if(settings == null) {
		var settingsJson = {};
		localStorage.setItem("settings", JSON.stringify(settingsJson));
	}
	else {
		var settingsJson = JSON.parse(settings);
		if(settingsJson.activeTabCookies) {
			var myElement = $("#activeTabCookies .cb-enable");
			cookiesSwitchCheckboxChange(myElement, true, false);
			chrome.tabs.query({active:true},function(tab){
				var currentUrl = tab[0].url.toString();
				var pattern=/(.+:\/\/)?([^\/]+)(\/.*)*/i;
				var hostName=pattern.exec(currentUrl)[2];
				hostName = hostName.slice(0, 4) == "www."?hostName.substr(4):hostName;
				searchLastVal = hostName;
				$("#searchCookies").val(hostName);
			});
			
		}
		else {
			var myElement = $("#activeTabCookies .cb-disable");
			cookiesSwitchCheckboxChange(myElement, false, false);
		}
		
	}
}

function getCookies() {
	$("#cookiesContainer").html("");
	
	var cookiesFiltered = new Array();
	chrome.cookies.getAll({}, function(cookies){
		for (var i in cookies) {
			var patt= new RegExp($("#searchCookies").val());
			if(patt.test(cookies[i].domain)) {
				cookies[i].domain = cookies[i].domain.charAt(0)=="." ? cookies[i].domain.substring(1):cookies[i].domain;
				cookiesFiltered.push(cookies[i]);
			}
		}
		finalCookiesArray = cookiesFiltered;
       	$("#cookiesContainer").html("");
       	generateCookies(cookiesFiltered);
    });
}

function generateCookies(cookies) {
	cookies.sort(sort_by('domain', true, function(a){return a.toUpperCase()}));
	$("#cookiesContainer").css("height", "270px");
	$("#cookiesContainer").css("overflow", "auto");
	
	var lastDomainName = "";
	var firstDomainId = 0;
	var cookieCounter = 1;
	
	for (var i=0; i < cookies.length; i++) {
		if(lastDomainName != cookies[i].domain) {
			if(lastDomainName!="") {
				$("#cookieHostRowContainer_"+(firstDomainId)+" .cookieHostRowCounter").html(cookieCounter+" "+chrome.i18n.getMessage("cookiesCounterName"));
				cookieCounter=1;
			}
			firstDomainId = i;
			var cookieHostRow = "<div id='cookieHostRowContainer_"+i+"'><div class='cookieHostRow'><div class='cookieHostRowName'>"+cookies[i].domain+"</div><div class='cookieHostRowCounter'></div><div id='cookieHostRowRemove_"+i+"' class='cookieHostRowRemove'>x</div></div></div>";
			$("#cookiesContainer").append(cookieHostRow);
			var cookieNameRow = "<div id='cookieNameRow_"+i+"' class='cookieNameRow' title='"+generateCookieTitleDetails(cookies[i])+"'><div class='cookieNameRowName'>"+cookies[i].name+"</div></div>";
			$("#cookieHostRowContainer_"+i).append(cookieNameRow);
			
			$("#cookieHostRowContainer_"+i+"").click(function(){
        		cookieHostRowClicked(this);
    		});
    		
    		$("#cookieHostRowRemove_"+i).click(function(){
    			cookieRemove(this, "host");
    		});
		}
		else {
			cookieCounter++;
			var cookieNameRow = "<div id='cookieNameRow_"+i+"' class='cookieNameRow' title='"+generateCookieTitleDetails(cookies[i])+"'><div class='cookieNameRowName'>"+cookies[i].name+"</div></div>";
			$("#cookieHostRowContainer_"+firstDomainId).append(cookieNameRow);
		}
		
		var cookieNameRowValue = "<div class='cookieNameRowValue'>"+cookies[i].value+"</div>";
		var cookieNameRowRemove = "<div id='cookieNameRowRemove_"+i+"' class='cookieNameRowRemove'>x</div>"; 
		$("#cookieNameRow_"+i).append(cookieNameRowValue);
		$("#cookieNameRow_"+i).append(cookieNameRowRemove);
		
		$("#cookieNameRowRemove_"+i).click(function(){
    		cookieRemove(this, "name");
    	});
		
		lastDomainName = cookies[i].domain;	
		console.log(cookies[i]);
	};
	$("#cookieHostRowContainer_"+(firstDomainId)+" .cookieHostRowCounter").html(cookieCounter+" "+chrome.i18n.getMessage("cookiesCounterName"));
}


function cookieHostRowClicked(elem) {
	if(activeHostNameContId != "") {
		$("#"+activeHostNameContId+" .cookieNameRow").hide();
		$("#"+activeHostNameContId+" .cookieHostRow").removeClass("cookieHostRowActive");
	}
	
	
	activeHostNameContId = elem.id;
	$("#"+elem.id+" .cookieNameRow").show();
	
	$("#"+elem.id+" .cookieHostRow").addClass("cookieHostRowActive");
	
}

function cookieRemove(elem, type) {
	if(type == "host") {
		var hostRowId = getCookieIdFromElement(elem.id);
		var cookieNameRow = $("#cookieHostRowContainer_"+hostRowId+" .cookieNameRow");
		for (var i=0; i < cookieNameRow.length; i++) {
			var nameRowId = getCookieIdFromElement($(cookieNameRow[i])[0].id);
			var cookie = finalCookiesArray[nameRowId];
			var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path; 
			chrome.cookies.remove({"url": url, "name": cookie.name}); 
		};
		$("#cookieHostRowContainer_"+hostRowId).remove();
	}
	else if(type == "name") {
		var nameRowId = getCookieIdFromElement(elem.id);
		var cookie = finalCookiesArray[nameRowId];
		var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain + cookie.path; 
		var hostContainerElement = $(elem).parent().parent();
		var cookieCounterElement = hostContainerElement.children(":first").children().eq(1);
		var cookieCounter = cookieCounterElement.html().slice(0, cookieCounterElement.html().indexOf(" "));
		chrome.cookies.remove({"url": url, "name": cookie.name}); 
		if(cookieCounter==1){
			hostContainerElement.remove();
		}
		else {
			cookieCounterElement.html(cookieCounter-1+" "+chrome.i18n.getMessage("cookiesCounterName"));
			$("#cookieNameRow_"+nameRowId).remove();
		}
	}
	else if(type == "all") {
		chrome.cookies.getAll({}, function(cookies){
			for (var i in cookies) {
				var patt= new RegExp($("#searchCookies").val());
				if(patt.test(cookies[i].domain)) {
					var url = "http" + (cookies[i].secure ? "s" : "") + "://" + cookies[i].domain + cookies[i].path; 
  					chrome.cookies.remove({"url": url, "name": cookies[i].name}); 
				}
			}
			$("#cookiesContainer").html("");
    	});
	}
	
}

function getCookieIdFromElement(elementId) {
	var removeElemId = elementId;
	var sliceStart = removeElemId.indexOf("_")+1;
	var sliceEnd = removeElemId.length;
	return removeElemId.slice(sliceStart, sliceEnd);
}

function generateCookieTitleDetails(cookie) {
	var titleMessage = "name: "+cookie.name;
	titleMessage += "\nvalue: "+cookie.value;
	titleMessage += "\npath: "+cookie.path;
	titleMessage += "\nExpires: "+new Date(cookie.expirationDate*1000);
	
	return titleMessage;
	
}

var sort_by = function(field, reverse, primer){
   var key = function (x) {return primer ? primer(x[field]) : x[field]};
   return function (a,b) {
       var A = key(a), B = key(b);
       return ((A < B) ? -1 :
               (A > B) ? +1 : 0) * [-1,1][+!!reverse];                  
   }
}


