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

const {getParentData, Elem, getMsg} = require("./utils");
const {registerActionListener} = require("./actionListener");

/*******************************************************************************
 * General
 ******************************************************************************/
(function()
{
  document.addEventListener("DOMContentLoaded", function()
  {
    registerActionListener(document.body, function(action, element)
    {
      switch (action)
      {
        case "open-dialog":
          var infoMsgId = element.dataset.info;
          if (infoMsgId)
          {
            var msgId = getParentData(element, "data-access");
            var dialogHeader = Elem("#dialog-header-setting-info");
            dialogHeader.textContent = getMsg(msgId);
            var infoTextElem = Elem("#dialog-content-setting-info-text");
            var msgInfoId = msgId + "_desc";
            infoTextElem.textContent = getMsg(msgInfoId);
          }
          break;
      }
    });

    // Settings list localization
    var content = Elem("#settings-list").content;
    content.querySelector("#btn-on-label").textContent = getMsg("on");
    content.querySelector("#btn-off-label").textContent = getMsg("off");
  }, false);
})();

/*******************************************************************************
 * i18n
 ******************************************************************************/
(function()
{
  document.addEventListener("DOMContentLoaded", function()
  {
    document.querySelectorAll("[data-i18n]").forEach(function(node)
    {
      node.textContent = getMsg(node.dataset.i18n);
    });

    document.documentElement.lang = getMsg("@@ui_locale");
  }, false);
})();
