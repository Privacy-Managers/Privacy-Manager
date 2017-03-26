"use strict";

(function()
{
  function generateMainContent()
  {
    var template = Elem("#privacyManagement template");
    for (var category in chrome.privacy)
    {
      // We don't need IPHandlingPolicy type property
      if (category != "network" && 
          category != "services" &&
          category != "websites")
        continue;

      for (var settingName in chrome.privacy[category])
      {
        var listItem = createListItem(template, settingName);
        Elem("#privacyManagement ul").appendChild(listItem);
        var setting = chrome.privacy[category][settingName];
        privacyManagement(setting, settingName);
      }
    }

    var template = Elem("#startupClear template");
    for (var i = 0; i < browsingData.length; i++) 
    {
      var dataType = browsingData[i];
      var listItem = createListItem(template, dataType);
      Elem("#startupClear ul").appendChild(listItem);

      (function(dataType)
      {
        getSwitcher(dataType).addEventListener("click", function()
        {
          getStorage("browsingData", function(data)
          {
            if (data.browsingData)
              data.browsingData[dataType] = !data.browsingData[dataType];
            else
            {
              data.browsingData = {};
              data.browsingData[dataType] = true;
            }
            setStorage(data);
          });
        }, false);
      })(dataType);
    }
    getStorage("browsingData", function(data)
    {
      updateBrowsingDataSwitches(data.browsingData);
    });
  }

  chrome.storage.onChanged.addListener(function(change)
  {
    if ("browsingData" in change)
    {
      updateBrowsingDataSwitches(change.browsingData.newValue);
    }
  });

  function updateBrowsingDataSwitches(dataObj)
  {
    for (var id in dataObj)
    {
      var switcher = getSwitcher(id);
      if (switcher)
        switcher.setAttribute("aria-checked", dataObj[id]);
    }
  }

  /*
   * Creates a list item using template 
   * @param {Element} template HTML element
   * @param {itemID} itemID UniqueID associated with the element
   */
  function createListItem(template, itemID)
  {
    var content = template.content;
    content.querySelector("label").textContent = getMsg(itemID) || itemID;
    content.querySelector("li").id = itemID;

    return document.importNode(content, true);
  }

  /*
   * Get state for each Privacy setting and manage it 
   * @param {Object} setting a chrome.privacy[settingName] API object
   * @param {Strings} settingName privacy settingName
   */
  function privacyManagement(setting, settingName)
  {
    setting.get({}, function(details)
    {
      var switcher = getSwitcher(settingName);
      switcher.setAttribute("aria-checked", details.value);
      
      // Toggle the state on click
      switcher.addEventListener("click", function(event)
      {
        // Request again, to get current value
        setting.get({}, function(details)
        {
          if (details.levelOfControl == "controllable_by_this_extension" || 
            details.levelOfControl == "controlled_by_this_extension")
          {
            setting.set({ value: !details.value }, function()
            {
              if (chrome.runtime.lastError != undefined)
              {
                //TODO: Inform user about error
              }
            });
          }
          else
          {
            //TODO: Inform user if control level is not controlable by extension
            // details.levelOfControl
          }
        });
        
      }, false);
    });

    setting.onChange.addListener(function(detail)
    {
      var switcher = getSwitcher(settingName);
      switcher.setAttribute("aria-checked", detail.value);
    })
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
