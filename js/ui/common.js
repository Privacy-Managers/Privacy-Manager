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

/*******************************************************************************
 * Data Action handler
 ******************************************************************************/
(function(global)
{
  global.registerActionListener = function(target, callback)
  {
    target.addEventListener("keyup", function(ev)
    {
      onKeyUp(ev, callback);
    }, false);

    target.addEventListener("click", function(ev)
    {
      onClick(ev, callback);
    }, false);
  }

  function onKeyUp(ev, callback)
  {
    var key = ev.key;
    var activeElem = document.activeElement;
    var action = null;

    switch (key)
    {
      case " ":
      case "Enter":
        action = activeElem.dataset.keyAction;
        break;
      case "Delete":
      case "Backspace":
        action = activeElem.dataset.keyDelete;
        break;
      case "ArrowUp":
        action = activeElem.dataset.keyUp;
        break;
      case "ArrowDown":
        action = activeElem.dataset.keyDown;
        break;
      case "Escape":
        action = activeElem.dataset.keyQuite;
        break;
    }

    if (!action)
        return;

    ev.preventDefault;
    callback(action, activeElem);
  }

  function onClick(ev, callback)
  {
    var element = ev.target;
    var action = null;

    while (true)
    {
      if (element == this)
        break;

      if (element.hasAttribute("data-action"))
      {
        action = element.getAttribute("data-action");
        break;
      }

      element = element.parentElement;
    }

    if (!action)
      return;

    ev.preventDefault;
    callback(action, element);
  }
})(this);

/*******************************************************************************
 * Table list
 ******************************************************************************/
function TableList(lisElem, listItemTemplate, listSubItemTemplate)
{
  this.items = [];
  this.lisElem = lisElem;
  this.listItemTemplate = listItemTemplate;
  this.listSubItemTemplate = listSubItemTemplate;
  this.callback = null;

  lisElem.addEventListener("keydown", function(ev)
  {
    // Prevent the scrollable list from scrolling
    if (ev.key == "ArrowDown" || ev.key == "ArrowUp")
    {
      ev.preventDefault();
    }
  }, false);

  registerActionListener(this.lisElem, this.onAction.bind(this));
}

/*
 * Add item to the Table list
 * @param {JSON} itemObj represents list item data assignment ex.:
 *   {
 *     dataset:  { access: "example.com", path: "/" },
 *     texts: {domain: "example.com", cookienum: "3 Cookies"}
 *   }
 */
TableList.prototype.addItem = function(itemObj)
{
  this.items.push(itemObj);
  this.items.sort(function (a, b)
  {
    return a.dataset.access.localeCompare(b.dataset.access);
  });

  var listItem = this._itemFromTmpl(itemObj, this.listItemTemplate);
  var elemAfter = this.lisElem.children[this.items.indexOf(itemObj)];

  if (elemAfter)
    this.lisElem.insertBefore(listItem, elemAfter);
  else
    this.lisElem.appendChild(listItem);
}

TableList.prototype.addSubItem = function(itemObj, accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex === false)
    return false;

  var subListItemElem = this._itemFromTmpl(itemObj, this.listSubItemTemplate);
  var item = this.items[itemIndex];
  var listItemElem = this.lisElem.children[itemIndex];
  
  if (!item.subItems || item.subItems.length == 0)
  {
    listItemElem.dataset.expanded = true;
    item.subItems = [];
    var subListElem = document.createElement("ul");
    subListElem.appendChild(subListItemElem);
    listItemElem.appendChild(subListElem);
    this.focusEdgeElem(subListElem, true);
  }
  else
  {
    listItemElem.querySelector("ul").appendChild(subListItemElem);
  }
  item.subItems.push(itemObj);
  this.listSubItemTemplate
}

