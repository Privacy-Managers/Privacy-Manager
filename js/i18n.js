document.addEventListener("DOMContentLoaded", function()
{
  document.querySelectorAll("[data-i18n]").forEach(function(node)
  {
    node.textContent = getMsg(node.dataset.i18n);
  });
}, false);