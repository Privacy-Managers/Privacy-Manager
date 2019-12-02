const puppeteer = require("puppeteer");
const extensionPath = "dist";
let browser;

async function openPopupPage()
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

  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionID}/${extensionPopupHtml}`);
  return page;
}

async function closeBrowser()
{
  await browser.close();
}

function getBrowser()
{
  return browser;
}

module.exports = {openPopupPage, closeBrowser, getBrowser};