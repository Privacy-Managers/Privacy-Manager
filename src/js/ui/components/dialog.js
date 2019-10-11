const {Elem} = require("./utils");
const {registerActionListener} = require("./actionListener");

var dialog = null;
document.addEventListener("DOMContentLoaded", function()
{
  dialog = Elem("#dialog");
  registerActionListener(document.body, onAction);
  document.body.addEventListener("keyup", function(ev)
  {
    if (ev.key == "Escape" && dialog.getAttribute("aria-hidden") == "false" )
      onAction("close-dialog", dialog);
  }, false);
}, false);

function onAction(action, element)
{
  switch (action)
  {
    case "open-dialog":
      dialog.setAttribute("aria-hidden", false);
      dialog.dataset.dialog = element.dataset.dialog;
      break;
    case "close-dialog":
      closeDialog();
      break;
  }
}

const closeDialog = function()
{
  dialog.setAttribute("aria-hidden", true);
};

module.exports = {closeDialog};
