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

const {$, getMessage, $$} = require("./utils");
const {additionalPermission} = require("../../common");
const browser = require("webextension-polyfill");

async function _createPmToggle(accessor)
{
  const content = $("#settings-list").content;
  const listElem = document.importNode(content, true);
  const dialog = document.querySelector("pm-dialog.info");
  const pmToggle = listElem.querySelector("pm-toggle");
  pmToggle.setAttribute("text", await getMessage(accessor));
  pmToggle.setAttribute("description", await getMessage(accessor + "_desc"));
  pmToggle.addEventListener("info", (e) =>
  {
    const {text, description} = e.target;
    dialog.showDialog(text, {description});
  });

  pmToggle.dataset.access = accessor;
  return [pmToggle, listElem];
}

async function addPrivacyToggle(accessor, privacyObject, parentItem)
{
  const [pmToggle, listElem] = await _createPmToggle(accessor);
  parentItem.appendChild(listElem);

  _updateSettingButton(pmToggle, (await privacyObject.get({})).value);
  pmToggle.addEventListener("change", async() =>
  {
    const details = await privacyObject.get({});
    if (details.levelOfControl == "controllable_by_this_extension" ||
    details.levelOfControl == "controlled_by_this_extension")
    {
      try
      {
        await privacyObject.set({ value: !details.value });
      }
      catch ({message})
      {
        if (message ==
          "Can't modify regular settings from an incognito context.")
        {
          alert(await getMessage("regularSettingChangeIncognito_error"));
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

  return listElem;
}

async function addStorageToggle(accessor, parentItem, callback)
{
  const [pmToggle, listElem] = await _createPmToggle(accessor);
  parentItem.appendChild(listElem);

  const state = await getSettingListData(accessor);
  _updateSettingButton(pmToggle, state === true);
  pmToggle.addEventListener("change", async() =>
  {
    const currentState = await getSettingListData(accessor);
    await setSettingListData(accessor, !currentState);
  }, false);

  if (callback)
  {
    new Listener().on(accessor, (active)=>
    {
      callback(active);
    });
  }
}

async function addPermissionToggle(accessor, parentItem)
{
  const [pmToggle, listElem] = await _createPmToggle(accessor);
  parentItem.appendChild(listElem);

  const isGranted = await browser.permissions.contains(additionalPermission);
  _updateSettingButton(accessor, isGranted);

  pmToggle.addEventListener("click", async() =>
  {
    if (await browser.permissions.contains(additionalPermission))
      browser.permissions.remove(additionalPermission);
    else
      browser.permissions.request(additionalPermission);
  }, false);

  browser.permissions.onAdded.addListener(() =>
  {
    _updateSettingButton(accessor, true); // Currently called multiple times
  });
  browser.permissions.onRemoved.addListener(() =>
  {
    _updateSettingButton(accessor, false);
  });
}

async function setSettingListData(name, value)
{
  const data = await browser.storage.local.get("settingList");
  if (!data.settingList)
    data.settingList = {};
  data.settingList[name] = value;
  await browser.storage.local.set(data);
}

async function getSettingListData(name)
{
  const data = await browser.storage.local.get("settingList");
  const settingList = data["settingList"];
  if (!settingList)
    return;
  return settingList[name];
}

async function resetSettingListData(settingNames)
{
  if (!Array.isArray(settingNames))
  {
    await setSettingListData(settingNames, false);
    return;
  }
  settingNames.forEach(async(settingName) =>
  {
    await setSettingListData(settingName, false);
  });
}

function _updateSettingButton(setting, state)
{
  if (typeof setting == "string")
  {
    $$("[data-access='" + setting + "']").forEach((settingItem) =>
    {
      _updateSettingButton(settingItem, state);
    });
  }
  else
  {
    setting.setEnabled(state);
  }
}

browser.storage.onChanged.addListener((data) =>
{
  if ("settingList" in data)
  {
    const {newValue} = data.settingList;
    for (const accessor in newValue)
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
    this.settingList[settingName].value = await getSettingListData(settingName);
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

module.exports = {addPrivacyToggle, addStorageToggle,
  addPermissionToggle, getSettingListData, resetSettingListData,
  Listener};
