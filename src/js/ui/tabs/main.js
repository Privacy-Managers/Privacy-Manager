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

"use strict";

const {Elem} = require("../utils");
const {addStorageToggle, addPrivacyToggle} = require("../components/settingList");
const {privacyData} = require("../data");
const {browsingData} = require("../../common");
const {registerActionListener} = require("../actionListener");

async function generateMainContent()
{
  for (const category in privacyData)
  {
    privacyData[category].forEach(async function(settingName)
    {
      if (!browser.privacy[category][settingName])
        return;

      addPrivacyToggle(settingName, browser.privacy[category][settingName],
                       Elem("#privacyManagement ul"));
    });
  }

  for (var i = 0; i < browsingData.length; i++)
    addStorageToggle(browsingData[i], Elem("#startupClear ul"));
}

function onAction(action)
{
  switch (action)
  {
    case "open-in-incognito":
      chrome.tabs.query({active:true}, function(tab)
      {
        if (tab[0].url.toString().indexOf("chrome://") == -1)
          chrome.windows.create({url: tab[0].url, incognito: true});
        else
          alert("Sorry you can't run current active page in incognito mode.");
      });
      break;
  }
}

document.addEventListener("DOMContentLoaded" , function()
{
  registerActionListener(Elem("#panel-main"), onAction);
  generateMainContent();
}, false);
