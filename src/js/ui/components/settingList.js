const {Elem, getMsg, Elems} = require("../utils");
const {additionalPermission, getStorage, setStorage} = require("../../common");

/**
 * Add setting list item
 * @param {Node} parent <ul> element
 * @param {JSON} dataObj data describing the structure ex.:
 * {
 *   dataset:  { access: "access", info: "access_desc" },
 *   text: "",
 *   privacyObj: [Chrome privacy object]
 * }
 * @param {String} type "privacy", "storage" or "permission"
 * @param {Function} callback triggered after creation and on change.
 * The callback parameter should be a function that looks like this:
 * function(state) {...}; where "state" is boolean
 */ 
async function addSettingItem(parent, dataObj, type, callback)
{
  const content = Elem("#settings-list").content;
  const listElem = document.importNode(content, true);
  const accessor = dataObj.dataset.access;
  const pmToggle = listElem.querySelector("pm-toggle");
  pmToggle.setAttribute("text", dataObj.text);
  pmToggle.setAttribute("description", getMsg(dataObj.dataset.access + "_desc"));

  const datasetObj = dataObj.dataset;

  for (const name in datasetObj)
    pmToggle.dataset[name] = datasetObj[name];

  parent.appendChild(listElem);

  switch (type)
  {
    case "privacy":
    {
      const privacyObject = dataObj.privacyObj;
      _updateSettingButton(pmToggle, (await privacyObject.get({})).value);
      pmToggle.addEventListener("change", async() =>
      {
        const details = await privacyObject.get({});
        if (details.levelOfControl == "controllable_by_this_extension" ||
        details.levelOfControl == "controlled_by_this_extension")
        {
          await privacyObject.set({ value: !details.value });
          // TODO: test
          if (browser.runtime.lastError != undefined)
          {
            const message = browser.runtime.lastError.message;
            if (message ==
              "Can't modify regular settings from an incognito context.")
            {
              alert(getMsg("regularSettingChangeIncognito_error"));
            }
            else
            {
              alert(message);
            }
          }
        }
        else
        {
          //TODO: Inform user if control level is not controlable by
          //extension details.levelOfControl
        }
      }, false);

      privacyObject.onChange.addListener((detail) =>
      {
        _updateSettingButton(accessor, detail.value);
      });
      break;

    }
    case "storage":
    {
      const state = await _getStorage(accessor);
      _updateSettingButton(pmToggle, state === true);
      if (callback)
        callback(state);
      pmToggle.addEventListener("change", async() =>
      {
        const currentState = await _getStorage(accessor);
        const data = await _setStorage(accessor, !currentState);
        if (callback)
          callback(data);
      }, false);
      break;
    }
    case "permission":
    {
      chrome.permissions.contains(additionalPermission, (result) =>
      {
        if (callback)
          callback(result);
        _updateSettingButton(accessor, result);
      });

      pmToggle.addEventListener("click", () =>
      {
        chrome.permissions.contains(additionalPermission, (result) =>
        {
          if (result)
            chrome.permissions.remove(additionalPermission);
          else
            chrome.permissions.request(additionalPermission);
        });
      }, false);

      chrome.permissions.onAdded.addListener((result) =>
      {
        _updateSettingButton(accessor, true); // Currently called multiple times
        if (callback)
          callback(true);
      });
      chrome.permissions.onRemoved.addListener((result) =>
      {
        _updateSettingButton(accessor, false);
        if (callback)
          callback(false);
      });
      break;
    }
  }
}

async function _setStorage(name, value)
{
  const data = await browser.storage.local.get("settingList");
  if (!data.settingList)
    data.settingList = {};
  data.settingList[name] = value;
  return (await browser.storage.local.set(data)).settingList[name];
}

async function _getStorage(name)
{
  const data = await browser.storage.local.get("settingList");
  const settingList = data["settingList"];
  if (!settingList)
    return;
  return settingList[name];
}

function checkSettingState(accessor, callback)
{
  getStorage("settingList", (data) =>
  {
    if (data.settingList)
      callback(data.settingList[accessor]);
    else
      callback(false);
  });
}

function turnSwitchesOff(accessors, callback)
{
  getStorage("settingList", (data) =>
  {
    accessors.forEach((accessor) =>
    {
      if (data.settingList[accessor])
        data.settingList[accessor] = false;
    });
    setStorage(data, callback);
  });
}

function _updateSettingButton(setting, state)
{
  if (typeof setting == "string")
  {
    Elems("[data-access='" + setting + "']").forEach((settingItem) =>
    {
      _updateSettingButton(settingItem, state);
    });
  }
  else
  {
    setting.setEnabled(state);
  }
}

chrome.storage.onChanged.addListener((change) =>
{
  if ("settingList" in change)
  {
    var newValue = change.settingList.newValue;
    for (var accessor in newValue)
      _updateSettingButton(accessor, newValue[accessor]);
  }
});

module.exports = {addSettingItem, checkSettingState, turnSwitchesOff};
