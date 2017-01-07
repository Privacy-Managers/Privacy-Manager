var loadedTabs = new Array();

$(function()
{
	$("#tabs").tabs();
	$("#tabs ul").show();
});
	
$(document).ready( function()
{
	tabsManipulation();
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

function tabsManipulation()
{
	Elem('#tabs').bind('tabsselect', function(event, ui)
	{
		loadTab(ui.index);
	});
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
