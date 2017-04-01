"use strict";

function Elem(selector, parent)
{
  return (parent || document).querySelector(selector);
}

function Elems(selector, parent)
{
  return (parent || document).querySelectorAll(selector);
}

// TODO: this can be constant
function getMsg(text)
{
  return chrome.i18n.getMessage(text);
}

function getSwitcher(Id)
{
  return Elem("#" + Id + " button");
}

function getSwitches(className)
{
  return document.querySelectorAll("." + className + " button");
}
