/*
 * This file is part of Privacy Manager.
 * Copyright (C) 2017 Manvel Saroyan
 * 
 * Privacy Manager is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 * 
 * Privacy Manager is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 * 
 * You should have received a copy of the GNU General Public License
 * along with Privacy Manager. If not, see <http://www.gnu.org/licenses/>.
 */

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
 * General
 ******************************************************************************/
(function()
{
  document.addEventListener("DOMContentLoaded", function()
  {
    registerActionListener(document.body, function(action, element)
    {
      switch (action)
      {
        case "open-dialog":
          var infoMsgId = element.dataset.info;
          if (infoMsgId)
          {
            var msgId = getParentData(element, "data-access");
            var dialogHeader = Elem("#dialog-header-setting-info");
            dialogHeader.textContent = getMsg(msgId);
            var infoTextElem = Elem("#dialog-content-setting-info-text");
            var msgInfoId = msgId + "_desc";
            infoTextElem.textContent = getMsg(msgInfoId);
          }
          break;
      }
    });

    // Settings list localization
    var content = Elem("#settings-list").content;
    content.querySelector("#btn-on-label").textContent = getMsg("on");
    content.querySelector("#btn-off-label").textContent = getMsg("off");
  }, false);
})();

function createBasicSettingObj(text)
{
  return {
    dataset: {access: text},
    text: getMsg(text)
  };
}

/*******************************************************************************
 * Tabs
 ******************************************************************************/
(function(global)
{
  global.switchEvent = new Event("switch");
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

    document.documentElement.lang = getMsg("@@ui_locale");
  }, false);
})();

/*******************************************************************************
 * Setting list
 ******************************************************************************/
/**
 * Add setting list item
 * @param {Node} parent <ul> element
 * @param {JSON} dataObj data describing the structure ex.:
 * {
 *   dataset:  { access: "access", info: "access_desc" },
 *   text: "",
 *   privacyObj: [Chrome privacy object]
 * }
 * @param {String} type "privacy", "storage" or "permission"
 * @param {Function} callback triggered after creation and on change.
 * The callback parameter should be a function that looks like this:
 * function(state) {...}; where "state" is boolean
 */ 
function addSettingItem(parent, dataObj, type, callback)
{
  var content = Elem("#settings-list").content;
  var accessor = dataObj.dataset.access;
  content.querySelector("label").textContent = dataObj.text;
  content.querySelector("[data-dialog='setting-info']").title = 
    getMsg(dataObj.dataset.access + "_desc");

  var listElem = content.querySelector("li");
  var datasetObj = dataObj.dataset;

  for (var name in datasetObj)
    listElem.dataset[name] = datasetObj[name];

  var node = document.importNode(content, true);
  parent.appendChild(node);

  var settingItem = Elem("[data-access='" + accessor + "']", parent);
  var settingButton = Elem("button[role='checkbox']", settingItem);

  switch (type)
  {
    case "privacy":
      var privacyObject = dataObj.privacyObj;

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
    Elem("button[role='checkbox']", setting).setAttribute("aria-checked", state);
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
    var actions = null;

    switch (key)
    {
      case " ":
      case "Enter":
        actions = activeElem.dataset.keyAction;
        break;
      case "Delete":
      case "Backspace":
        actions = activeElem.dataset.keyDelete;
        break;
      case "ArrowUp":
        actions = activeElem.dataset.keyUp;
        break;
      case "ArrowDown":
        actions = activeElem.dataset.keyDown;
        break;
      case "ArrowRight":
        actions = activeElem.dataset.keyRight;
        break;
      case "ArrowLeft":
        actions = activeElem.dataset.keyLeft;
        break;
      case "Escape":
        actions = activeElem.dataset.keyQuite;
        break;
    }

    if (!actions)
        return;

    // TODO: Fix duplication
    ev.preventDefault;
    actions.split(",").forEach(function(action)
    {
      callback(action, activeElem);
    });
  }

  function onClick(ev, callback)
  {
    var element = ev.target;
    var actions = null;

    while (true)
    {
      if (element == this)
        break;

      if (element.hasAttribute("data-action"))
      {
        actions = element.getAttribute("data-action");
        break;
      }

      element = element.parentElement;
    }

    if (!actions)
      return;

    ev.preventDefault;
    actions.split(",").forEach(function(action)
    {
      callback(action, element);
    });
  }
})(this);

