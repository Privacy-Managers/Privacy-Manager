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

function registerActionListener(target, callback)
{
  target.addEventListener("keyup", function(ev)
  {
    onKeyUp(ev, callback);
  }, false);

  target.addEventListener("click", function(ev)
  {
    onClick(ev, callback);
  }, false);
}

function onKeyUp(ev, callback)
{
  var key = ev.key;
  var activeElem = document.activeElement;
  var actions = null;

  switch (key)
  {
    case " ":
    case "Enter":
      actions = activeElem.dataset.keyAction;
      break;
    case "Delete":
    case "Backspace":
      actions = activeElem.dataset.keyDelete;
      break;
    case "ArrowUp":
      actions = activeElem.dataset.keyUp;
      break;
    case "ArrowDown":
      actions = activeElem.dataset.keyDown;
      break;
    case "ArrowRight":
      actions = activeElem.dataset.keyRight;
      break;
    case "ArrowLeft":
      actions = activeElem.dataset.keyLeft;
      break;
    case "Escape":
      actions = activeElem.dataset.keyQuite;
      break;
  }

  if (!actions)
    return;

  // TODO: Fix duplication
  ev.preventDefault;
  actions.split(",").forEach(function(action)
  {
    callback(action, activeElem);
  });
}

function onClick(ev, callback)
{
  var element = ev.target;
  var actions = null;

  while (true)
  {
    if (element == this)
      break;

    if (element.hasAttribute("data-action"))
    {
      actions = element.getAttribute("data-action");
      break;
    }

    element = element.parentElement;
  }

  if (!actions)
    return;

  ev.preventDefault;
  actions.split(",").forEach(function(action)
  {
    callback(action, element);
  });
}

module.exports = {registerActionListener};
