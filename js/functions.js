function Elem(selector)
{
  return document.querySelector(selector);
}

function getMsg(text)
{
  return chrome.i18n.getMessage(text);
}

var switcher = 
{
  toggleState: function(ev)
  {
    if (this.classList.contains("disabled"))
      return false;

    if (ev.target.parentNode.classList.contains("off") && this.classList.contains("turn-on"))
    {
      this.classList.remove("turn-on");
      return false;
    }
    else if (ev.target.parentNode.classList.contains("on") && !this.classList.contains("turn-on") && !this.classList.contains("disabled"))
    {
      this.classList.add("turn-on");
      return true;
    }
  },

  disable: function(elem)
  {
    elem.classList.add("disabled");
    this.turnOff(elem);
  },
  
  enable: function(elem)
  {
    elem.classList.remove("disabled");
  },
  
  changeState: function(elem, value)
  {
    if(value)
      this.turnOn(elem);
    else
      this.turnOff(elem);
  },
  
  turnOn: function(elem)
  {
    elem.classList.add("turn-on");
  },
  
  turnOff: function(elem)
  {
    elem.classList.remove("turn-on");
  }
};