/*******************************************************************************
 * Table list
 ******************************************************************************/
/**
 * Constructor TableList
 * @param {Node} listElem parent <ul> element
 * @param {Template} listItemTemplate <template>
 * @param {Template} listSubItemTemplate <template> (optional)
 * @param {Function} sort sorting function or "reverse" (optional)
 */
function TableList(listElem, listItemTemplate, listSubItemTemplate, sort)
{
  this.items = [];
  this.sort = sort;
  this.listElem = listElem;
  this.listItemTemplate = listItemTemplate;
  this.listSubItemTemplate = listSubItemTemplate;
  this.loaded = 0;
  this.loadAmount = 50;
  this.scrollLoadPercentage = 0.8;

  listElem.addEventListener("keydown", function(ev)
  {
    // Prevent the scrollable list from scrolling
    if (ev.key == "ArrowDown" || ev.key == "ArrowUp")
    {
      ev.preventDefault();
    }
  }, false);

  this.listElem.addEventListener("scroll", this._onScroll.bind(this), false);
  registerActionListener(this.listElem, this.onAction.bind(this));
};

/**
 * Add item to the Table list
 * @param {JSON} itemObj represents list item data assignment ex.:
 *   {
 *     dataset:  { access: "example.com", datasetname: "/" },
 *     texts: {data-text-value: "example.com", data-text-value: "3 Cookies"}
 *   }
 */
TableList.prototype.addItem = function(itemObj)
{
  if (this.sort)
  {
    if (this.sort == "reverse")
    {
      this.items.unshift(itemObj);
    }
    else
    {
      this.items.push(itemObj);
      this.items.sort(this.sort);
    }
  }
  else
  {
    this.items.push(itemObj);
  }

  var itemIndex = this.items.indexOf(itemObj);
  if (itemIndex < this.loaded || itemIndex <= this.loadAmount)
    this._loadItem(itemObj);
};

/**
 * Load item into the view
 * @param  {JSON} itemObj as specified in addItem
 */
TableList.prototype._loadItem = function(itemObj)
{
  if (!itemObj.dataset)
    itemObj.dataset = {};

  if (!itemObj.dataset.access)
    itemObj.dataset.access = this.items.indexOf(itemObj);

  var listItem = this._itemFromTmpl(itemObj, this.listItemTemplate);
  var itemIndex = this.items.indexOf(itemObj);
  var elemAfter = this.listElem.children[itemIndex];

  if (elemAfter)
    this.listElem.insertBefore(listItem, elemAfter);
  else
    this.listElem.appendChild(listItem);

  this.loaded++;
}

/**
 * Scroll bar event handler
 */
TableList.prototype._onScroll = function()
{
  var listClientScrollBottom = this.listElem.scrollTop + 
    this.listElem.clientHeight;
  var percentage = listClientScrollBottom / this.listElem.scrollHeight;
  if (percentage > this.scrollLoadPercentage && this.loaded < this.items.length)
  {
    var loadLimit = this.loaded + this.loadAmount;
    for (var i = this.loaded; i < loadLimit && i < this.items.length; i++)
    {
      this._loadItem(this.items[i]);
    }
  }
}

/**
 * Remove main item by ID
 * @param {String} accessor main item ID
 * @param {Boolean} result
 */
TableList.prototype.removeItem = function(accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex >= 0)
  {
    this.items.splice(itemIndex, 1);
    this.onAction("next-sibling", this.listElem.children[itemIndex]);
    this.listElem.removeChild(this.listElem.children[itemIndex]);
    return true;
  }
  return false;
};

/**
 * Add subitem
 * @param {JSON} itemObj as specified in addItem
 * @param {String} accessor item ID
 */
TableList.prototype.addSubItem = function(itemObj, accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex === false)
    return false;

  var subListItemElem = this._itemFromTmpl(itemObj, this.listSubItemTemplate);
  var item = this.items[itemIndex];
  var listItemElem = this.listElem.children[itemIndex];
  
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
};

