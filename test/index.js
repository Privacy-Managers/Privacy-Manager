const puppeteer = require("puppeteer");
const assert = require("assert");
const {privacyData} = require("../src/js/ui/data");

const extensionPath = "dist";
let browser;
let page;
let thirdPartyToggleHandle;

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
    chrome.privacy.websites[settingName].set({ value });
  }, settingName, value);
}

function getWebsitePrivacy(settingName)
{
  return page.evaluate((settingName) =>
  {
    return new Promise((resolve) =>
    {
      chrome.privacy.websites[settingName].get({}, ({value}) =>
      {
        resolve(value);
      });
    });
  }, settingName);
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
});

after(async() =>
{
  await browser.close();
});
