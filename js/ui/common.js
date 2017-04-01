"use strict";

const privacyData = {
                      websites: 
                        ["thirdPartyCookiesAllowed", "hyperlinkAuditingEnabled", 
                        "referrersEnabled", "protectedContentEnabled"],
                      services:
                        ["alternateErrorPagesEnabled", "autofillEnabled", 
                        "hotwordSearchEnabled", "passwordSavingEnabled", 
                        "safeBrowsingEnabled",
                        "safeBrowsingExtendedReportingEnabled", 
                        "searchSuggestEnabled", "spellingServiceEnabled", 
                        "translationServiceEnabled"],
                      network: 
                        ["networkPredictionEnabled", "webRTCIPHandlingPolicy"]
                    };
const additionalPermission = {"origins": ["http://*/*", "https://*/*"]};

/*******************************************************************************
 * Tabs
 ******************************************************************************/
(function(global)
{
  global.switchEvent = new Event("switch");

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

    getStorage("lastSelectedTab", function(dataObj)
    {
      var lastSelectedTab = dataObj.lastSelectedTab;
      if (lastSelectedTab)
        switchTab(tabsContainer.querySelector("[data-tab=" + lastSelectedTab + "]"));
      else
        switchTab(tabsContainer.firstElementChild);
    });
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
    setStorage({"lastSelectedTab": tab.getAttribute("data-tab")});
  }
})(this);

/*******************************************************************************
 * i18n
 ******************************************************************************/
(function()
{
  document.addEventListener("DOMContentLoaded", function()
  {
    document.querySelectorAll("[data-i18n]").forEach(function(node)
    {
      node.textContent = getMsg(node.dataset.i18n);
    });
  }, false);
})();

/*******************************************************************************
 * Setting list
 ******************************************************************************/
 // TODO: Document
function addSettingItem(parent, accessor, type, callback)
{
  var content = Elem("#settings-list").content;
  content.querySelector("label").textContent = getMsg(accessor) || accessor;
  content.querySelector("li").dataset.access = accessor;
  content.querySelector("li").dataset.type = type;
  var node = document.importNode(content, true);
  parent.appendChild(node);

  var settingItem = Elem("[data-access='" + accessor + "']", parent);
  var settingButton = Elem("button", settingItem);

  switch (type)
  {
    case "privacy":
      var category = accessor.split("-")[0];
      var settingName = accessor.split("-")[1];
      var privacyObject = chrome.privacy[category][settingName];

      privacyObject.get({}, function(details)
      {
        settingState(settingItem, details.value);
      });
      settingButton.addEventListener("click", function()
      {
        privacyObject.get({}, function(details)
        {
          if (details.levelOfControl == "controllable_by_this_extension" || 
          details.levelOfControl == "controlled_by_this_extension")
          {
            privacyObject.set({ value: !details.value }, function()
            {
              if (chrome.runtime.lastError != undefined)
              {
                //TODO: Inform user about error
              }
            });
          }
          else
          {
            //TODO: Inform user if control level is not controlable by
            //extension details.levelOfControl
          }
        });
      }, false);

      privacyObject.onChange.addListener(function(detail)
      {
        settingState(accessor, detail.value);
      });
      break;
    case "storage":
      getStorage("settingList", function(data)
      {
        var settingList = data["settingList"];
        if (!settingList)
          return;

        var state = settingList[accessor] == true;
        settingState(settingItem, state);
        if (callback)
          callback(state);
      });
      settingButton.addEventListener("click", function()
      {
        getStorage("settingList", function(data)
        {
          if (data.settingList)
            data.settingList[accessor] = !data.settingList[accessor];
          else
          {
            data.settingList = {};
            data.settingList[accessor] = true;
          }
          setStorage(data, function(result)
          {
            if (callback)
              callback(data.settingList[accessor]);
          });
        });
      }, false);
      break;
    case "permission":
      chrome.permissions.contains(additionalPermission, function(result)
      {
        if (callback)
          callback(result);
        settingState(accessor, result);
      });

      settingButton.addEventListener("click", function()
      {
        chrome.permissions.contains(additionalPermission, function(result)
        {
          if (result)
            chrome.permissions.remove(additionalPermission);
          else
            chrome.permissions.request(additionalPermission);
        });
      }, false);

      chrome.permissions.onAdded.addListener(function(result)
      {
        settingState(accessor, true); // Currently called multiple times
        if (callback)
          callback(true);
      });
      chrome.permissions.onRemoved.addListener(function(result)
      {
        settingState(accessor, false);
        if (callback)
          callback(false);
      });
      break;
  }
}

function checkSettingState(accessor, callback)
{
  getStorage("settingList", function(data)
  {
    if (data.settingList)
      callback(data.settingList[accessor]);
    else
      callback(false);
  });
}

function settingState(setting, state)
{
  if (typeof setting == "string")
  {
    Elems("[data-access='" + setting + "']").forEach(function(settingItem)
    {
      settingState(settingItem, state);
    });
  }
  else
  {
    Elem("button", setting).setAttribute("aria-checked", state);
  }
}

chrome.storage.onChanged.addListener(function(change)
{
  if ("settingList" in change)
  {
    var newValue = change.settingList.newValue;
    for (var accessor in newValue)
      settingState(accessor, newValue[accessor]);
  }
});
