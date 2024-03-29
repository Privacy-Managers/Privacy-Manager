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
  // The extension target is not ready at this point, so we wait a bit.
  await sleep(1000);

  const targets = await browser.targets();
  const extensionTarget = targets.find((target) =>
    target.url().startsWith("chrome-extension://") && target.type() === "service_worker"
  );
  const extensionUrl = extensionTarget.url() || '';
  const [,, extensionID] = extensionUrl.split('/');
  const extensionPopupHtml = "popup.html";

  const page = await browser.newPage();
  await page.goto(`chrome-extension://${extensionID}/${extensionPopupHtml}`, {
    waitUntil: "networkidle0"
  });
  return page;
}

function sleep(ms)
{
  return new Promise(resolve => setTimeout(resolve, ms));
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