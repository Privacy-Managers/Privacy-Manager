const {Elem, nextSiblingElem, prevSiblingElem} = require("../utils");
const {getStorage, setStorage} = require("../../common");
const {registerActionListener} = require("../actionListener");

const switchEvent = new Event("switch");
var tabsContainer = null;

document.addEventListener("DOMContentLoaded", function()
{
  initTabs();
}, false);

function initTabs()
{
  tabsContainer = Elem("#navigation_tab");
  registerActionListener(tabsContainer, function(action, element)
  {
    switch (action)
    {
      case "switch-tab":
        switchTab(element);
        break;
      case "next-tab":
        element.setAttribute("tabindex", "-1");
        switchTab(nextSiblingElem(element));
        break;
      case "previouse-tab":
        element.setAttribute("tabindex", "-1");
        switchTab(prevSiblingElem(element));
        break;
    }
  });

  function getSelected()
  {
    return Elem("[aria-selected='true']", tabsContainer);
  }

  tabsContainer.addEventListener("switch", function(ev)
  {
    // Fires whenever new tab is becoming active
    // use ev.activeTab to determine which
  }, false);

  getStorage("lastSelectedTab", function(dataObj)
  {
    var lastSelectedTab = dataObj.lastSelectedTab;
    if (lastSelectedTab)
      switchTab(tabsContainer.querySelector("[data-tab=" + lastSelectedTab + "]"));
    else
      switchTab(tabsContainer.firstElementChild);
  });
}

/**
 * Switches the tab
 * @param {Element} tab element that defines or has parent with role="tab" and
 * data-tab attribute
*/
function switchTab(tab)
{
  while(tab)
  {
    if (tab == tabsContainer)
      return false;

    if (tab.getAttribute("role") == "tab")
      break;
    tab = tab.parentElement;
  }

  var selectedNav = Elem("#navigation_tab").querySelector("[aria-selected]");
  if (selectedNav)
    selectedNav.removeAttribute("aria-selected");

  tab.setAttribute("aria-selected", "true");
  tab.setAttribute("tabindex", "0");
  tab.focus();
  document.body.dataset.tab = tab.getAttribute("data-tab");

  switchEvent.activeTab = tab.getAttribute("data-tab");
  Elem("#navigation_tab").dispatchEvent(switchEvent);
  setStorage({"lastSelectedTab": tab.getAttribute("data-tab")});
}
