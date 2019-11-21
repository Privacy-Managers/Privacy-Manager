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

async function editButtonHandle(id, parentId)
{
  return await page.evaluateHandle((handle, id, parentId) => handle.getItemElem(id, parentId).querySelector(".edit"), tableListHandle, id, parentId);
}

async function addCookie(url, name, value)
{
  return page.evaluate(async(url, name, value) =>
  {
    await browser.cookies.set({url, name, value});
  }, url, name, value);
}

async function setCookieDialog(fieldId, value)
{
  return page.evaluate(async(fieldId, value) =>
  {
    const field = document.querySelector(`pm-dialog.cookies [data-id="${fieldId}"]`);
    if (field.type && field.type === "checkbox")
      field.checked = value;
    else
      field.value = value;
    return value;
  }, fieldId, value);
}

async function getCookieDialogField(fieldId, value)
{
  return page.evaluate(async(fieldId, value) =>
  {
    const field = document.querySelector(`pm-dialog.cookies [data-id="${fieldId}"]`);
    if (field.type && field.type === "checkbox")
      return field.checked;
    else
      return field.value;
  }, fieldId, value);
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
    for (let i = 1; i < 5; i++)
    {
      for (let j = 1; j <= i; j++)
      {
        await addCookie(`https://domain${i}.com`, `name${j}`, `value${j}`);
      }
    }

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
    await page.waitFor(10);
    equal(await ensureItem("name1", "domain1.com"), true);

    equal(await ensureItem("name1", "domain2.com"), false);
    equal(await ensureItem("name2", "domain2.com"), false);
    await (await getItemElemHandle("domain2.com")).click();
    await page.waitFor(10);
    equal(await ensureItem("name1", "domain2.com"), true);
    equal(await ensureItem("name2", "domain2.com"), true);

    equal(await ensureItem("name3", "domain3.com"), false);
    await (await getItemElemHandle("domain3.com")).click();
    await page.waitFor(10);
    equal(await ensureItem("name3", "domain3.com"), true);
  });

  it("Clicking whitelist button should whitelist domain and/or cookie accordingly", async() =>
  {
    equal(await isWhitelisted("domain3.com"), "false");
    await (await whitelistButtonHandle("domain3.com")).click();
    await page.waitFor(10);
    equal(await isWhitelisted("domain3.com"), "true");

    equal(await isWhitelisted("name2", "domain3.com"), "false");
    await (await whitelistButtonHandle("name2", "domain3.com")).click();
    await page.waitFor(10);
    equal(await isWhitelisted("name2", "domain3.com"), "true");
  });

  it("Clicking delete button should delete domain and/or cookie accordingly", async() =>
  {
    await (await getItemElemHandle("domain4.com")).click();
    equal(await ensureItem("domain4.com"), true);
    equal(await ensureItem("name2", "domain4.com"), true);
    await (await deleteButtonHandle("name2", "domain4.com")).click();
    await page.waitFor(10);
    equal(await ensureItem("name2", "domain4.com"), false);
    equal(await ensureItem("name3", "domain4.com"), true);
    await (await deleteButtonHandle("domain4.com")).click();
    await page.waitFor(10);
    equal(await ensureItem("name3", "domain4.com"), false);
    equal(await ensureItem("domain4.com"), false);
  });

  it("Deleting cookies should also unset whitelisting", async() =>
  {
    await addCookie("https://domain5.com", "name1", "value1");
    await addCookie("https://domain5.com", "name2", "value2");
    await page.waitFor(10);

    await (await getItemElemHandle("domain5.com")).click();
    equal(await ensureItem("name1", "domain5.com"), true);
    equal(await isWhitelisted("name1", "domain5.com"), "false");

    await (await whitelistButtonHandle("domain5.com")).click();
    await page.waitFor(10);
    await (await whitelistButtonHandle("name2", "domain5.com")).click();
    await page.waitFor(10);
    equal(await isWhitelisted("name2", "domain5.com"), "true");
    equal(await isWhitelisted("domain5.com"), "true");

    await (await deleteButtonHandle("domain5.com")).click();
    await page.waitFor(10);
    await addCookie("https://domain5.com", "name1", "value1");
    await addCookie("https://domain5.com", "name2", "value2");
    await page.waitFor(10);

    await (await getItemElemHandle("domain5.com")).click();
    await page.waitFor(10);
    equal(await isWhitelisted("name2", "domain5.com"), "false");
    equal(await isWhitelisted("domain5.com"), "false");
  });
  it("Cookie is added using 'add cookies' dialog", async() =>
  {
    await (await page.evaluateHandle(() => document.querySelector("#panel-cookies [data-action='add-cookie-comp']"))).click();
    await setCookieDialog("domain", "domain6.com");
    await setCookieDialog("name", "name1");
    await setCookieDialog("value", "value1");
    await setCookieDialog("path", "/about1");
    await setCookieDialog("expirationDate", "2051-01-01");
    await setCookieDialog("expirationTime", "01:01:01");
    await setCookieDialog("hostOnly", true);
    await setCookieDialog("httpOnly", true);
    await setCookieDialog("secure", true);
    await setCookieDialog("storeId", "0");
    const handle = await page.evaluateHandle(() => document.querySelector("pm-dialog.cookies pm-button[data-action='update-cookie-comp']"));
    await page.waitFor(30);
    await handle.click();
    await page.waitFor(10);

    equal(await ensureItem("domain6.com"), true);
    await page.waitFor(30);
    await (await getItemElemHandle("domain6.com")).click();
    await page.waitFor(10);
    equal(await ensureItem("name1", "domain6.com"), true);
  });

  it("Cookie is updated using 'edit cookies' dialog", async() =>
  {
    await (await editButtonHandle("name1", "domain6.com")).click();
    equal(await getCookieDialogField("domain"), "domain6.com");
    equal(await getCookieDialogField("name"), "name1");
    equal(await getCookieDialogField("value"), "value1");
    equal(await getCookieDialogField("path"), "/about1");
    equal(await getCookieDialogField("expirationDate"), "2051-01-01");
    equal(await getCookieDialogField("expirationTime"), "01:01:01");
    equal(await getCookieDialogField("hostOnly"), true);
    equal(await getCookieDialogField("httpOnly"), true);
    equal(await getCookieDialogField("secure"), true);
    equal(await getCookieDialogField("session"), false);
    equal(await getCookieDialogField("storeId"), "0");

    await setCookieDialog("domain", "domain6.com");
    await setCookieDialog("value", "value2");
    await setCookieDialog("path", "/about2");
    await setCookieDialog("expirationDate", "2052-02-02");
    await setCookieDialog("expirationTime", "02:02:02");
    await setCookieDialog("hostOnly", false);
    await setCookieDialog("httpOnly", false);
    await setCookieDialog("secure", false);

    const handle = await page.evaluateHandle(() => document.querySelector("pm-dialog.cookies pm-button[data-action='update-cookie-comp']"));
    await page.waitFor(30);
    await handle.click();
    await page.waitFor(10);
    await (await editButtonHandle("name1", "domain6.com")).click();

    equal(await getCookieDialogField("domain"), "domain6.com");
    equal(await getCookieDialogField("name"), "name1");
    equal(await getCookieDialogField("value"), "value2");
    equal(await getCookieDialogField("path"), "/about2");
    equal(await getCookieDialogField("expirationDate"), "2052-02-02");
    equal(await getCookieDialogField("expirationTime"), "02:02:02");
    equal(await getCookieDialogField("hostOnly"), false);
    equal(await getCookieDialogField("httpOnly"), false);
    equal(await getCookieDialogField("secure"), false);
  });

  after(async() =>
  {
    await restorePermissions();
    await closeBrowser();
  });
});
