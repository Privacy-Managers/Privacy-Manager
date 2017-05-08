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
