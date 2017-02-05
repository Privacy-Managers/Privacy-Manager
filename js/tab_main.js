//Use Own privacy object also to keep descriptions of privacy updated
var mainTabDataObject =
{
  privacy:
  {
    network: ["networkPredictionEnabled"],
    services: ["alternateErrorPagesEnabled", "autofillEnabled", "passwordSavingEnabled", "safeBrowsingEnabled", "searchSuggestEnabled",
              "spellingServiceEnabled", "translationServiceEnabled"],
    websites: ["thirdPartyCookiesAllowed", "hyperlinkAuditingEnabled", "referrersEnabled", "protectedContentEnabled"]
  },
  browsingData: ["deleteAllData", "cookies", "appcache", "cache", "downloads", "fileSystems", "formData", "history", 
                 "indexedDB", "localStorage", "pluginData", "passwords", "webSQL"]
};

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
      Elem("#privacyManagement").appendChild(listItem);
      var setting = chrome.privacy[category][settingName];
      privacyManagement(setting, settingName);
    }
  }

  var template = Elem("#startupClear template");
  for (var dataType in chrome.browsingData)
  {
    //Filter options that are only related to the removal of browsing Data
    if (dataType.indexOf("remove") == -1)
      continue;

    var listItem = createListItem(template, dataType);
    Elem("#startupClear").appendChild(listItem);

    (function(dataType)
    {
      Elem("#" + dataType).addEventListener("click", function()
      {
        getStorage("browsingData", function(data)
        {
          data.browsingData[dataType] = !data.browsingData[dataType];
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
    var switcher = Elem("#" + id);
    //TODO: this is probably a duplication
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
  // TODO: optimize the query selector for each item
  var label = content.querySelector("label");
  var switcher = content.querySelector("button");
  var infoIcon = content.querySelector("img");

  label.textContent = getMsg(itemID) || itemID;
  //TODO: Focus button on label click
  switcher.id = itemID;
  var listItem = document.createElement("li");

  listItem.appendChild(document.importNode(template.content, true));
  return listItem;
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
    var switcher = Elem("#" + settingName);
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
    var switcher = Elem("#" + settingName);
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
