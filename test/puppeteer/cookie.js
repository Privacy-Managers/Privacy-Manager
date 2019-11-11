const {allUrlsToPermissions, restorePermissions} = require("../manifest");
const {openPopupPage, closeBrowser} = require("../common");
const {equal} = require("assert");

let page;
let tableListHandle;

const tableList = {};
const methods = ["getItemIndex", "addItems", "getItem", "removeItem",
                 "selectItem", "removeItem", "empty", "updateItem"];

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

async function getItemElemHandle(id, parentId)
{
  return await page.evaluateHandle((handle, id, parentId) => handle.getItemElem(id, parentId), tableListHandle, id, parentId);
}

async function whitelistButtonHandle(id, parentId)
{
  return await page.evaluateHandle((handle, id, parentId) => handle.getItemElem(id, parentId).querySelector(".whitelist"), tableListHandle, id, parentId);
}

async function isWhitelisted(id, parentId)
{
  return page.evaluate(async(tableListHandle, id, parentId) =>
  {
    return tableListHandle.getItemElem(id, parentId).dataset.whitelist;
  }, tableListHandle, id, parentId);
}

async function deleteButtonHandle(id, parentId)
{
  return await page.evaluateHandle((handle, id, parentId) => handle.getItemElem(id, parentId).querySelector(".delete"), tableListHandle, id, parentId);
}

describe("Testing Cookies tab", () =>
{
  before(async() =>
  {
    await allUrlsToPermissions();
    page = await openPopupPage();
    await page.click("#tab-cookies");
    tableListHandle = await page.$('pm-table');
  });

  it("Adding cookies should populate the list of domains, but not individual cookies", async() =>
  {
    const getCookieNum = async(id) =>
    {
      return (await tableList.getItem(id)).texts.cookienum;
    };
    await page.evaluate(async() =>
    {
      for (let i = 1; i < 5; i++)
      {
        for (let j = 1; j <= i; j++)
        {
          await browser.cookies.set({
            url: `https://domain${i}.com`,
            name: `name${j}`,
            value: `value${j}`
          });
        }
      }
    });

    equal(await getCookieNum("domain1.com"), "1 Cookies");
    equal(await getCookieNum("domain2.com"), "2 Cookies");
    equal(await getCookieNum("domain3.com"), "3 Cookies");
    equal(await ensureItem("domain1.com"), true);
    equal(await ensureItem("domain2.com"), true);
    equal(await ensureItem("domain3.com"), true);
  });

  it("Clicking on domain row should populate individual cookies", async() =>
  {
    equal(await ensureItem("name1", "domain1.com"), false);
    await (await getItemElemHandle("domain1.com")).click();
    await page.waitFor(300);
    equal(await ensureItem("name1", "domain1.com"), true);

    equal(await ensureItem("name1", "domain2.com"), false);
    equal(await ensureItem("name2", "domain2.com"), false);
    await (await getItemElemHandle("domain2.com")).click();
    await page.waitFor(300);
    equal(await ensureItem("name1", "domain2.com"), true);
    equal(await ensureItem("name2", "domain2.com"), true);

    equal(await ensureItem("name3", "domain3.com"), false);
    await (await getItemElemHandle("domain3.com")).click();
    await page.waitFor(300);
    equal(await ensureItem("name3", "domain3.com"), true);
  });

  it("Clicking whitelist button should whitelist domain and/or cookie accordingly", async() =>
  {
    equal(await isWhitelisted("domain3.com"), "false");
    await (await whitelistButtonHandle("domain3.com")).click();
    await page.waitFor(300);
    equal(await isWhitelisted("domain3.com"), "true");

    equal(await isWhitelisted("name2", "domain3.com"), "false");
    await (await whitelistButtonHandle("name2", "domain3.com")).click();
    await page.waitFor(300);
    equal(await isWhitelisted("name2", "domain3.com"), "true");
  });

  it("Clicking delete button should delete domain and/or cookie accordingly", async() =>
  {
    await (await getItemElemHandle("domain4.com")).click();
    await page.waitFor(300);
    equal(await ensureItem("domain4.com"), true);
    equal(await ensureItem("name2", "domain4.com"), true);
    await (await deleteButtonHandle("name2", "domain4.com")).click();
    await page.waitFor(300);
    equal(await ensureItem("name2", "domain4.com"), false);
    equal(await ensureItem("name3", "domain4.com"), true);
    await (await deleteButtonHandle("domain4.com")).click();
    await page.waitFor(300);
    equal(await ensureItem("name3", "domain4.com"), false);
    equal(await ensureItem("domain4.com"), false);
  });

  after(async() =>
  {
    await restorePermissions();
    await closeBrowser();
  });
});
