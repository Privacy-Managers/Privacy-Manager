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

const {allUrlsToPermissions, restorePermissions} = require("../manifest");
const {openPopupPage, closeBrowser, getBrowser} = require("../common");
const {equal, ok} = require("assert");

let page;
let page2;
let tableListHandle;
let server = null;

const tableList = {};
const methods = ["getItemIndex", "addItems", "getItem", "removeItem",
                 "selectItem", "removeItem", "empty", "updateItem"];

function startHttpServer()
{
  const http = require('http');

  server = http.createServer((req, res) =>
  {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end("Hello");
  }).listen(4000);
}

methods.forEach((methodName) =>
{
  tableList[methodName] = (...args) => runComponentMethod(methodName, ...args);
});

function runComponentMethod()
{
  const functionName = arguments[0];
  const args = Array.prototype.slice.call(arguments, 1);
  return page.evaluate((tableListHandle, functionName, args) =>
  {
    return tableListHandle[functionName](...args);
  }, tableListHandle, functionName, args);
}

function isEnabled(pmToggleHandle)
{
  return page.evaluate((pmToggleHandle) =>
  {
    return pmToggleHandle.isEnabled();
  }, pmToggleHandle);
}

function isLocalStorageSet()
{
  return page2.evaluate(() =>
  {
    return window.localStorage.getItem("test-key");
  });
}

function isCookieSet()
{
  return page2.evaluate(() =>
  {
    return document.cookie.includes("test-name");
  });
}

function triggerDataDeletion(pmToggleHandle)
{
  return page.evaluate(async() =>
  {
    await browser.runtime.sendMessage({message: "deleteBrowsingData"});
  }, pmToggleHandle);
}

function clickToggle(pmToggleHandle)
{
  return page.evaluate((pmToggleHandle) =>
  {
    pmToggleHandle.shadowRoot.querySelector("#toggle").click();
  }, pmToggleHandle);
}

async function getHandle(access)
{
  return await page.$(`[data-access='${access}']`);
}

function setCookie()
{
  return page2.evaluate(() =>
  {
    const setCookie = (name, value, days = 7, path = '/') =>
    {
      const expires = new Date(Date.now() + days * 864e5).toUTCString();
      document.cookie = name + '=' + encodeURIComponent(value) + '; expires=' +
                        expires + '; path=' + path;
    };
    setCookie("test-name", "test-value");
  });
}

function setStorage()
{
  return page2.evaluate(() =>
  {
    window.localStorage.setItem("test-key", "test-value");
  });
}

describe("Testing Data deletion", () =>
{
  before(async() =>
  {
    await allUrlsToPermissions();
    page = await openPopupPage();
    startHttpServer();
    page2 = await getBrowser().newPage();
    page.bringToFront();
    tableListHandle = await page.$("#panel-network pm-table");
  });

  it("Data deletion should clear data for the toggles that are enabled in the 'Clear on startup' section", async() =>
  {
    await page2.goto("http://127.0.0.1:4000/");
    await page2.waitForTimeout(50);
    ok(!await isLocalStorageSet());
    ok(!await isCookieSet());
    await setCookie();
    await setStorage();
    await page2.waitForTimeout(50);
    ok(await isLocalStorageSet());
    ok(await isCookieSet());

    const cookieHandle = await getHandle("cookies");
    const localStorage = await getHandle("localStorage");
    await clickToggle(await getHandle("cookies"));
    await clickToggle(await getHandle("localStorage"));
    equal(await isEnabled(cookieHandle), true);
    equal(await isEnabled(localStorage), true);
    await triggerDataDeletion();
    await page2.waitForTimeout(50);
    ok(!await isLocalStorageSet());
    ok(!await isCookieSet());
    await clickToggle(await getHandle("cookies"));
    await clickToggle(await getHandle("localStorage"));
    await page2.waitForTimeout(200);
    equal(await isEnabled(cookieHandle), false);
    equal(await isEnabled(localStorage), false);
  });

  it("Data deletion should clear all browsing datas when 'Remove All' is enabled in the 'Clear on startup' section", async() =>
  {
    await setCookie();
    await setStorage();
    await page2.waitForTimeout(50);
    ok(await isLocalStorageSet());
    ok(await isCookieSet());

    await clickToggle(await getHandle("removeAll"));
    await page2.waitForTimeout(50);
    await triggerDataDeletion();
    await page2.waitForTimeout(50);
    ok(!await isLocalStorageSet());
    ok(!await isCookieSet());
  });

  after(async() =>
  {
    await restorePermissions();
    if (!process.env.KEEP_BROWSER)
    {
      await closeBrowser();
    }
    server.close();
  });
});
