/*
 * This file is part of Privacy Manager.
 * Copyright (C) 2017-present Manvel Saroyan
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

const {getParentData, Elem, getMsg, createBasicSettingObj} = require("./utils");
const {registerActionListener} = require("./actionListener");
const {getStorage, setStorage, deleteCookies, additionalPermission} = require("../common");
const permittedUrls = additionalPermission.origins[0];
const {addSettingItem, getSettingListData, Listener} = require("./components/settingList");
const {TableList} = require("./components/tableList");

(function()
{
  const getAllCookies = chrome.cookies.getAll;
  const removeCookie = chrome.cookies.remove;
  const getCookie = chrome.cookies.get;
  const setCookie = chrome.cookies.set;
  const onCookieChange = chrome.cookies.onChanged;
  const onStorageChange =   chrome.storage.onChanged;
  const cookieWhitelistButtonTitle = getMsg("whitelistSublistCookie");
  const domainWhitelistButtonTitle = getMsg("whitelistCookieDomain");

  const activeTabCookieId = "activeTabCookies";

  var tableList = null;
  document.addEventListener("DOMContentLoaded" , async() =>
  {
    Elem("#search-domain").addEventListener("search", populateDomainList, false);
    Elem("#search-domain").addEventListener("keyup", function(ev)
    {
      if (ev.key != "Enter" && ev.key != "Escape")
        populateDomainList();
    }, false);

    var leftSettingList = Elem("#cookies_tab ul.settings-list:nth-of-type(1)");
    var rightSettingList = Elem("#cookies_tab ul.settings-list:nth-of-type(2)");

    const settingObjPermissions = createBasicSettingObj("additionalPermissions");
    addSettingItem(leftSettingList, settingObjPermissions, "permission");
    permissionChange(await browser.permissions.contains(additionalPermission));

    browser.permissions.onAdded.addListener(({origins}) =>
    {
      if (origins.includes(permittedUrls))
        permissionChange(true);
    });

    browser.permissions.onRemoved.addListener(({origins}) =>
    {
      if (origins.includes(permittedUrls))
        permissionChange(false);
    });

    var settingObj = createBasicSettingObj(activeTabCookieId);
    addSettingItem(rightSettingList, settingObj, "storage");

    new Listener().on(activeTabCookieId, (active)=>
    {
      if (active)
        updateFilterToActiveDomain();
    });

    var sortTable = function(a, b)
    {
      return a.dataset.access.localeCompare(b.dataset.access);
    };

    tableList = new TableList(
      Elem("#cookieList"),
      Elem("#cookiesListTemplate"),
      Elem("#cookiesSubListTemplate"),
      sortTable);
    registerActionListener(Elem("#cookiesContainer"), onCookiesAction);
    registerActionListener(Elem("#dialog-content-cookie-form"), onCookiesAction);
    registerActionListener(Elem("#dialog-content-cookie-delete-all"), onCookiesAction);
  }, false);

  async function permissionChange(granted)
  {
    disableControls(!granted);
    if (granted)
    {
      const state = await getSettingListData(activeTabCookieId);
      if (state)
        updateFilterToActiveDomain();
      else
        populateDomainList();
    }
  }

  function updateSwitches(list, value)
  {
    list.forEach(function(switchBtn)
    {
      switchBtn.setAttribute("aria-checked", value);
    });
  }

  function populateDomainList()
  {
    getAllCookies({}, function(cookies)
    {
      tableList.empty();
      var searchExpression = new RegExp(Elem("#search-domain").value);
      // Use repeative domains to count cookies number
      var repeativeDomains = [];

      for (let i = 0; i < cookies.length; i++)
      {
        if (searchExpression.test(cookies[i].domain))
          repeativeDomains.push(removeStartDot(cookies[i].domain));
      }

      if (cookies.length == 0 || repeativeDomains.length == 0)
        return;

      repeativeDomains.sort();
      var lastDomain = repeativeDomains[0];
      var cookiesNumber = 1;
      var domainObjs = [];

      for (let i = 1; i < repeativeDomains.length; i++)
      {
        var domain = repeativeDomains[i];
        if (lastDomain != domain)
        {
          domainObjs.push(createDomainObj(lastDomain, cookiesNumber));

          lastDomain = domain;
          cookiesNumber = 1;
        }
        else
        {
          cookiesNumber++;
        }
      }
      domainObjs.push(createDomainObj(lastDomain, cookiesNumber));
      tableList.addItems(domainObjs);
      // update whitelist
      getStorage("cookieWhitelist", function(cookieWhitelist)
      {
        updateWhitelistInList(cookieWhitelist["cookieWhitelist"]);
      });
    });
  }

  function onCookiesAction(action, element)
  {
    switch (action)
    {
      case "get-cookies": {
        if (element.dataset.expanded == "true")
        {
          onCookiesAction("close-expanded-domain", element);
          return;
        }

        const domain = element.getAttribute("data-access");
        getAllCookies({"domain": domain}, function(cookies)
        {
          for (var i = 0; i < cookies.length; i++)
          {
            var cookie = cookies[i];
            // Filter subdomains matched cookies
            if (cookie.domain.indexOf(domain) > 1)
              continue;

            tableList.addSubItem(createCookieSubitemObj(cookie), domain);
          }
          // update whitelist
          getStorage("cookieWhitelist", function(cookieWhitelist)
          {
            let domainCookies = {};
            domainCookies[domain] = cookieWhitelist.cookieWhitelist[domain];
            if (domainCookies[domain])
              updateWhitelistInList(domainCookies);
          });
        });
        break;
      }
      case "whitelist-cookie-domain": {
        const domain = getParentData(element, "data-access");

        getStorage("cookieWhitelist", function(cookieWhitelist)
        {
          let whitelist = cookieWhitelist["cookieWhitelist"];
          if (!(domain in whitelist))
          {
            whitelist[domain] = {domainWhitelist: true, cookies: []};
          }
          else
          {
            whitelist[domain].domainWhitelist = !whitelist[domain].domainWhitelist;
          }
          setStorage(cookieWhitelist);
        });
        break;
      }
      case "whitelist-sublist-cookie": {
        const accessObj = JSON.parse(getParentData(element, "data-access"));
        const domain = getParentData(getParentData(element, "data-access", true).
          parentElement, "data-access");
        getStorage("cookieWhitelist", function(cookieWhitelist)
        {
          let whitelist = cookieWhitelist["cookieWhitelist"];
          if (!(domain in whitelist))
          {
            whitelist[domain] = {domainWhitelist: false, cookies: [accessObj.cookie]};
          }
          else if (whitelist[domain].cookies.includes(accessObj.cookie))
          {
            // filter out cookie name
            whitelist[domain].cookies = whitelist[domain].cookies.filter(el => el !== accessObj.cookie);
          }
          else
          {
            // add cookie name
            whitelist[domain].cookies.push(accessObj.cookie);
          }
          setStorage(cookieWhitelist);
        });
        break;
      }
      case "close-expanded-domain": {
        var domainElem = getParentData(element, "data-expanded", true);
        tableList.removeAllSubItems(domainElem.dataset.access);
        domainElem.focus();
        domainElem.dataset.expanded = false;
        break;
      }
      case "delete-domain-cookies": {
        const domain = getParentData(element, "data-access");
        getAllCookies({"domain": domain}, function(cookies)
        {
          var callbackCount = 0;
          for (var i = 0; i < cookies.length; i++)
          {
            var cookie = cookies[i];
            const url = getUrl(cookie.domain, cookie.path, cookie.secure);
            removeCookie({"url": url, "name": cookie.name});
          }
        });
        break;
      }
      case "delete-sublist-cookie": {
        const accessObj = JSON.parse(getParentData(element, "data-access"));
        const domain = getParentData(getParentData(element, "data-access", true).
          parentElement, "data-access");
        const url = getUrl(domain, accessObj.path, accessObj.secure);
        removeCookie({"url": url, "name": accessObj.cookie});
        break;
      }
      case "delete-cookie": { // From Dialog
        const fieldsObj = getCookieDialogData().fields;
        const url = getUrl(fieldsObj.domain.value, fieldsObj.path.value,
                           fieldsObj.secure.checked);

        var name = fieldsObj.name.value;
        removeCookie({"url": url, "name": name}, function(cookie)
        {
          if (cookie)
            closeDialog();
        });
        break;
      }
      case "add-cookie": {
        const dialogObj = getCookieDialogData();
        dialogObj.form.reset();
        const fieldsObj = dialogObj.fields;
        fieldsObj.domain.removeAttribute("disabled");
        fieldsObj.domain.focus();
        fieldsObj.name.removeAttribute("disabled");
        break;
      }
      case "edit-cookie": {
        const dialogObj = getCookieDialogData();
        dialogObj.form.reset();
        var subItemElem = getParentData(element, "data-access", true);
        const accessObj = JSON.parse(subItemElem.dataset.access);
        const domain = getParentData(subItemElem.parentElement, "data-access");
        const url = getUrl(domain, accessObj.path, accessObj.secure);
        getCookie({"url": url, "name": accessObj.cookie}, function(cookie)
        {
          const fieldsObj = dialogObj.fields;
          fieldsObj.domain.setAttribute("disabled", "disabled");
          fieldsObj.name.setAttribute("disabled", "disabled");
          fieldsObj.name.value = cookie.name;
          fieldsObj.value.value = cookie.value;
          fieldsObj.value.focus();
          fieldsObj.domain.value = cookie.domain;
          fieldsObj.path.value = cookie.path;
          fieldsObj.hostOnly.checked = cookie.hostOnly;
          fieldsObj.httpOnly.checked = cookie.httpOnly;
          fieldsObj.secure.checked = cookie.secureElem;
          fieldsObj.session.checked = cookie.session;
          fieldsObj.storeId.value = cookie.storeId;

          var times = new Date(cookie.expirationDate * 1000).toISOString().
            split("T");
          fieldsObj.expDate.value = times[0];
          fieldsObj.expTime.value = times[1].split(".")[0];
        });
        break;
      }
      case "update-cookie": {
        const dialogObj = getCookieDialogData();
        if (!dialogObj.form.checkValidity())
          return;

        const fieldsObj = dialogObj.fields;
        var datetime = fieldsObj.expDate.value;
        var time = fieldsObj.expTime.value;
        datetime += time ? "T" + time : "";
        //TODO: Past expirationDate is invalid
        var expirationDate = new Date(datetime).getTime() / 1000;

        var cookieSetObj = {
                            "url": getUrl(fieldsObj.domain.value,
                                          fieldsObj.path.value,
                                          fieldsObj.secure.value),
                            "name": fieldsObj.name.value,
                            "value": fieldsObj.value.value,
                            "secure": fieldsObj.secure.checked,
                            "httpOnly": fieldsObj.httpOnly.checked,
                            "storeId": fieldsObj.storeId.value,
                            "expirationDate": expirationDate
        };

        // Omitted domain makes host-only cookie
        if (!fieldsObj.hostOnly.checked)
          cookieSetObj.domain = fieldsObj.domain.value;

        setCookie(cookieSetObj, function(cookie)
        {
          if (cookie)
            closeDialog();
        });
        break;
      }
      case "delete-all-cookies": {
        deleteCookies();
        closeDialog();
        break;
      }
    }
  }

  /**
   * Get Dialog and Elements in JSON format
   */
  function getCookieDialogData()
  {
    return {
      "form": Elem("#cookie-form"),
      "fields":
      {
        "domain": Elem("#cookie-domain"), "name": Elem("#cookie-name"),
        "path": Elem("#cookie-path"), "value": Elem("#cookie-value"),
        "hostOnly": Elem("#cookie-host-only"),
        "httpOnly": Elem("#cookie-http-only"), "secure": Elem("#cookie-secure"),
        "session": Elem("#cookie-session"),
        "expDate": Elem("#cookie-expiration-date"),
        "expTime": Elem("#cookie-expiration-time"),
        "storeId": Elem("#cookie-store-id"), "submitBtn": Elem("#update-cookie")
      }
    };
  }

  /**
   * Filter cookies list according to the active tab URL
   */
  function updateFilterToActiveDomain()
  {
    chrome.tabs.query({active: true}, function(tab)
    {
      const url = tab[0].url;
      if (url.indexOf("://") > -1)
      {
        var domain = url.split('/')[2].split(':')[0].replace("www.", "");
        Elem("#search-domain").value = domain;
        populateDomainList();
      }
    });
  }

  /**
   * Enable/disable control elements
   * @param {Boolean} disabled
   */
  function disableControls(disabled)
  {
    Elem("#cookie-controls").childNodes.forEach(function(Node)
    {
      if (Node.nodeType == 1)
        if (disabled)
          Node.setAttribute("disabled", disabled);
        else
          Node.removeAttribute("disabled");
    });
  }

  function removeStartDot(string)
  {
    return string.replace(/^\./, "");
  }

  function getUrl(domain, path, isSecure)
  {
    return "http" + (isSecure ? "s" : "") + "://" + domain + path;
  }

  function focusEdgeElem(element, isFirst)
  {
    var childElem = isFirst ? element.firstChild : element.lastChild;
    while(childElem != null && childElem.nodeType == 3)
      childElem = isFirst ? childElem.nextSibling : childElem.previousSibling;

    if (childElem)
      childElem.focus();
  }

  function createSubitemAccessor(cookie)
  {
    return JSON.stringify({
      cookie: cookie.name,
      secure: cookie.secure,
      path: cookie.path
    });
  }

  function createCookieSubitemObj(cookie)
  {
    return {
      dataset: {
        access: createSubitemAccessor(cookie)
      },
      texts: {
        name: cookie.name,
        value: cookie.value
      },
      titles: {
         whitelist: cookieWhitelistButtonTitle
      }
    };
  }

  /**
   * Create a Table List Item Structure Object
   * @param {String} domain Domain name
   * @param {Number} cookienum Number of domain cookies
   * @param {Boolean} whitelist specifies whether domain is whitelisted
   */
  function createDomainObj(domain, cookienum, whitelist = false)
  {
    return {
      dataset: {
        access: domain,
        whitelist: whitelist
      },
      texts: {
        domain: domain,
        cookienum: cookienum + " Cookies"
      },
      titles: {
         whitelist: domainWhitelistButtonTitle
      }
    };
  }
  function updateWhitelistInList(whitelistChange)
  {
    for (var domain in whitelistChange)
    {
      let domainElement = tableList.getItem(domain);
      if (domainElement)
      {
        domainElement.dataset.whitelist = whitelistChange[domain].domainWhitelist;
        tableList.updateItem(domainElement, domain);
        let cookies = whitelistChange[domain].cookies;
        if (domainElement.subItems)
        {
          for (let subElement of domainElement.subItems)
          {
            if (cookies.includes(subElement.texts.name))
            {
              subElement.dataset.whitelist = true;
              let cookieAccessor = "li[data-access='" + subElement.dataset.access + "']";
              document.querySelector(cookieAccessor).dataset.whitelist = true;
            }
            else
            {
              subElement.dataset.whitelist = false;
              let cookieAccessor = "li[data-access='" + subElement.dataset.access + "']";
              document.querySelector(cookieAccessor).dataset.whitelist = false;
            }
          }
        }
      }
    }
  }

  onStorageChange.addListener(function(changeInfo)
  {
    if ("cookieWhitelist" in changeInfo)
    {
      let newValue = changeInfo.cookieWhitelist.newValue;
      let oldValue = changeInfo.cookieWhitelist.oldValue;
      let changed = {};
      if (oldValue)
      {
        changed = Object.keys(newValue).reduce((acc, domain) =>
        {
          let oldDomainObj = oldValue[domain];
          let newDomainObj = newValue[domain];
          if (!oldDomainObj || newDomainObj.domainWhitelist != oldDomainObj.domainWhitelist ||
            JSON.stringify(newDomainObj.cookies) != JSON.stringify(oldDomainObj.cookies))
          {
            acc[domain] = newValue[domain];
          }
          return acc;
        }, {});
      }
      else
      {
        changed = newValue;
      }
      updateWhitelistInList(changed);
    }
  });
  onCookieChange.addListener(function(changeInfo)
  {
    var cookie = changeInfo.cookie;
    var domain = removeStartDot(cookie.domain);
    var domainListElem = tableList.getItem(domain);

    if (!domainListElem)
    {
      tableList.addItems([createDomainObj(domain, 1)]);
      return;
    }

    var cookieNum = domainListElem.texts.cookienum.split(" ")[0];
    if (changeInfo.removed)
    {
      var subItemAccessor = createSubitemAccessor(cookie);
      if (tableList.hasSubItem(domain, subItemAccessor))
      {
        domainListElem.texts.cookienum = cookieNum - 1 + " Cookies";
        tableList.updateItem(domainListElem, domain);

        if (cookieNum == 1)
          tableList.removeItem(domain);
        else
          tableList.removeSubItem(domain, subItemAccessor);
      }
      else
      {
        if (cookieNum == 1)
        {
          tableList.removeItem(domain);
        }
        else
        {
          domainListElem.texts.cookienum = cookieNum - 1 + " Cookies";
          tableList.updateItem(domainListElem, domain);
        }
      }
    }
    else
    {
      domainListElem.texts.cookienum = parseInt(cookieNum) + 1 + " Cookies";
      tableList.updateItem(domainListElem, domain);

      if (domainListElem.subItems)
        tableList.addSubItem(createCookieSubitemObj(cookie), domain);
    }
  });
})();
