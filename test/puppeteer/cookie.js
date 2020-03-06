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

async function getHandle(access)
{
  return await page.$(`[data-access='${access}']`);
}

function clickToggle(pmToggleHandle)
{
  return page.evaluate((pmToggleHandle) =>
  {
    pmToggleHandle.shadowRoot.querySelector("#toggle").click();
  }, pmToggleHandle);
}

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

function closeEditCookieDialog()
{
  return page.evaluate(async() =>
  {
    const dialog = document.querySelector("pm-dialog.cookies");
    dialog.closeDialog();
    return dialog;
  });
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

async function getCookieDialogField(fieldId)
{
  return page.evaluate(async(fieldId) =>
  {
    const field = document.querySelector(`pm-dialog.cookies [data-id="${fieldId}"]`);
    if (field.type && field.type === "checkbox")
    {
      return field.checked;
    }
    else
    {
      return field.value;
    }
  }, fieldId);
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
    await page.waitFor(30);
    equal(await ensureItem("name1", "domain1.com"), true);

    equal(await ensureItem("name1", "domain2.com"), false);
    equal(await ensureItem("name2", "domain2.com"), false);
    await (await getItemElemHandle("domain2.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("name1", "domain2.com"), true);
    equal(await ensureItem("name2", "domain2.com"), true);

    equal(await ensureItem("name3", "domain3.com"), false);
    await (await getItemElemHandle("domain3.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("name3", "domain3.com"), true);
  });

  it("Clicking whitelist button should whitelist domain and/or cookie accordingly", async() =>
  {
    equal(await isWhitelisted("domain3.com"), "false");
    await (await whitelistButtonHandle("domain3.com")).click();
    await page.waitFor(30);
    equal(await isWhitelisted("domain3.com"), "true");

    equal(await isWhitelisted("name2", "domain3.com"), "false");
    await (await whitelistButtonHandle("name2", "domain3.com")).click();
    await page.waitFor(30);
    equal(await isWhitelisted("name2", "domain3.com"), "true");
  });

  it("Clicking delete button should delete domain and/or cookie accordingly", async() =>
  {
    await (await getItemElemHandle("domain4.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("domain4.com"), true);
    equal(await ensureItem("name2", "domain4.com"), true);
    await (await deleteButtonHandle("name2", "domain4.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("name2", "domain4.com"), false);
    equal(await ensureItem("name3", "domain4.com"), true);
    await (await deleteButtonHandle("domain4.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("name3", "domain4.com"), false);
    equal(await ensureItem("domain4.com"), false);

    // Ensure that non expanded domain item is removed on delete
    // https://github.com/Privacy-Managers/Privacy-Manager/issues/83
    await addCookie("https://domain4.com", "name1", "value1");
    await page.waitFor(30);
    await (await deleteButtonHandle("domain4.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("domain4.com"), false);
  });

  it("Deleting cookies should also unset whitelisting", async() =>
  {
    await addCookie("https://domain5.com", "name1", "value1");
    await addCookie("https://domain5.com", "name2", "value2");
    await page.waitFor(30);

    await (await getItemElemHandle("domain5.com")).click();
    equal(await ensureItem("name1", "domain5.com"), true);
    equal(await isWhitelisted("name1", "domain5.com"), "false");

    await (await whitelistButtonHandle("domain5.com")).click();
    await page.waitFor(30);
    await (await whitelistButtonHandle("name2", "domain5.com")).click();
    await page.waitFor(30);
    equal(await isWhitelisted("name2", "domain5.com"), "true");
    equal(await isWhitelisted("domain5.com"), "true");

    await (await deleteButtonHandle("domain5.com")).click();
    await page.waitFor(30);
    await addCookie("https://domain5.com", "name1", "value1");
    await addCookie("https://domain5.com", "name2", "value2");
    await page.waitFor(30);

    await (await getItemElemHandle("domain5.com")).click();
    await page.waitFor(30);
    equal(await isWhitelisted("name2", "domain5.com"), "false");
    equal(await isWhitelisted("domain5.com"), "false");

    // see https://github.com/Privacy-Managers/Privacy-Manager/issues/85
    equal(await isWhitelisted("name2", "domain5.com"), "false");
    await (await deleteButtonHandle("name1", "domain5.com")).click();
    await addCookie("https://domain5.com", "name1", "value1");
    await page.waitFor(30);
    equal(await isWhitelisted("name1", "domain5.com"), "false");
  });
  it("Cookie is added using 'add cookies' dialog", async() =>
  {
    await (await page.evaluateHandle(() => document.querySelector("#panel-cookies [data-action='add-cookie']"))).click();
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
    const handle = await page.evaluateHandle(() => document.querySelector("pm-dialog.cookies pm-button[data-action='update-cookie']"));
    await page.waitFor(30);
    await handle.click();
    await page.waitFor(30);

    equal(await ensureItem("domain6.com"), true);
    await page.waitFor(30);
    await (await getItemElemHandle("domain6.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("name1", "domain6.com"), true);
  });

  it("Cookie is updated using 'edit cookies' dialog", async() =>
  {
    await (await editButtonHandle("name1", "domain6.com")).click();
    await page.waitFor(100);
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
    await setCookieDialog("path", "/about1");
    await setCookieDialog("expirationDate", "2052-02-02");
    await setCookieDialog("expirationTime", "02:02:02");

    const updateButtonHandle = await page.evaluateHandle(() => document.querySelector("pm-dialog.cookies pm-button[data-action='update-cookie']"));
    await page.waitFor(100);
    await updateButtonHandle.click();
    await page.waitFor(100);
    await (await getItemElemHandle("domain6.com")).click();
    await page.waitFor(100);
    await (await editButtonHandle("name1", "domain6.com")).click();
    await page.waitFor(30);

    equal(await getCookieDialogField("domain"), "domain6.com");
    equal(await getCookieDialogField("name"), "name1");
    equal(await getCookieDialogField("value"), "value2");
    equal(await getCookieDialogField("path"), "/about1");
    equal(await getCookieDialogField("expirationDate"), "2052-02-02");
    equal(await getCookieDialogField("expirationTime"), "02:02:02");
    await setCookieDialog("session", true);
    await updateButtonHandle.click();

    await page.waitFor(30);
    await (await getItemElemHandle("domain6.com")).click();
    await page.waitFor(30);
    await (await editButtonHandle("name1", "domain6.com")).click();
    await page.waitFor(30);
    equal(await getCookieDialogField("session"), true);
    equal(await getCookieDialogField("expirationDate"), "");
    equal(await getCookieDialogField("expirationTime"), "");
    await closeEditCookieDialog();
  });

  it("'Delete all' button in the delete all cookies dialog should remove all cookies instead of those which were whitelisted", async() =>
  {
    await (await whitelistButtonHandle("name1", "domain5.com")).click();
    await page.waitFor(30);
    equal(await ensureItem("domain1.com"), true);
    equal(await ensureItem("domain2.com"), true);

    const dialogOpener = await page.evaluateHandle(() => document.querySelector("pm-button[data-action='open-cookie-removal-dialog']"));
    await dialogOpener.click();
    await page.waitFor(30);
    const deleteAllCookieButton = await page.evaluateHandle(() => document.querySelector("pm-button[data-action='delete-all-cookies']"));
    await deleteAllCookieButton.click();

    equal(await ensureItem("domain3.com"), true);
    equal(await isWhitelisted("domain3.com"), "true");

    equal(await isWhitelisted("name1", "domain3.com"), "false");
    equal(await isWhitelisted("name2", "domain3.com"), "true");

    equal(await isWhitelisted("domain5.com"), "false");
    equal(await isWhitelisted("name1", "domain5.com"), "true");

    equal(await ensureItem("domain1.com"), false);
    equal(await ensureItem("domain2.com"), false);
  });

  it("Updating Search domain field should filter domains", async() =>
  {
    equal(await ensureItem("domain3.com"), true);
    equal(await ensureItem("domain5.com"), true);
    await page.focus("#search-domain");
    await page.keyboard.type("3");
    await page.waitFor(50);
    equal(await ensureItem("domain5.com"), false);
    equal(await ensureItem("domain3.com"), true);
  });

  it("Switching 'Active tab cookies' on should set Search field to the current page domain", async() =>
  {
    equal(await ensureItem("domain3.com"), true);
    await clickToggle(await getHandle("activeTabCookies"));
    await page.waitFor(30);
    const searchDomainValue = await page.evaluate(element => element.value, await page.$("#search-domain"));
    equal(searchDomainValue, page.url().split('/')[2].split(':')[0]);
    equal(await ensureItem("domain3.com"), false);
  });

  after(async() =>
  {
    await restorePermissions();
    await closeBrowser();
  });
});
