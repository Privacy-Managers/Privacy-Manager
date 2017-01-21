var loadedTabs = new Array();
var switchEvent = new Event("switch");

$(function()
{
	$("#tabs").tabs();
	$("#tabs ul").show();
});
	
$(document).ready( function()
{
	Elem("#navigation_tab").addEventListener("click", function(ev)
	{
		switchTab(ev.target);
	}, false);

	Elem("#navigation_tab").addEventListener("switch", function(ev)
	{
		console.log(ev.activeTab);
	}, false);

	Elem('#tabs').bind('tabsselect', function(event, ui)
	{
		loadTab(ui.index);
	});

	tabsLocalizationBinding();
	checkLastTab();
	var $tabs = $('#tabs').tabs();
	var selected = $tabs.tabs('option', 'selected');
});

function tabsLocalizationBinding()
{
	Elem('[href="#main_tab"]').html(getMsg("main_tab"));
	Elem('[href="#cookies_tab"]').html(getMsg("cookies_tab"));
	Elem('[href="#network_tab"]').html(getMsg("network_tab"));
}

function switchTab(tab)
{
	while(tab)
	{
		if (tab.getAttribute("role") == "tab")
			break;
		tab = tab.parentElement;
	}

	var selectedNav = Elem("#navigation_tab").querySelector("[aria-selected]");
	if (selectedNav)
		selectedNav.removeAttribute("aria-selected");

	tab.setAttribute("aria-selected", "true");
	document.body.setAttribute("data-tab", tab.getAttribute("data-tab"));

	switchEvent.activeTab = tab.getAttribute("data-tab");
	Elem("#navigation_tab").dispatchEvent(switchEvent);
	saveData("lastSelectedTab", tab.getAttribute("data-tab"));
}

function loadTab(tabId)
{
	if((tabId == 0)&&(loadedTabs.indexOf(tabId)==-1))
	{
		loadedTabs.push(tabId);
		//tabMainLoad();
	}
	else if(tabId == 1)
	{
		if(loadedTabs.indexOf(tabId)==-1)
		{
			loadedTabs.push(tabId);
			tabCookiesLoad();
		}
		else
		{
			checkHostsPermission(false);
		}
	}
	else if(tabId == 2)
	{
		if(loadedTabs.indexOf(tabId)==-1)
		{
			loadedTabs.push(tabId);
			tabNetworkLoad();
		}
		else
		{
			checkHostsPermissionNetwork(false);
		}
	}
	else if((tabId == 3)&&(loadedTabs.indexOf(tabId)==-1))
	{
		loadedTabs.push(tabId);
		tabOtherLoad();
	}
	var settings = localStorage.getItem("settings");
	var settingsJson = JSON.parse(settings);
	settingsJson.lastSelectedTab = tabId; 
	localStorage.setItem("settings", JSON.stringify(settingsJson));	
}

function saveData(property, value)
{
	var settings = localStorage.getItem("settings");
	var settingsJson = JSON.parse(settings);
	settingsJson[property] = value;
	localStorage.setItem("settings", JSON.stringify(settingsJson));
}

function checkLastTab()
{
	var $tabs = $('#tabs').tabs();
	var settings = localStorage.getItem("settings");
	if(settings == null)
	{
		var settingsJson = {};
		settingsJson.activeTabCookies = true;
		localStorage.setItem("settings", JSON.stringify(settingsJson));
		//loadTab(0);
		loadTab(0);
	}
	else
	{
		var settingsJson = JSON.parse(settings);
		if(settingsJson.lastSelectedTab)
		{
			$tabs.tabs('select', settingsJson.lastSelectedTab);
		}
		// Also in case if last tab equl to 0
		else if(settingsJson.lastSelectedTab == 0)
		{
			loadTab(0);
		}
		else
		{
			loadTab(0);
		}
	}
}
