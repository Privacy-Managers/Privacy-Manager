"use strict";

(function()
{
  function generateMainContent()
  {
    for (var category in privacyData)
    {
      privacyData[category].forEach(function(settingName)
      {
        if (!chrome.privacy[category][settingName])
          return;
        var accessor = category + "-" + settingName;
        addSettingItem(Elem("#privacyManagement ul"), accessor, "privacy");
      });
    }
    
    for (var i = 0; i < browsingData.length; i++)
      addSettingItem(Elem("#startupClear ul"), browsingData[i], "storage");
  }

  function addIncognitoListener()
  {
    var listener = function()
    {
      chrome.tabs.query({active:true},function(tab){
        var currentUrl = tab[0].url.toString();
        if(currentUrl.indexOf("chrome://") ==-1) {
          chrome.windows.create({url: tab[0].url, incognito: true});
        }
        else 
        {
          alert("Sorry you can't run current active page in incognito mode.");
        }
      });
    };
    
    Elem("#incognito").addEventListener("click", listener, false);
  }

  document.addEventListener("DOMContentLoaded" , function()
  {
    generateMainContent();
    Elem("#navigation_tab").addEventListener("switch", function(ev)
    {
      
    }, false);
  }, false);
})();
