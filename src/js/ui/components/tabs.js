document.addEventListener("DOMContentLoaded", async() =>
{
  const pmTabPanel = document.querySelector("pm-tab-panel");
  const {lastSelectedTab} = await browser.storage.local.get("lastSelectedTab");
  if (!lastSelectedTab)
    pmTabPanel.select("tab-main");
  else
    pmTabPanel.select(lastSelectedTab);
  pmTabPanel.addEventListener("tabChange", ({detail}) =>
  {
    browser.storage.local.set({"lastSelectedTab": detail});
  });
}, false);
