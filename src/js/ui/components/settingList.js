const {Elem, getMsg, Elems} = require("../utils");
const {additionalPermission, getStorage, setStorage} = require("../../common");

/**
 * Add setting list item
 * @param {Node} parent <ul> element
 * @param {JSON} dataObj data describing the structure ex.:
 * {
 *   dataset:  { access: "access", info: "access_desc" },
 *   text: "",
 *   privacyObj: [Chrome privacy object]
 * }
 * @param {String} type "privacy", "storage" or "permission"
 * @param {Function} callback triggered after creation and on change.
 * The callback parameter should be a function that looks like this:
 * function(state) {...}; where "state" is boolean
 */ 
function addSettingItem(parent, dataObj, type, callback)
{
  const content = Elem("#settings-list").content;
  const listElem = document.importNode(content, true);
  const accessor = dataObj.dataset.access;
  const pmToggle = listElem.querySelector("pm-toggle");
  pmToggle.setAttribute("text", dataObj.text);
  pmToggle.setAttribute("description", getMsg(dataObj.dataset.access + "_desc"));

  const datasetObj = dataObj.dataset;

  for (const name in datasetObj)
    pmToggle.dataset[name] = datasetObj[name];

  parent.appendChild(listElem);

  switch (type)
  {
    case "privacy":
      var privacyObject = dataObj.privacyObj;

      privacyObject.get({}, function(details)
      {
        _updateSettingButton(pmToggle, details.value);
      });
      pmToggle.addEventListener("change", function()
      {
        privacyObject.get({}, function(details)
        {
          if (details.levelOfControl == "controllable_by_this_extension" ||
          details.levelOfControl == "controlled_by_this_extension")
          {
            privacyObject.set({ value: !details.value }, function()
            {
              if (chrome.runtime.lastError != undefined)
              {
                const message = chrome.runtime.lastError.message;
                if (message ==
                  "Can't modify regular settings from an incognito context.")
                {
                  alert(getMsg("regularSettingChangeIncognito_error"));
                }
                else
                {
                  alert(message);
                }
              }
            });
          }
          else
          {
            //TODO: Inform user if control level is not controlable by
            //extension details.levelOfControl
          }
        });
      }, false);

      privacyObject.onChange.addListener(function(detail)
      {
        _updateSettingButton(accessor, detail.value);
      });
      break;
    case "storage":
      getStorage("settingList", function(data)
      {
        var settingList = data["settingList"];
        if (!settingList)
          return;

        var state = settingList[accessor] == true;
        _updateSettingButton(pmToggle, state);
        if (callback)
          callback(state);
      });
      pmToggle.addEventListener("change", function()
      {
        getStorage("settingList", function(data)
        {
          if (data.settingList)
            data.settingList[accessor] = !data.settingList[accessor];
          else
          {
            data.settingList = {};
            data.settingList[accessor] = true;
          }
          setStorage(data, function(result)
          {
            if (callback)
              callback(data.settingList[accessor]);
          });
        });
      }, false);
      break;
    case "permission":
      chrome.permissions.contains(additionalPermission, function(result)
      {
        if (callback)
          callback(result);
        _updateSettingButton(accessor, result);
      });

      pmToggle.addEventListener("click", function()
      {
        chrome.permissions.contains(additionalPermission, function(result)
        {
          if (result)
            chrome.permissions.remove(additionalPermission);
          else
            chrome.permissions.request(additionalPermission);
        });
      }, false);

      chrome.permissions.onAdded.addListener(function(result)
      {
        _updateSettingButton(accessor, true); // Currently called multiple times
        if (callback)
          callback(true);
      });
      chrome.permissions.onRemoved.addListener(function(result)
      {
        _updateSettingButton(accessor, false);
        if (callback)
          callback(false);
      });
      break;
  }
}

function checkSettingState(accessor, callback)
{
  getStorage("settingList", function(data)
  {
    if (data.settingList)
      callback(data.settingList[accessor]);
    else
      callback(false);
  });
}

function turnSwitchesOff(accessors, callback)
{
  getStorage("settingList", function(data)
  {
    accessors.forEach(function(accessor)
    {
      if (data.settingList[accessor])
        data.settingList[accessor] = false;
    });
    setStorage(data, callback);
  });
}

function _updateSettingButton(setting, state)
{
  if (typeof setting == "string")
  {
    Elems("[data-access='" + setting + "']").forEach(function(settingItem)
    {
      _updateSettingButton(settingItem, state);
    });
  }
  else
  {
    setting.setEnabled(state);
  }
}

chrome.storage.onChanged.addListener(function(change)
{
  if ("settingList" in change)
  {
    var newValue = change.settingList.newValue;
    for (var accessor in newValue)
      _updateSettingButton(accessor, newValue[accessor]);
  }
});

module.exports = {addSettingItem, checkSettingState, turnSwitchesOff};
