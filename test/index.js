const puppeteer = require("puppeteer");
const assert = require("assert");
const additionalPermission = {"origins": ["<all_urls>"]};

const extensionPath = "dist";
let browser;
let page;
let thirdPartyToggleHandle;
let clearCookiesHandle;
let additionalPermissionHandles;

before(async() =>
{
  // https://gokatz.me/blog/automate-chrome-extension-testing/
  browser = await puppeteer.launch({
    headless: false, // extension are allowed only in the head-full mode
    args: [
      `--disable-extensions-except=${extensionPath}`,
      `--load-extension=${extensionPath}`
    ]
  });
  const targets = await browser.targets();
  const extensionTarget = targets.find(({ _targetInfo }) =>
  {
    return _targetInfo.title === "Privacy Manager";
  });
  const extensionUrl = extensionTarget._targetInfo.url || '';
  const [,, extensionID] = extensionUrl.split('/');
  const extensionPopupHtml = "popup.html";

  page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionID}/${extensionPopupHtml}`);

  thirdPartyToggleHandle = await page.$("[data-access='thirdPartyCookiesAllowed']");
  clearCookiesHandle = await page.$("[data-access='cookies']");
  additionalPermissionHandles = await page.$$("[data-access='additionalPermissions']");
});

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

function setPermission(state)
{
  return page.evaluate(async(state, additionalPermission) =>
  {
    if (state)
      return await browser.permissions.request(additionalPermission);
    else
      return await browser.permissions.remove(additionalPermission);
  }, state, additionalPermission);
}

describe("Testing Privacy Manager extension", () =>
{
  it("The first PM item is '3-rd party cookies' and is enabled", async() =>
  {
    assert.equal(await getLabel(thirdPartyToggleHandle), "3-rd party cookies");
    assert.equal(await isEnabled(thirdPartyToggleHandle), true);
  });
  it("Setting chrome.privacy.websites.thirdPartyCookiesAllowed should switch the toggle", async() =>
  {
    await setWebsitePrivacy("thirdPartyCookiesAllowed", false);
    assert.equal(await isEnabled(thirdPartyToggleHandle), false);
    await setWebsitePrivacy("thirdPartyCookiesAllowed", true);
    assert.equal(await isEnabled(thirdPartyToggleHandle), true);
  });
  it("Clicking the '3-rd party cookies' toggle should change the chrome.privacy.websites.thirdPartyCookiesAllowed", async() =>
  {
    await clickToggle(thirdPartyToggleHandle);
    assert.equal(await getWebsitePrivacy("thirdPartyCookiesAllowed"), false);
    await clickToggle(thirdPartyToggleHandle);
    assert.equal(await getWebsitePrivacy("thirdPartyCookiesAllowed"), true);
  });
  it("Setting settingList.cookies in local storage should switch 'Cookies' toggle", async() =>
  {
    await setSettingListData("cookies", true);
    assert.equal(await isEnabled(clearCookiesHandle), true);
    await setSettingListData("cookies", false);
    assert.equal(await isEnabled(clearCookiesHandle), false);
  });
  it("Clicking the 'Cookies' toggle should set settingList.cookies in local storage", async() =>
  {
    await clickToggle(clearCookiesHandle);
    assert.equal(await getSettingListData("cookies"), true);
    await clickToggle(clearCookiesHandle);
    assert.equal(await getSettingListData("cookies"), false);
  });
  it("When additional permissions are changed, 'Additional Permissions' toggle is updated accordingly");
});

after(async() =>
{
  await browser.close();
});
