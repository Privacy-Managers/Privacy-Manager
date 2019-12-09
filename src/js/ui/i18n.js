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

const {getMessage} = require("./utils");

/*******************************************************************************
 * i18n
 ******************************************************************************/
document.addEventListener("DOMContentLoaded", async function()
{
  document.querySelectorAll("[data-i18n]").forEach(async function(node)
  {
    node.textContent = await getMessage(node.dataset.i18n);
  });

  document.documentElement.lang = await getMessage("@@ui_locale");
}, false);
