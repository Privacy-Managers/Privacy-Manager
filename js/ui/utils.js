"use strict";

function Elem(selector, parent)
{
  return (parent || document).querySelector(selector);
}

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