TableList.prototype.removeSubItem = function(parentAccessor, accessor)
{
  var itemIndex = this.indexOfAccessor(parentAccessor);
  if (itemIndex === false)
    return false;

  var item = this.items[itemIndex];
  var listItemElem = this.lisElem.children[itemIndex];
  var subListItemElem = listItemElem.querySelector("ul");

  for (var i = 0; i < item.subItems.length; i++)
  {
    if (item.subItems[i].dataset.access == accessor)
    {
      if (item.subItems.length == 1)
      {
        this.onAction("next-sibling", listItemElem);
        listItemElem.removeChild(subListItemElem);
      }
      else 
      {
        subListItemElem.children[i].parentElement.removeChild(
          subListItemElem.children[i]);
      }
      item.subItems.splice(i, 1);
    }
  }
}

TableList.prototype.removeAllSubItems = function(accessor)
{
  var item = this.getItem(accessor);
  if (!item)
    return false;

  var i = item.subItems.length;
  while (i--) // Avoide re-indexing
    this.removeSubItem(item.dataset.access, item.subItems[i].dataset.access);
}

TableList.prototype.hasSubItem = function(parentAccessor, accessor)
{
  var parentItem = this.getItem(parentAccessor);
  if (!parentItem || !parentItem.subItems)
    return false;

  for (var i = 0; i < parentItem.subItems.length; i++)
  {
    if (parentItem.subItems[i].dataset.access == accessor)
      return true;
  }
  return false;
}

TableList.prototype._updateListElem = function(itemObj, listElem)
{
  var datasetObj = itemObj.dataset;
  for (var name in datasetObj)
    listElem.dataset[name] = datasetObj[name];

  var textsObj = itemObj.texts;
  for (var name in textsObj)
  {
    var textElement = listElem.querySelector("[data-text='"+ name +"']");
    if (textElement)
      textElement.textContent = textsObj[name];
  }

  // Set default tabindex to the first list Element
  if (this.lisElem.childElementCount == 0)
    listElem.setAttribute("tabindex", "0");
  else
    listElem.setAttribute("tabindex", "-1");

  return listElem;
}

TableList.prototype._itemFromTmpl = function(itemObj, template)
{
  var tmpContent = template.content;
  var tmpList = tmpContent.querySelector("li");

  this._updateListElem(itemObj, tmpList);
  return document.importNode(tmpContent, true);
}

TableList.prototype.empty = function()
{
  this.items = [];
  this.lisElem.innerHTML = "";
}

TableList.prototype.indexOfAccessor = function(accessor)
{
  for (var i = 0; i < this.items.length; i++) 
  {
    if (this.items[i].dataset.access == accessor)
      return i;
  }
  return false;
}

TableList.prototype.getItem = function(accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex >= 0)
    return this.items[itemIndex];
  else
    return false;
}

TableList.prototype.updateItem = function(newItemObj, accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  this.items[itemIndex] = newItemObj;
  this._updateListElem(newItemObj, this.lisElem.children[itemIndex]);
}

TableList.prototype.removeItem = function(accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex >= 0)
  {
    this.items.splice(itemIndex, 1);
    this.onAction("next-sibling", this.lisElem.children[itemIndex]);
    this.lisElem.removeChild(this.lisElem.children[itemIndex]);
    return true;
  }
  return false;
}

TableList.prototype.onAction = function(action, element)
{
  switch (action)
  {
    case "next-sibling":
      var isNext = true;
    case "previouse-sibling":
      var sibling = isNext ? element.nextSibling : element.previousSibling;
      while (sibling && sibling.nodeType != 1)
        sibling = isNext ? sibling.nextSibling : sibling.previousSibling;

      if (sibling)
        sibling.focus();
      else
        this.focusEdgeElem(element.parentNode, isNext);
      break;
  }
}

TableList.prototype.focusEdgeElem = function(element, isFirst)
{
  var childElem = isFirst ? element.firstChild : element.lastChild;
  while(childElem != null && childElem.nodeType == 3)
    childElem = isFirst ? childElem.nextSibling : childElem.previousSibling;

  if (childElem)
    childElem.focus();
}

TableList.prototype.setActionListener = function(callback)
{
  this.callback = callback;
}
