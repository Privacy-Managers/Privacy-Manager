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
 */ 
async function addSettingItem(parent, dataObj, type)
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
      pmToggle.addEventListener("change", async() =>
      {
        const currentState = await _getStorage(accessor);
        await _setStorage(accessor, !currentState);
      }, false);
      break;
    }
    case "permission":
    {
      const isGranted = await browser.permissions.contains(additionalPermission);
      _updateSettingButton(accessor, isGranted);

      pmToggle.addEventListener("click", async() =>
      {
        if (await browser.permissions.contains(additionalPermission))
          chrome.permissions.remove(additionalPermission);
        else
          chrome.permissions.request(additionalPermission);
      }, false);

      browser.permissions.onAdded.addListener(() =>
      {
        _updateSettingButton(accessor, true); // Currently called multiple times
      });
      browser.permissions.onRemoved.addListener(() =>
      {
        _updateSettingButton(accessor, false);
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
  await browser.storage.local.set(data);
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

/**
 * Change listener for settingList in the local storage
 */
class Listener
{
  constructor()
  {
    this.settingList = {};
    browser.storage.onChanged.addListener(this._onChage.bind(this));
  }

  /**
   * Set a listener
   * @param {String} settingName setting name (ex.: cookies)
   * @param {Function} callback function to call on a setting value change
   */
  async on(settingName, callback)
  {
    if (!this.settingList[settingName])
      this.settingList[settingName] = {};
    this.settingList[settingName].value = await _getStorage(settingName);
    this.settingList[settingName].callback = callback;
  }

  _onChage({settingList})
  {
    if (!settingList)
      return;

    const {newValue} = settingList;
    for (const settingName in this.settingList)
    {
      if (newValue[settingName] !== this.settingList[settingName].value)
      {
        this.settingList[settingName].value = newValue[settingName];
        this.settingList[settingName].callback(newValue[settingName]);
      }
    }
  }
}

module.exports = {addSettingItem, checkSettingState, turnSwitchesOff, Listener};