/**
 * Remove subitem
 * @param {String} parentAccessor main item ID
 * @param {String} accessor subItem ID
 */
TableList.prototype.removeSubItem = function(parentAccessor, accessor)
{
  var itemIndex = this.indexOfAccessor(parentAccessor);
  if (itemIndex === false)
    return false;

  var item = this.items[itemIndex];
  var listItemElem = this.listElem.children[itemIndex];
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
};

/**
 * Remove All sub items
 * @param {String} accessor main item ID
 */
TableList.prototype.removeAllSubItems = function(accessor)
{
  var item = this.getItem(accessor);
  if (!item)
    return false;

  var i = item.subItems.length;
  while (i--) // Avoide re-indexing
    this.removeSubItem(item.dataset.access, item.subItems[i].dataset.access);

  delete item.subItems;
};

/**
 * Check for subItem existance
 * @param {String} accessor main item ID
 * @param {String} accessor subItem ID
 * @return {Boolean} result
 */
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
};

/**
 * Update list element using itemObj
 * @param {JSON} itemObj
 * @param {Node} listElem target <li> element
 */
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
  if (this.listElem.childElementCount == 0)
    listElem.setAttribute("tabindex", "0");
  else
    listElem.setAttribute("tabindex", "-1");
};

/**
 * Create list element from template
 * @param {JSON} itemObj
 * @param {Template} template
 * @return {Node} node
 */
TableList.prototype._itemFromTmpl = function(itemObj, template)
{
  var tmpContent = template.content;
  var tmpList = tmpContent.querySelector("li");

  this._updateListElem(itemObj, tmpList);
  return document.importNode(tmpContent, true);
};

/**
 * Empty data and view
 */
TableList.prototype.empty = function()
{
  this.items = [];
  this.listElem.innerHTML = "";
};

/**
 * Get the index (position) of the item
 * @param {String} accessor
 * @return {Number} index of the item or false if can't find
 */
TableList.prototype.indexOfAccessor = function(accessor)
{
  for (var i = 0; i < this.items.length; i++) 
  {
    if (this.items[i].dataset.access == accessor)
      return i;
  }
  return false;
};

/**
 * Getting the item
 * @param {String} accessor main item ID
 * @return {JSON} itemObj or false if doesn't exist
 */
TableList.prototype.getItem = function(accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex >= 0)
    return this.items[itemIndex];
  else
    return false;
};

/**
 * Update the item and DOM
 * @param {JSON} newItemObj
 * @param {String} accessor ID of the main Item
 */
TableList.prototype.updateItem = function(newItemObj, accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  this.items[itemIndex] = newItemObj;
  this._updateListElem(newItemObj, this.listElem.children[itemIndex]);
};

/**
 * Reverse focus first or last list item
 * @param {Node} parentElement list item parent element
 * @param {Boolean} isFirst focus first if true otherwise last element
 */
TableList.prototype.focusEdgeElem = function(parentElement, isFirst)
{
  //TODO: use utils method instead 
  var childElem = isFirst ? parentElement.firstChild : parentElement.lastChild;
  while(childElem != null && childElem.nodeType == 3)
    childElem = isFirst ? childElem.nextSibling : childElem.previousSibling;

  if (childElem)
    childElem.focus();
};

/**
 * Action listener
 * @param {String} action
 * @param {Node} element target
 */
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
};

/*******************************************************************************
 * Dialog
 ******************************************************************************/
(function(global)
{
  var dialog = null;
  document.addEventListener("DOMContentLoaded", function()
  {
    dialog = Elem("#dialog");
    registerActionListener(document.body, onAction);
    document.body.addEventListener("keyup", function(ev)
    {
      if (ev.key == "Escape" && dialog.getAttribute("aria-hidden") == "false" )
        onAction("close-dialog", dialog);
    }, false);
  }, false);

  function onAction(action, element)
  {
    switch (action)
    {
      case "open-dialog":
        dialog.setAttribute("aria-hidden", false);
        dialog.dataset.dialog = element.dataset.dialog;
        break;
      case "close-dialog":
        closeDialog();
        break;
    }
  }

  global.closeDialog = function()
  {
    dialog.setAttribute("aria-hidden", true);
  };
})(this);
