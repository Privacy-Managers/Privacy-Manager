const assert = require("assert");
const {allUrlsToPermissions, restorePermissions} = require("../manifest");
const {openPopupPage, closeBrowser} = require("../common");

let browser;
let page;

async function getHandle(access)
{
  return await page.$(`[data-access='${access}']`);
}

function getLabel(pmToggleHandle)
{
  return page.evaluate((pmToggleHandle) =>
  {
    return pmToggleHandle.shadowRoot.querySelector("#label").textContent;
  }, pmToggleHandle);
}

function isEnabled(pmToggleHandle)
{
  return page.evaluate((pmToggleHandle) =>
  {
    return pmToggleHandle.isEnabled();
  }, pmToggleHandle);
}

function clickToggle(pmToggleHandle)
{
  return page.evaluate((pmToggleHandle) =>
  {
    pmToggleHandle.shadowRoot.querySelector("#toggle").click();
  }, pmToggleHandle);
}

function setWebsitePrivacy(settingName, value)
{
  return page.evaluate((settingName, value) =>
  {
    browser.privacy.websites[settingName].set({ value });
  }, settingName, value);
}

function getWebsitePrivacy(settingName)
{
  return page.evaluate(async(settingName) =>
  {
    return (await browser.privacy.websites[settingName].get({})).value;
  }, settingName);
}

function getSettingListData(name)
{
  return page.evaluate(async(name) =>
  {
    return (await browser.storage.local.get("settingList")).settingList[name];
  }, name);
}

function setSettingListData(name, value)
{
  return page.evaluate(async(name, value) =>
  {
    const data = await browser.storage.local.get("settingList");
    if (!data.settingList)
      data.settingList = {};
    data.settingList[name] = value;
    await browser.storage.local.set(data);
  }, name, value);
}

function getLastSelectedTab()
{
  return page.evaluate(async() =>
  {
    return (await browser.storage.local.get("lastSelectedTab")).lastSelectedTab;
  });
}

function isPanelHidden(tabId)
{
  return page.evaluate(async(tabId) =>
  {
    return document.querySelector(`[aria-labelledby="${tabId}"]`).getAttribute("hidden") == "true";
  }, tabId);
}

function getSearchDomainValue()
{
  return page.evaluate(() =>
  {
    return document.querySelector("#search-domain").value;
  });
}

describe("Testing main tab and tabs component", () =>
{
  before(async() =>
  {
    await allUrlsToPermissions();
    page = await openPopupPage();
  });

  it("The first PM item is '3-rd party cookies' and is enabled", async() =>
  {
    const handle = await getHandle("thirdPartyCookiesAllowed");
    assert.equal(await getLabel(handle), "3-rd party cookies");
    assert.equal(await isEnabled(handle), true);
  });
  it("Setting chrome.privacy.websites.thirdPartyCookiesAllowed should switch the toggle", async() =>
  {
    const handle = await getHandle("thirdPartyCookiesAllowed");
    await setWebsitePrivacy("thirdPartyCookiesAllowed", false);
    assert.equal(await isEnabled(handle), false);
    await setWebsitePrivacy("thirdPartyCookiesAllowed", true);
    assert.equal(await isEnabled(handle), true);
  });
  it("Clicking the '3-rd party cookies' toggle should change the chrome.privacy.websites.thirdPartyCookiesAllowed", async() =>
  {
    const handle =  await getHandle("thirdPartyCookiesAllowed");
    await clickToggle(handle);
    assert.equal(await getWebsitePrivacy("thirdPartyCookiesAllowed"), false);
    await clickToggle(handle);
    assert.equal(await getWebsitePrivacy("thirdPartyCookiesAllowed"), true);
  });
  it("Setting settingList.cookies in local storage should switch 'Cookies' toggle", async() =>
  {
    const handle = await getHandle("cookies");
    await setSettingListData("cookies", true);
    assert.equal(await isEnabled(handle), true);
    await setSettingListData("cookies", false);
    assert.equal(await isEnabled(handle), false);
  });
  it("Clicking the 'Cookies' toggle should set settingList.cookies in local storage", async() =>
  {
    const handle = await getHandle("cookies");
    await clickToggle(handle);
    await page.waitFor(10);
    assert.equal(await getSettingListData("cookies"), true);
    await clickToggle(handle);
    await page.waitFor(10);
    assert.equal(await getSettingListData("cookies"), false);
  });
  it("Setting settingList.cookies in local storage should switch 'Cookies' toggle", async() =>
  {
    const handle = await getHandle("cookies");
    await setSettingListData("cookies", true);
    assert.equal(await isEnabled(handle), true);
    await setSettingListData("cookies", false);
    assert.equal(await isEnabled(handle), false);
  });
  it("Clicking activeTabCookies should set activeTabCookies settingList and set current URL as search domain", async() =>
  {
    const handle = await getHandle("activeTabCookies");
    assert.equal(await getSearchDomainValue(), "");
    await clickToggle(handle);
    await page.waitFor(10);
    assert.equal(await getSettingListData("activeTabCookies"), true);
    const url = await page.url();
    const domain = url.split('/')[2].split(':')[0].replace("www.", "");
    assert.equal(await getSearchDomainValue(), domain);
  });
  it("Clicking tabs should set lastSelectedTab", async() =>
  {
    assert.equal(await getLastSelectedTab(), undefined);
    assert.equal(await isPanelHidden("tab-main"), false);
    assert.equal(await isPanelHidden("tab-cookies"), true);
    await page.click("#tab-cookies");
    assert.equal(await isPanelHidden("tab-cookies"), false);
    assert.equal(await getLastSelectedTab(), "tab-cookies");
  });
  it("Reloading the page should set switch to lastSelectedTab", async() =>
  {
    await page.reload({waitUntil: "domcontentloaded"});
    assert.equal(await isPanelHidden("tab-main"), true);
    assert.equal(await isPanelHidden("tab-cookies"), false);
  });
  it("When additional permissions are changed, 'Additional Permissions' toggle is updated accordingly");

  after(async() =>
  {
    await restorePermissions();
    await closeBrowser();
  });
});

