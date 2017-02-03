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
    if (dataType.indexOf("remove") == -1)
      continue;

    var listItem = createListItem(template, dataType);
    Elem("#startupClear").appendChild(listItem);
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
          console.log(details.levelOfControl);
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

var MainTab =
{
  privacyArray: mainTabDataObject.privacy.network.concat(mainTabDataObject.privacy.services, mainTabDataObject.privacy.websites),

  deleteAll: "deleteAllData",

  init: function()
  {
    this.generatePrivacyList();
    this.setLocalizedTexts();
    this.updatePrivacySwitchStates();
    this.updateBrowsingDataSwitchStates();
    this.addPrivacySwitchListener();
    this.addBrowsingDataSwitchListener();
    this.addIncognitoListener();
  },

  generatePrivacyList: function()
  {
    //TODO Generate HTML from the template
  },

  setLocalizedTexts: function()
  {
    this.privacyArray.forEach(function (item)
    {
      Elem("#"+item+" .settingName").innerHTML = getMsg(item);
      Elem("#"+item+" .settingName").setAttribute("title", getMsg(item+"_desc"));
      Elem("#"+item+" .infoIcon").setAttribute("title", getMsg(item+"_desc"));
    });
    
    mainTabDataObject.browsingData.forEach(function (item)
    {
      Elem("#"+item+" .settingName").innerHTML = getMsg(item);
      Elem("#"+item+" .settingName").setAttribute("title", getMsg(item+"_desc"));
      Elem("#"+item+" .infoIcon").setAttribute("title", getMsg(item+"_desc"));
    });
  },

  updatePrivacySwitchStates: function ()
  {
    for (var privacyService in chrome.privacy)
    {
      if (!mainTabDataObject.privacy[privacyService])
        continue;

      mainTabDataObject.privacy[privacyService].forEach(function (privacyName)
      {
        try {
          chrome.privacy[privacyService][privacyName].get({}, function(detail) 
          {
            switcher.changeState(Elem("#"+privacyName+" .switch"), detail.value);
          });
        }
        catch (e) {
          Elem("#"+privacyName).classList.add("grey");
        }
      });
    }
  },

  updateBrowsingDataSwitchStates: function()
  {
    //TODO check for null on onload once
    var settings = localStorage.getItem("settings");
    if(settings == null) 
    {
      var settingsJson = {};
      localStorage.setItem("settings", JSON.stringify(settingsJson));
    }
    else
    {
      var settingsJson = JSON.parse(settings);
      mainTabDataObject.browsingData.forEach(function (item)
      {
        if (settingsJson[MainTab.deleteAll] == true && item != MainTab.deleteAll)
        {
          Elem("#"+item).classList.add("grey");
          switcher.changeState(Elem("#"+item+" .switch"), false);
        }
        else
        {
          Elem("#"+item).classList.remove("grey");
          if (settingsJson[item] == null) 
          {
            settingsJson[item] = false;
            localStorage.setItem("settings", JSON.stringify(settingsJson));
            switcher.changeState(Elem("#"+item+" .switch"), false);
          }
          else if (settingsJson[item] == false)
            switcher.changeState(Elem("#"+item+" .switch"), false);
          else
            switcher.changeState(Elem("#"+item+" .switch"), true);
        }
      });
    }
  },

  addPrivacySwitchListener: function()
  {
    this.privacyArray.forEach(function (item) {
      Elem("#"+item+" .switch").addEventListener("click", function(ev)
      {
        for (var privacyService in chrome.privacy)
        {
          if (chrome.privacy[privacyService][item])
          {
            var state = switcher.toggleState.call(this, ev);
            chrome.privacy[privacyService][item].set({value:state});
          }
        }
      }, false);
    });
  },

  addBrowsingDataSwitchListener: function()
  {
    mainTabDataObject.browsingData.forEach(function (item)
    {
      Elem("#"+item+" .switch").addEventListener("click", function(ev)
      {
        var settingsJson = JSON.parse(localStorage.getItem("settings"));
        if (item != MainTab.deleteAll && settingsJson[MainTab.deleteAll] == true)
          return;

        var state = switcher.toggleState.call(this, ev);
        settingsJson[item] = state;
        localStorage.setItem("settings", JSON.stringify(settingsJson));
        if (item == MainTab.deleteAll)
          MainTab.updateBrowsingDataSwitchStates();
      }, false);
    });
  },
  
  addIncognitoListener: function()
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
};

//document.addEventListener("DOMContentLoaded" , MainTab.init.bind(MainTab), false);

document.addEventListener("DOMContentLoaded" , function()
{
  generateMainContent();
  
  Elem("#navigation_tab").addEventListener("switch", function(ev)
  {
      
  }, false);
}, false);
