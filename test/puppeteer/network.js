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

describe("Testing Network tab", () =>
{
  before(async() =>
  {
    await allUrlsToPermissions();
    page = await openPopupPage();
    await page.click("#tab-network");
    // tableListHandle = await page.$('pm-table');
  });

  it("TBA", async() =>
  {
  });

  after(async() =>
  {
    await restorePermissions();
    await closeBrowser();
  });
});
