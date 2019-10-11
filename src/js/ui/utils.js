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

function Elem(selector, parent)
{
  return (parent || document).querySelector(selector);
}

function Elems(selector, parent)
{
  return (parent || document).querySelectorAll(selector);
}

function getMsg(text)
{
  return chrome.i18n.getMessage(text) || text;
}

function getMessages(id)
{
  let messages = [];
  for (let i = 1; true; i++)
  {
    let message = ext.i18n.getMessage(id + "_" + i);
    if (!message)
      break;

    messages.push(message);
  }
  return messages;
}

function getSwitcher(Id)
{
  return Elem("#" + Id + " button");
}

function getSwitches(className)
{
  return document.querySelectorAll("." + className + " button");
}

function cloneObj(obj)
{
  var newObj = {};
  for (var attr in obj)
    newObj[attr] = obj[attr];

  return newObj;
}

function nextSiblingElem(elem)
{
  return elem.nextElementSibling ?
    elem.nextElementSibling : elem.parentElement.firstElementChild;
}

function prevSiblingElem(elem)
{
  return elem.previousElementSibling ?
    elem.previousElementSibling : elem.parentElement.lastElementChild;
}

/**
 * Get parent element using data-* attribute
 * @param {Node} Node Dom node
 * @param {String} date data-* attribute value
 * @return {String} value of data attribute
 */
function getParentData(node, data, getElement)
{
  if (node.hasAttribute(data))
    return getElement ? node : node.getAttribute(data);

  return getParentData(node.parentElement, data, getElement);
}

function createBasicSettingObj(text)
{
  return {
    dataset: {access: text},
    text: getMsg(text)
  };
}

module.exports = {Elem, Elems, getMsg, getMessages, getSwitcher, getSwitches,
                  cloneObj, nextSiblingElem, prevSiblingElem, getParentData, createBasicSettingObj};
