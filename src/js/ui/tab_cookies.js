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

const {Elem, getMsg, createBasicSettingObj} = require("./utils");
const {registerActionListener} = require("./actionListener");
const {deleteCookies, additionalPermission} = require("../common");
const permittedUrls = additionalPermission.origins[0];
const {addSettingItem, getSettingListData, Listener} = require("./components/settingList");
const {closeDialog, openDialog} = require("./components/dialog");

(function()
{
  const setCookie = chrome.cookies.set;
  const onStorageChange =   chrome.storage.onChanged;
  const cookieWhitelistButtonTitle = getMsg("whitelistSublistCookie");
  const domainWhitelistButtonTitle = getMsg("whitelistCookieDomain");

  const activeTabCookieId = "activeTabCookies";

  let pmTable = null;
  document.addEventListener("DOMContentLoaded" , async() =>
  {
    Elem("#search-domain").addEventListener("search", populateDomainListComp, false);
    Elem("#search-domain").addEventListener("keyup", function(ev)
    {
      if (ev.key != "Enter" && ev.key != "Escape")
        populateDomainListComp();
    }, false);

    const cookiesTab = Elem("#panel-cookies");
    const leftSettingList = Elem("ul.settings-list:nth-of-type(1)", cookiesTab);
    const rightSettingList = Elem("ul.settings-list:nth-of-type(2)", cookiesTab);

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

    registerActionListener(Elem("#cookiesContainer"), onCookiesAction);
    registerActionListener(Elem("#dialog-content-cookie-form"), onCookiesAction);
    registerActionListener(Elem("#dialog-content-cookie-delete-all"), onCookiesAction);

    pmTable = document.querySelector("pm-table");
    pmTable.setListener(onCookiesActionComp);
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
        populateDomainListComp();
    }
  }

  async function getCookiesCountForDomain()
  {
    const cookies = await browser.cookies.getAll({});
    return cookies.reduce((acc, {domain}) =>
    {
      const genericDomain =  removeStartDot(domain);
      if (acc[genericDomain])
        acc[genericDomain] = ++acc[genericDomain];
      else
        acc[genericDomain] = 1;
      return acc;
    }, {});
  }

  async function populateDomainListComp()
  {
    pmTable.empty();
    const searchExpression = new RegExp(Elem("#search-domain").value);
    const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
    const isWhitelisted = (domain) =>
    {
      return cookieWhitelist[domain] && cookieWhitelist[domain].domainWhitelist;
    };
    const domainObjs = [];
    const domainCounts =  await getCookiesCountForDomain();
    for (const domain in domainCounts)
    {
      if (!searchExpression.test(domain))
        continue;

      const count = domainCounts[domain];
      domainObjs.push(createDomainObjPm(domain, count, isWhitelisted(domain)));
    }
    document.querySelector("pm-table").addItems(domainObjs);
  }

  function setCookiesNum(cookienum)
  {
    return cookienum + " Cookies";
  }

  /**
   * Create a Table List Item Structure Object
   * @param {String} domain Domain name
   * @param {Number} cookienum Number of domain cookies
   * @param {Boolean} whitelist specifies whether domain is whitelisted
   */
  function createDomainObjPm(domain, cookienum, whitelist)
  {
    return {
      id: domain,
      texts: {
        domain: domain,
        cookienum: setCookiesNum(cookienum)
      },
      titles: {
        whitelist: domainWhitelistButtonTitle
      },
      dataset: {whitelist}
    };
  }

  async function getWhitelistedCookies(domain)
  {
    const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
    return cookieWhitelist[domain] && cookieWhitelist[domain].cookies || [];
  }

  async function isCookieWhitelisted(domain, cookie)
  {
    const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
    return cookieWhitelist[domain] && cookieWhitelist[domain].cookies &&
           cookieWhitelist[domain].cookies.includes(cookie);
  }

  async function isDomainWhitelisted(domain)
  {
    const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
    return cookieWhitelist && cookieWhitelist[domain] && cookieWhitelist[domain].domainWhitelist;
  }

  async function setWhitelistDomain(domain, value)
  {
    const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
    if (!(domain in cookieWhitelist))
      cookieWhitelist[domain] = {domainWhitelist: value, cookies: []};
    else
      cookieWhitelist[domain].domainWhitelist = value;
    await browser.storage.local.set({cookieWhitelist});
  }

  async function setWhitelistCookie(domain, cookie, value)
  {
    const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
    if (!(domain in cookieWhitelist))
      cookieWhitelist[domain] = {domainWhitelist: false, cookies: [cookie]};
    else if (cookieWhitelist[domain].cookies.includes(cookie))
      cookieWhitelist[domain].cookies = cookieWhitelist[domain].cookies.filter(el => el !== cookie);
    else
      cookieWhitelist[domain].cookies.push(cookie);
    await browser.storage.local.set({cookieWhitelist});
  }

  async function onCookiesActionComp(action, item, parentItem)
  {
    pmTable = document.querySelector("pm-table");
    switch (action)
    {
      case "get-cookies":
      {
        const subitems = item.subItems;
        if (subitems)
        {
          onCookiesActionComp("close-expanded-domain", null, item);
          return;
        }
        const domain = item.id;
        const cookies = await browser.cookies.getAll({domain});

        for (const cookie of cookies)
        {
          // Filter subdomains matched cookies
          if (cookie.domain.indexOf(domain) > 1)
            continue;

          const isWhitelisted = await isCookieWhitelisted(domain, cookie.name);
          pmTable.addItems([createCookieSubitemObjComp(cookie, isWhitelisted)], domain);
        }
        const subitemId = pmTable.getItem(domain).subItems[0].id;
        pmTable.selectItem(subitemId, domain);
        break;
      }
      case "close-expanded-domain":
      {
        pmTable.empty(parentItem.id);
        break;
      }
      case "whitelist-domain":
      {
        const domain = item.texts.domain;
        const currentValue = await isDomainWhitelisted(domain);
        await setWhitelistDomain(domain, !currentValue);
        break;
      }
      case "whitelist-cookie":
      {
        const cookie = item.texts.name;
        const domain = parentItem.texts.domain;
        await setWhitelistCookie(domain, cookie);
        break;
      }
      case "delete-domain":
      {
        const domain = item.texts.domain;
        const cookies = await browser.cookies.getAll({domain});
        for (const cookie of cookies)
        {
          const url = getUrl(cookie.domain, cookie.path, cookie.secure);
          browser.cookies.remove({"url": url, "name": cookie.name});
        }
        break;
      }
      case "open-dialog": {
        openDialog("cookie-edit");
        break;
      }
      case "delete-cookie":
      {
        const domain = parentItem.texts.domain;
        const cookies = await browser.cookies.getAll({domain});
        for (const cookie of cookies)
        {
          // Filter subdomains matched cookies
          if (cookie.domain.indexOf(domain) > 1)
            continue;

          if (item.texts.name === cookie.name)
          {
            const url = getUrl(domain, cookie.path, cookie.secure);
            browser.cookies.remove({url, "name": cookie.name});
          }
        }
        break;
      }
      case "edit-cookie": {
        const dialogObj = getCookieDialogData();
        dialogObj.form.reset();
        const {path, secure} = item.dataset;
        const cookieName = item.texts.name;
        const domain = parentItem.texts.domain;
        const url = getUrl(domain, path, secure);

        const cookie = await browser.cookies.get({url, name: cookieName});
        const fieldsObj = dialogObj.fields;
        fieldsObj.domain.setAttribute("disabled", "disabled");
        fieldsObj.name.setAttribute("disabled", "disabled");
        fieldsObj.name.value = cookie.name;
        fieldsObj.value.value = cookie.value;
        fieldsObj.value.focus();
        fieldsObj.domain.value = removeStartDot(cookie.domain);
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
        break;
      }
    }
  }

  function onCookiesAction(action)
  {
    switch (action)
    {
      case "add-cookie": {
        const dialogObj = getCookieDialogData();
        dialogObj.form.reset();
        const fieldsObj = dialogObj.fields;
        fieldsObj.domain.removeAttribute("disabled");
        fieldsObj.domain.focus();
        fieldsObj.name.removeAttribute("disabled");
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
        populateDomainListComp();
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

  function createCookieSubitemObjComp(cookie, whitelist)
  {
    return {
      id: cookie.name,
      texts: {
        name: cookie.name,
        value: cookie.value
      },
      titles: {
         whitelist: cookieWhitelistButtonTitle
      },
      dataset: {whitelist, path: cookie.path, secure: cookie.secure}
    };
  }

  onStorageChange.addListener(async({cookieWhitelist}) =>
  {
    if (cookieWhitelist)
    {
      const {newValue, oldValue} = cookieWhitelist;

      for (const domain in newValue)
      {
        if (!oldValue[domain])
        {
          if (newValue[domain].domainWhitelist)
          {
            const item = pmTable.getItem(domain);
            item.dataset.whitelist = true;
            pmTable.updateItem(item, domain);
          }
        }
        else
        {
          const oldDomainObj = oldValue[domain];
          const newDomainObj = newValue[domain];
          if (newDomainObj.domainWhitelist !== oldDomainObj.domainWhitelist)
          {
            const item = pmTable.getItem(domain);
            item.dataset.whitelist = newDomainObj.domainWhitelist;
            pmTable.updateItem(item, domain);
          }
          const oldCookies = oldDomainObj.cookies;
          const newCookies = newDomainObj.cookies;
          for (const cookie of newCookies)
          {
            if (!oldCookies.includes(cookie))
            {
              const item = pmTable.getItem(cookie, domain);
              item.dataset.whitelist = true;
              pmTable.updateItem(item, cookie, domain);
            }
            oldCookies.splice(oldCookies.indexOf(cookie), 1);
          }
          for (const cookie of oldCookies)
          {
            const item = pmTable.getItem(cookie, domain);
            item.dataset.whitelist = false;
            pmTable.updateItem(item, cookie, domain);
          }
        }
      }
    }
  });

  browser.cookies.onChanged.addListener(async({cookie, removed}) =>
  {
    const domain = removeStartDot(cookie.domain);
    const domainCounts =  await getCookiesCountForDomain();

    if (removed)
    {
      if (!pmTable.getItem(domain) || !pmTable.getItem(cookie.name, domain))
        return;

      if (!domainCounts[domain])
      {
        pmTable.removeItem(domain);
        const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
        delete cookieWhitelist[domain];
        await browser.storage.local.set({cookieWhitelist});
      }
      else
      {
        pmTable.removeItem(cookie.name, domain);
        setWhitelistCookie(domain, cookie.name, false);
        const domainItem = pmTable.getItem(domain);
        domainItem.texts.cookienum = setCookiesNum(domainCounts[domain]);
        pmTable.updateItem(domainItem, domain);
      }
    }
    else
    {
      const isWhitelisted = await isCookieWhitelisted(domain, cookie.name);
      const newItem = createCookieSubitemObjComp(cookie, isWhitelisted);
      const hasDomainItem = pmTable.getItem(domain);
      const isDomainExpanded = hasDomainItem && hasDomainItem.subItems;
      const hasCookieItem = pmTable.getItem(cookie.name, domain);

      if (hasCookieItem && hasDomainItem)
      {
        pmTable.updateItem(newItem, cookie.name, domain);
      }
      else if (!hasDomainItem)
      {
        const whitelisted = await isDomainWhitelisted(domain);
        const domainItem = createDomainObjPm(domain, domainCounts[domain],
                                             whitelisted);
        pmTable.addItems([domainItem]);
      }
      else if (isDomainExpanded)
      {
        const domainItem = pmTable.getItem(domain);
        domainItem.texts.cookienum = setCookiesNum(domainCounts[domain]);
        pmTable.updateItem(domainItem, domain);
        pmTable.addItems([newItem], domain);
      }
      else
      {
        const domainItem = pmTable.getItem(domain);
        domainItem.texts.cookienum = setCookiesNum(domainCounts[domain]);
        pmTable.updateItem(domainItem, domain);
      }
    }
  });
})();
