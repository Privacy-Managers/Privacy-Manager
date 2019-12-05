const {allUrlsToPermissions, restorePermissions} = require("../manifest");
const {openPopupPage, closeBrowser, getBrowser} = require("../common");
const {equal} = require("assert");
const path = require("path");

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
    await page.waitFor(10);
    await page2.goto("http://127.0.0.1:4000/");
    await page.waitFor(50);
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
    await page.waitFor(50);
    equal((await getItemText("method", "pm-table-item1", "name")), "method");
    equal((await getItemText("method", "pm-table-item1", "value")), "GET");
    equal((await getItemText("type", "pm-table-item1", "name")), "type");
    equal((await getItemText("type", "pm-table-item1", "value")), "main_frame");
    equal((await getItemText("url", "pm-table-item1", "name")), "url");
    equal((await getItemText("url", "pm-table-item1", "value")), "http://127.0.0.1:4000/");
    (await getItemElemHandle("pm-table-item2")).click();
    await page.waitFor(50);
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
    await page.waitFor(100);
    tableListHandle = await page.$("#panel-network pm-table");
    equal(await ensureItem("pm-table-item1"), true);
    equal(await ensureItem("pm-table-item2"), true);
    equal(await ensureItem("pm-table-item3"), true);
    equal(await ensureItem("pm-table-item4"), true);
  });

  it("Hitting 'Delete All' button should empty network table", async() =>
  {
    await page.click("pm-button[data-action='delete-all']");
    await page.waitFor(30);
    equal(await ensureItem("pm-table-item1"), false);
    equal(await ensureItem("pm-table-item2"), false);
  });

  it("Switching collectHeaders off should stop addeding into network tab", async() =>
  {
    await page2.goto("http://127.0.0.1:4000/");
    await page.waitFor(30);
    equal(await getLoadedAmount(), 4);
    const handle =  await getHandle("collectHeaders");
    await clickToggle(handle);
    await page.click("pm-button[data-action='delete-all']");
    await page.waitFor(30);
    await page2.goto("http://127.0.0.1:4000/");
    await page.waitFor(30);
    equal(await getLoadedAmount(), 0);
  });

  after(async() =>
  {
    await restorePermissions();
    await closeBrowser();
    server.close();
  });
});
