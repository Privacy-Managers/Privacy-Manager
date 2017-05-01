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
        var settingObj = createBasicSettingObj(settingName);
        settingObj.privacyObj = chrome.privacy[category][settingName];
        addSettingItem(Elem("#privacyManagement ul"), settingObj, "privacy");
      });
    }

    for (var i = 0; i < browsingData.length; i++)
    {
      var settingObj = createBasicSettingObj(browsingData[i]);
      addSettingItem(Elem("#startupClear ul"), settingObj, "storage");
    }
  }

  function onAction(action, element)
  {
    switch (action)
    {
      case "open-in-incognito":
        chrome.tabs.query({active:true}, function(tab)
        {
          if (tab[0].url.toString().indexOf("chrome://") == -1)
            chrome.windows.create({url: tab[0].url, incognito: true});
          else 
            alert("Sorry you can't run current active page in incognito mode.");
        });
        break;
    }
  }

  document.addEventListener("DOMContentLoaded" , function()
  {
    generateMainContent();
    registerActionListener(Elem("#main_tab"), onAction);
    Elem("#navigation_tab").addEventListener("switch", function(ev)
    {
      
    }, false);
  }, false);
})();
