var loadedTabs = new Array();
var switchEvent = new Event("switch");

document.addEventListener("DOMContentLoaded", function()
{
	initTabs();
}, false);

function initTabs()
{
	var tabsContainer = Elem("#navigation_tab");
	tabsContainer.addEventListener("click", function(ev)
	{
		switchTab(ev.target);
	}, false);

	tabsContainer.addEventListener("switch", function(ev)
	{
		// Fires whenever new tab is becoming active
		// use ev.activeTab to determine which
	}, false);

	var lastSelectedTab = loadData("lastSelectedTab");
	if (lastSelectedTab)
		switchTab(tabsContainer.querySelector("[data-tab=" + lastSelectedTab + "]"));
	else
		switchTab(tabsContainer.firstChild);
}
/*
 * Switches the tab
 * @param {Element} tab element that defines or has parent with role="tab" and
 * data-tab attribute
*/
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
