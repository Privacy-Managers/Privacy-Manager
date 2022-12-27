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

const {$, getMessage} = require("../helpers/utils");
const {registerActionListener} = require("../helpers/actionListener");
const {deleteCookies, additionalPermission} = require("../../common");
const permittedUrls = additionalPermission.origins[0];
const {addStorageToggle, addPermissionToggle,
      getSettingListData} = require("../helpers/settingList");

let cookieWhitelistTitle = "";
let domainWhitelistTitle = "";
getMessage("whitelistSublistCookie").then(msg => cookieWhitelistTitle = msg);
getMessage("whitelistCookieDomain").then(msg => domainWhitelistTitle = msg);

const activeTabCookieId = "activeTabCookies";

let pmTable = null;
let cookieDialog = null;
let removeCookieDialog = null;
document.addEventListener("DOMContentLoaded" , async() =>
{
  $("#search-domain").addEventListener("search", populateDomainList, false);
  $("#search-domain").addEventListener("keyup", function(ev)
  {
    if (ev.key != "Enter" && ev.key != "Escape")
      populateDomainList();
  }, false);
  pmTable = document.querySelector("pm-table");
  pmTable.setListener(onCookiesAction);

  const cookiesTab = $("#panel-cookies");
  const leftSettingList = $("ul.settings-list:nth-of-type(1)", cookiesTab);
  const rightSettingList = $("ul.settings-list:nth-of-type(2)", cookiesTab);

  addPermissionToggle("additionalPermissions", leftSettingList);
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

  addStorageToggle(activeTabCookieId, rightSettingList, (active) =>
  {
    if (active)
      updateFilterToActiveDomain();
  });

  cookieDialog = document.querySelector("pm-dialog.cookies");
  removeCookieDialog = document.querySelector("pm-dialog.delete-cookies");

  registerActionListener($("#cookiesContainer"), onCookiesAction);
  registerActionListener(cookieDialog, onCookiesAction);
  registerActionListener(removeCookieDialog, onCookiesAction);
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

async function populateDomainList()
{
  pmTable.empty();
  const searchExpression = new RegExp($("#search-domain").value);
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
    domainObjs.push(createDomainObj(domain, count, isWhitelisted(domain)));
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
function createDomainObj(domain, cookienum, whitelist)
{
  return {
    id: domain,
    texts: {
      domain: domain,
      cookienum: setCookiesNum(cookienum)
    },
    titles: {
      whitelist: domainWhitelistTitle
    },
    dataset: {whitelist}
  };
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

async function toggleWhitelistCookie(domain, cookie)
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

async function removeWhitelistCookie(domain, cookie)
{
  if (!await isCookieWhitelisted(domain, cookie))
    return;

  const {cookieWhitelist} = await browser.storage.local.get("cookieWhitelist");
  cookieWhitelist[domain].cookies = cookieWhitelist[domain].cookies.filter(el => el !== cookie);
  await browser.storage.local.set({cookieWhitelist});
}

async function onCookiesAction(action, item, parentItem)
{
  pmTable = document.querySelector("pm-table");
  switch (action)
  {
    case "get-cookies":
    {
      const subitems = item.subItems;
      if (subitems)
      {
        onCookiesAction("close-expanded-domain", null, item);
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
        pmTable.addItems([createCookieSubitemObj(cookie, isWhitelisted)], domain);
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
      await toggleWhitelistCookie(domain, cookie);
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
      const cookieName = item.texts.name;
      const url = getUrl(parentItem.texts.domain,
                         item.dataset.path,
                         item.dataset.secure);
      const {name, value, domain, path, hostOnly, httpOnly, secure,
              session, storeId,
              expirationDate} = await browser.cookies.get({url, name: cookieName});
      let date, time = "";
      if (expirationDate)
      {
        const dateTime = new Date(expirationDate * 1000);
        // <input type="date"> supports -> yyyy-mm-dd
        const convertMonth = (month) => month < 9 ? `0${month + 1}` : month + 1;
        const convertDate = (date) => date < 10 ? `0${date}` : date;
        const year = dateTime.getFullYear();
        const month = convertMonth(dateTime.getMonth());
        const day = convertDate(dateTime.getDate());
        date = `${year}-${month}-${day}`;
        // <input type="time"> supports -> hh:mm:ss
        const twoDigits = (value) => value < 10 ? `0${value}` : value;
        const hour = twoDigits(dateTime.getHours());
        const minute = twoDigits(dateTime.getMinutes());
        const second = twoDigits(dateTime.getSeconds());
        time = `${hour}:${minute}:${second}`;
      }
      const title = await getMessage("editCookie");
      const actionBtn = await getMessage("cookieDialog_update");
      const data = {
        name, value, path, hostOnly, httpOnly, session, storeId, secure,
        actionBtn,
        domain: removeStartDot(domain),
        expirationDate: date,
        expirationTime: time
      };
      resetDialog();
      getDialogField("name").setAttribute("disabled", "disabled");
      getDialogField("domain").setAttribute("disabled", "disabled");
      cookieDialog.classList.remove("add");
      cookieDialog.showDialog(title, data);
      break;
    }
    case "add-cookie": {
      resetDialog();
      const title = await getMessage("addCookie");
      getDialogField("name").removeAttribute("disabled");
      getDialogField("domain").removeAttribute("disabled");
      const actionBtn = await getMessage("cookieDialog_add");
      cookieDialog.classList.add("add");
      cookieDialog.showDialog(title, {actionBtn});
      break;
    }
    case "update-cookie": {
      if (!cookieDialog.querySelector("form").reportValidity())
        return;

      const time = getDialogField("expirationTime").value;
      const date = getDialogField("expirationDate").value;
      const dateTime = time ? `${date}T${time}` : date;

      const cookie = {
        "url": getUrl(getDialogField("domain").value,
                      getDialogField("path").value,
                      getDialogField("secure").checked),
        "path": getDialogField("path").value,
        "domain": getDialogField("domain").value,
        "name": getDialogField("name").value,
        "value": getDialogField("value").value,
        "secure": getDialogField("secure").checked,
        "httpOnly": getDialogField("httpOnly").checked,
        "storeId": getDialogField("storeId").value,
        "expirationDate": new Date(dateTime).getTime() / 1000
      };

      if (getDialogField("hostOnly").checked)
      {
        // Omitted domain makes host-only cookie
        delete cookie.domain;
      }
      if (getDialogField("session").checked)
      {
        // Omitted expirationDate makes session cookie
        delete cookie.expirationDate;
      }
      if (await browser.cookies.set(cookie))
      {
        cookieDialog.closeDialog();
      }
      break;
    }
    case "open-cookie-removal-dialog": {
      const title = await getMessage("deleteAll");
      removeCookieDialog.showDialog(title);
      break;
    }
    case "delete-all-cookies": {
      deleteCookies();
      removeCookieDialog.closeDialog();
      break;
    }
  }
}

function getDialogField(id)
{
  return cookieDialog.querySelector(`[data-id='${id}']`);
}

function resetDialog()
{
  cookieDialog.querySelector("form").reset();
}

/**
 * Filter cookies list according to the active tab URL
 */
async function updateFilterToActiveDomain()
{
  const tab = await browser.tabs.query({active: true});
  const url = tab[0].url;
  if (url.indexOf("://") > -1)
  {
    const domain = url.split('/')[2].split(':')[0].replace("www.", "");
    $("#search-domain").value = domain;
    populateDomainList();
  }
}

/**
 * Enable/disable control elements
 * @param {Boolean} disabled
 */
function disableControls(disabled)
{
  $("#cookie-controls").childNodes.forEach(function(Node)
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

function createCookieSubitemObj(cookie, whitelist)
{
  return {
    id: cookie.name,
    texts: {
      name: cookie.name,
      value: cookie.value
    },
    titles: {
        whitelist: cookieWhitelistTitle
    },
    dataset: {whitelist, path: cookie.path, secure: cookie.secure}
  };
}

browser.storage.onChanged.addListener(async({cookieWhitelist}) =>
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
          if (item)
          {
            item.dataset.whitelist = true;
            pmTable.updateItem(item, domain);
          }
        }
        for (const cookie of newValue[domain].cookies)
        {
          const item = pmTable.getItem(cookie, domain);
          if (item)
          {
            item.dataset.whitelist = true;
            pmTable.updateItem(item, cookie, domain);
          }
        }
      }
      else
      {
        const oldDomainObj = oldValue[domain];
        const newDomainObj = newValue[domain];
        if (newDomainObj.domainWhitelist !== oldDomainObj.domainWhitelist)
        {
          const item = pmTable.getItem(domain);
          if (item)
          {
            item.dataset.whitelist = newDomainObj.domainWhitelist;
            pmTable.updateItem(item, domain);
          }
        }
        const oldCookies = oldDomainObj.cookies;
        const newCookies = newDomainObj.cookies;
        for (const cookie of newCookies)
        {
          if (!oldCookies.includes(cookie))
          {
            const item = pmTable.getItem(cookie, domain);
            if (item)
            {
              item.dataset.whitelist = true;
              pmTable.updateItem(item, cookie, domain);
            }
          }
          oldCookies.splice(oldCookies.indexOf(cookie), 1);
        }
        for (const cookie of oldCookies)
        {
          const item = pmTable.getItem(cookie, domain);
          if (item)
          {
            item.dataset.whitelist = false;
            pmTable.updateItem(item, cookie, domain);
          }
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
    if (!pmTable.getItem(domain))
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
      removeWhitelistCookie(domain, cookie.name);
      const domainItem = pmTable.getItem(domain);
      domainItem.texts.cookienum = setCookiesNum(domainCounts[domain]);
      pmTable.updateItem(domainItem, domain);
    }
  }
  else
  {
    const isWhitelisted = await isCookieWhitelisted(domain, cookie.name);
    const newItem = createCookieSubitemObj(cookie, isWhitelisted);
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
      const domainItem = createDomainObj(domain, domainCounts[domain],
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
