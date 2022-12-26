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
const path = require("path");
const {readFileSync, unlinkSync} = require("fs");

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
    res.writeHead(200, {'Content-Type': 'text/plain', 'test-header': 'test-value'});
    res.end("Hello");
  }).listen(4000);
}

function getLoadedAmount(id)
{
  return page.evaluate((tableListHandle, id) =>
  {
    let elements = tableListHandle.shadowRoot.querySelector("ul").children;
    if (id)
    {
      const index = tableListHandle.getItemIndex(id);
      elements = elements[index].querySelector("ul").children;
    }
    return elements.length;
  }, tableListHandle, id);
}

function getItemElemId(num)
{
  return page.evaluate((tableListHandle, num) =>
  {
    let elements = tableListHandle.shadowRoot.querySelector("ul").children;
    return elements[num].dataset.id;
  }, tableListHandle, num);
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

async function getItemText(id, parentId, text)
{
  if (!(await tableList.getItem(id, parentId)))
    return null;
  return (await tableList.getItem(id, parentId)).texts[text];
}

async function getItemData(id, parentId, name)
{
  return (await tableList.getItem(id, parentId)).data[name];
}

async function getItemElemHandle(id, parentId)
{
  return await page.evaluateHandle((handle, id, parentId) => handle.getItemElem(id, parentId), tableListHandle, id, parentId);
}

function getItemElemDatasetId(id, parentId)
{
  return page.evaluate((tableListHandle, id, parentId) =>
  {
    if (tableListHandle.getItemElem(id, parentId))
      return tableListHandle.getItemElem(id, parentId).dataset.id;
  }, tableListHandle, id, parentId);
}

async function ensureItem(id, parentId)
{
  return !!(await getItemElemDatasetId(id, parentId) ||
            await tableList.getItem(id, parentId));
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

describe("Testing Network tab", () =>
{
  before(async() =>
  {
    await allUrlsToPermissions();
    page = await openPopupPage();
    await page.click("#tab-network");
    startHttpServer();
    page2 = await getBrowser().newPage();
    page.bringToFront();
    tableListHandle = await page.$("#panel-network pm-table");
  });

  it("When collectHeaders is set requests should be added into network tab", async() =>
  {
    const handle =  await getHandle("collectHeaders");
    await clickToggle(handle);
    await page.waitForTimeout(10);
    await page2.goto("http://127.0.0.1:4000/");
    await page.waitForTimeout(50);
    equal((await getItemText("pm-table-item1", null, "type")), "main_frame");
    equal((await getItemText("pm-table-item1", null, "url")), "http://127.0.0.1:4000/");
    equal((await getItemData("pm-table-item1", null, "type")), "send");
    equal((await getItemText("pm-table-item2", null, "type")), "main_frame");
    equal((await getItemText("pm-table-item2", null, "url")), "http://127.0.0.1:4000/");
    equal((await getItemData("pm-table-item2", null, "type")), "receive");
    equal((await getItemText("pm-table-item3", null, "type")), "image");
    equal((await getItemText("pm-table-item3", null, "url")), "http://127.0.0.1:4000/favicon.ico");
    equal((await getItemData("pm-table-item3", null, "type")), "send");
    (await getItemElemHandle("pm-table-item1")).click();
    await page.waitForTimeout(50);
    equal((await getItemText("method", "pm-table-item1", "name")), "method");
    equal((await getItemText("method", "pm-table-item1", "value")), "GET");
    equal((await getItemText("type", "pm-table-item1", "name")), "type");
    equal((await getItemText("type", "pm-table-item1", "value")), "main_frame");
    equal((await getItemText("url", "pm-table-item1", "name")), "url");
    equal((await getItemText("url", "pm-table-item1", "value")), "http://127.0.0.1:4000/");
    (await getItemElemHandle("pm-table-item2")).click();
    await page.waitForTimeout(50);
    equal((await getItemText("statusCode", "pm-table-item2", "name")), "statusCode");
    equal((await getItemText("statusCode", "pm-table-item2", "value")), "200");
    equal((await getItemText("statusCode", "pm-table-item2", "name")), "statusCode");
    equal((await getItemText("statusCode", "pm-table-item2", "value")), "200");
    equal((await getItemText("test-header", "pm-table-item2", "name")), "test-header");
    equal((await getItemText("test-header", "pm-table-item2", "value")), "test-value");
  });

  it("Reloading the page should keep the replace already recorded", async() =>
  {
    await page.reload();
    await page.waitForTimeout(100);
    tableListHandle = await page.$("#panel-network pm-table");
    equal(await ensureItem("pm-table-item1"), true);
    equal(await ensureItem("pm-table-item2"), true);
    equal(await ensureItem("pm-table-item3"), true);
    equal(await ensureItem("pm-table-item4"), true);
  });

  it("Hitting 'Delete All' button should empty network table", async() =>
  {
    await page.click("pm-button[data-action='delete-all']");
    await page.waitForTimeout(30);
    equal(await ensureItem("pm-table-item1"), false);
    equal(await ensureItem("pm-table-item2"), false);
  });

  it("Switching blockUserAgent on should block User agent from the request", async() =>
  {
    await page2.reload();
    await page.waitForTimeout(100);
    (await getItemElemHandle(await getItemElemId(0))).click();
    await page.waitForTimeout(50);
    equal(await getItemText("User-Agent", await getItemElemId(0), "name"), "User-Agent");
    await clickToggle(await getHandle("blockUserAgent"));
    await page.waitForTimeout(30);
    await page.click("pm-button[data-action='delete-all']");
    await page.reload();
    await page2.reload();
    await page.waitForTimeout(100);
    tableListHandle = await page.$("#panel-network pm-table");
    (await getItemElemHandle(await getItemElemId(0))).click();
    await page.waitForTimeout(50);
    equal(await getItemText("User-Agent", await getItemElemId(0), "name"), null);
  });

  it("Clicking on 'Download All' button should download all collected requests", async() =>
  {
    await page._client.send('Page.setDownloadBehavior', {
      behavior: "allow",
      downloadPath: __dirname
    });
    await page.click("pm-button[data-action='download-all']");
    await page.waitForTimeout(300);
    const file = readFileSync(path.join(__dirname, "requests.json"));
    const requests = JSON.parse(file);

    equal(requests[0].action, "send");
    equal(requests[0].method, "GET");
    ok(requests[0].headers);
    equal(requests[0].type, "main_frame");
    equal(requests[0].url, "http://127.0.0.1:4000/");

    equal(requests[1].action, "receive");
    equal(requests[1].headers["Content-Type"], "text/plain");
    equal(requests[1].headers["test-header"], "test-value");
    equal(requests[1].statusCode, 200);

    equal(requests[2].url, "http://127.0.0.1:4000/favicon.ico");

    equal(requests[3].url, "http://127.0.0.1:4000/favicon.ico");
    equal(requests[3].type, "image");
  });

  it("Switching collectHeaders off should stop adding into network tab", async() =>
  {
    await page.click("pm-button[data-action='delete-all']");
    await page.waitForTimeout(30);
    await page2.goto("http://127.0.0.1:4000/");
    await page.waitForTimeout(30);
    equal(await getLoadedAmount(), 4);
    await clickToggle(await getHandle("collectHeaders"));
    await page.click("pm-button[data-action='delete-all']");
    await page.waitForTimeout(30);
    await page2.goto("http://127.0.0.1:4000/");
    await page.waitForTimeout(30);
    equal(await getLoadedAmount(), 0);
  });

  after(async() =>
  {
    unlinkSync(path.join(__dirname, "requests.json"));
    await restorePermissions();
    await closeBrowser();
    server.close();
  });
});
