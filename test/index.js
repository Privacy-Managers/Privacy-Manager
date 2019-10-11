const puppeteer = require("puppeteer");
const assert = require("assert");

const extensionPath = "dist";
let browser;
let page;

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
});

function getTextContent(query)
{
  return page.evaluate((query) =>
  {
    return document.querySelector(query).textContent;
  }, query);
}

describe("Testing Privacy Manager extension", () =>
{
  it("First toggle element is loaded", async() =>
  {
    const query = "[data-access='thirdPartyCookiesAllowed'] label";
    assert.equal(await getTextContent(query), "3-rd party cookies");
  });
});

after(async() =>
{
  await browser.close();
});
