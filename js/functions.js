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

document.addEventListener("DOMContentLoaded" , function()
{
  document.body.addEventListener("click", onClick, false);
}, false);

function onClick(e)
{
  var element = e.target;
  while (true)
  {
    if (!element)
      return;

    if (element.hasAttribute("data-action"))
      break;

    element = element.parentElement;
  }
  
}
