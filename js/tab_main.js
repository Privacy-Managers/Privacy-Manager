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

document.addEventListener("DOMContentLoaded" , MainTab.init.bind(MainTab), false);
