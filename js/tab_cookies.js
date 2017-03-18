const checkPermission = chrome.permissions.contains;
const removePermission = chrome.permissions.remove;
const requestPermission = chrome.permissions.request;
const permissionRemoved = chrome.permissions.onRemoved;
const permissionAdded = chrome.permissions.onAdded;
const activeTabCookieId = "activeTabCookies";

var cookiesListTemplate = null;
var cookiesListElem = null;
var domains = [];

var additionalPermission = {"origins": ["http://*/*", "https://*/*"]};
var isAdditionalPermission = false;

function comparePermissions(permissionObj)
{
  for (var i = 0; i < additionalPermission.origins.length; i++)
    if (permissionObj.origins.indexOf(additionalPermission.origins[i]) == -1)
      return false;
  return true;
}

function updateSwitches(list, value)
{
  list.forEach(function(switchBtn)
  {
    switchBtn.setAttribute("aria-checked", value);
  });
}

document.addEventListener("DOMContentLoaded" , function()
{
  cookiesListElem = Elem("#cookiesList");
  cookiesListTemplate = Elem("#cookiesListTemplate").content;

  var permissionSwitches = getSwitches("allowHost");
  Elem("#search-domain").addEventListener("keyup", loadCookies, false);
  // Not a standart
  //TODO: exclude Enter and Esc
  Elem("#search-domain").addEventListener("search", loadCookies, false);
  var activeTabCookieSwitch = getSwitcher(activeTabCookieId);
  getStorage(activeTabCookieId, function(data)
  { 
    activeTabCookieSwitch.setAttribute("aria-checked", data[activeTabCookieId]);
    if (data[activeTabCookieId])
      searchByActiveDomain();
  });
  activeTabCookieSwitch.addEventListener("click", function()
  {
    getStorage(activeTabCookieId, function(data)
    {
      var obj = {};
      obj[activeTabCookieId] = !data[activeTabCookieId];
      setStorage(obj);
    });
  }, false);

  checkPermission(additionalPermission, function(result)
  {
    if (result)
    {
      isAdditionalPermission = true;
      loadCookies();
    }

    permissionSwitches.forEach(function(switchBtn)
    {
      switchBtn.setAttribute("aria-checked", result);
    });
  });

  permissionSwitches.forEach(function(switchBtn)
  {
    switchBtn.addEventListener("click", function()
    {
      checkPermission(additionalPermission, function(result)
      {
        if (result)
          removePermission(additionalPermission);
        else
          requestPermission(additionalPermission);
      });
    }, false);
  });

  permissionRemoved.addListener(function(permission)
  {
    isAdditionalPermission = false;
    updateSwitches(permissionSwitches, false);
  });

  permissionAdded.addListener(function(permission)
  {
    isAdditionalPermission = true;
    updateSwitches(permissionSwitches, true);
    loadCookies();
  });

  Elem("#cookiesContainer").addEventListener("click", onCookiesClick, false);
}, false);

function loadCookies()
{
  Elem("#cookiesList").innerHTML = "";
  var searchExpression = new RegExp(Elem("#search-domain").value);
  // Use repeative domains to count cookies number
  var repeativeDomains = [];
  chrome.cookies.getAll({}, function(cookies)
  {
    for (var i = 0; i < cookies.length; i++)
    {
      if (searchExpression.test(cookies[i].domain))
        repeativeDomains.push(removeStartDot(cookies[i].domain));
    }

    repeativeDomains.sort();

    var templateContent = Elem("#cookiesListTemplate").content;
    var cookieListContainer = Elem("#cookiesList");
    var lastDomain = repeativeDomains[0];
    var cookiesNumber = 1;
    for (var i = 1; i < repeativeDomains.length; i++)
    {
      var domain = repeativeDomains[i];
      if (lastDomain != domain)
      {
        createDomainListItem(lastDomain, cookiesNumber);
        
        lastDomain = domain;
        domains.push(domain);
        cookiesNumber = 1;
      }
      else
      {
        cookiesNumber++;
      }
    }
    var templateContent = Elem("#cookiesListTemplate").content;
  });
}


function removeStartDot(string)
{
  return string.replace(/^\./, "");
}

function onCookiesClick(e)
{
  var element = e.target;
  var cookieElement = null;
  var actions = null;
  var domain = null;
  var cookie = null;
  var path = null;
  var secure = false;

  while (true)
  {
    if (element == this)
      break;

    if (element.hasAttribute("data-action"))
      actions = actions == null ? element.getAttribute("data-action").split(",") 
                                : actions;

    if (element.hasAttribute("data-cookie"))
    {
      cookie = element.getAttribute("data-cookie");
      cookieElement = element;
    }

    if (element.hasAttribute("data-secure"))
      secure = element.getAttribute("data-secure") == "true";

    if (element.hasAttribute("data-path"))
      path = element.getAttribute("data-path");

    if (element.hasAttribute("data-domain"))
    {
      domain = element.getAttribute("data-domain");
      break;
    }

    element = element.parentElement;
  }

  if (!actions)
    return;

  for (var i = 0; i < actions.length; i++)
  {
    switch (actions[i])
    {
      case "get-cookies":
        if (element.dataset.expanded == "true")
        {
          var sublistElem = element.querySelector("ul");
          sublistElem.parentNode.removeChild(sublistElem);
          element.dataset.expanded = false;
          return;
        }
        chrome.cookies.getAll({"domain": domain}, function(cookies)
        {
          var listElem = document.createElement("ul");
          for (var i = 0; i < cookies.length; i++)
          {
            var cookie = cookies[i];
            // Filter subdomains matched cookies
            if (cookie.domain.indexOf(domain) > 1)
              continue;

            createAddCookieListItem(cookie, listElem);
          }
          element.dataset.expanded = true;
          element.appendChild(listElem);
        });
        break;
      case "delete-domain-cookies":
        chrome.cookies.getAll({"domain": domain}, function(cookies)
        {
          var callbackCount = 0;
          for (var i = 0; i < cookies.length; i++)
          {
            removeCookie(cookies[i], function()
            {
              callbackCount++;
              if (cookies.length == callbackCount)
                element.parentNode.removeChild(element);
            });
          }
        });
        break;
      case "delete-cookie":
        var url = "http" + (secure ? "s" : "") + "://" + domain + path;
        chrome.cookies.remove({"url": url, "name": cookie}, function(cookie)
        {
          if (cookie)
            closeDialog();
        });
        break;
      case "close-dialog":
        closeDialog();
        break;
      case "add-cookie":
        var dialog = Elem("[role='dialog']");
        dialog.setAttribute("data-dialog", "add-cookie");
        dialog.setAttribute("aria-hidden", false);
        Elem("#cookiesContainer form").reset();
        Elem("#cookie-domain").removeAttribute("disabled");
        Elem("#dialog-header-text").textContent = "Add Cookie";
        Elem("#update-cookie").textContent = "Add";
        break;
      case "edit-cookie":
        Elem("#cookiesContainer form").reset();
        //TODO: remove duplication
        var url = "http" + (secure ? "s" : "") + "://" + domain + path;
        chrome.cookies.get({"url": url, "name": cookie}, function(cookie)
        {
          Elem("#dialog-header-text").textContent = "Edit Cookie";
          Elem("#update-cookie").textContent = "Update";
          Elem("#cookie-domain").setAttribute("disabled", "disabled");
          var dialog = Elem("[role='dialog']");
          dialog.setAttribute("aria-hidden", false);
          dialog.setAttribute("data-dialog", "edit-cookie");
          dialog.dataset.domain = cookie.domain;
          dialog.dataset.cookie = cookie.name;
          dialog.dataset.secure = cookie.secure;
          dialog.dataset.path = cookie.path;

          var nameElem = Elem("#cookie-name");
          var valueElem = Elem("#cookie-value");
          var domainElem = Elem("#cookie-domain");
          var pathElem = Elem("#cookie-path");
          var hostOnlyElem = Elem("#cookie-host-only");
          var httpOnlyElem = Elem("#cookie-http-only");
          var secureElem = Elem("#cookie-secure");
          var sessionElem = Elem("#cookie-session");
          var expirationDateElem = Elem("#cookie-expiration-date");
          var expirationTimeElem = Elem("#cookie-expiration-time");
          var storeIdElem = Elem("#cookie-store-id");
          
          nameElem.value = cookie.name;
          valueElem.value = cookie.value;
          domainElem.value = cookie.domain;
          pathElem.value = cookie.path;
          // convert expirationDate in seconds to milliseconds
          var times = new Date(cookie.expirationDate * 1000).toISOString().
                      split("T");
          var date = times[0];
          var time = times[1].split(".")[0];

          expirationDateElem.value = date;
          expirationTimeElem.value = time;
          hostOnlyElem.checked = cookie.hostOnly;
          httpOnlyElem.checked = cookie.httpOnly;
          secureElem.checked = cookie.secureElem;
          sessionElem.checked = cookie.session;
          storeIdElem.value = cookie.storeId;
        });
        break;
      case "update-cookie":
          var formElem = Elem("#cookie-form");
          if (formElem.checkValidity())
            e.preventDefault(); //stop from submiting
          else
            return;

          var name = Elem("#cookie-name").value;
          var value = Elem("#cookie-value").value;
          var domain = Elem("#cookie-domain").value;
          var path = Elem("#cookie-path").value;
          
          var datetime = Elem("#cookie-expiration-date").value;
          var time = Elem("#cookie-expiration-time").value
          datetime += time ? "T" + time : "";
          var expirationDate = new Date(datetime).getTime() / 1000;
          //TODO: Past expirationDate is invalid
          var hostOnly = Elem("#cookie-host-only").checked;
          var httpOnly = Elem("#cookie-http-only").checked;
          var secure = Elem("#cookie-secure").checked;
          var session = Elem("#cookie-session").checked;
          var storeId = Elem("#cookie-store-id").value;
          var url = "http" + (secure ? "s" : "") + "://" + domain + path;

          chrome.cookies.set({"url": url, "name": name, "value": value, 
                            "domain": domain, "path": path, "secure":secure, 
                            "httpOnly": httpOnly, "storeId": storeId,
                            "expirationDate": expirationDate}, function(cookie)
          {
            if (cookie)
              closeDialog();
          });
        break;
      case "promt-cookies-delete":
          var dialog = Elem("[role='alertdialog']");
          dialog.setAttribute("aria-hidden", false);
        break;
      case "cancel-promt":
        closePromt();
        break;
      case "delete-all-cookies":
        chrome.browsingData.removeCookies({}, function()
        {
          loadCookies();
        });
        closePromt();
        break;
    }
  }
}

function createDomainListItem(domain, cookiesNum, position)
{
  var domainListElem = cookiesListTemplate.querySelector("li");
  var domainNameElem = cookiesListTemplate.querySelector(".domainName");
  var cookiesNumberElem = cookiesListTemplate.querySelector(".cookiesNumber");
  
  domainListElem.setAttribute("data-domain", domain);
  domainNameElem.textContent = domain;
  cookiesNumberElem.textContent = cookiesNum + " Cookies";

  var listElem = document.importNode(cookiesListTemplate, true);
  if (position)
  {
    var nextElem = Elem("#cookiesList > li:nth-child(" + position + ")");
    cookiesListElem.insertBefore(listElem ,nextElem);
  }
  else
  {
    cookiesListElem.appendChild(listElem);
  }
}

function createAddCookieListItem(cookie, parent)
{
  var templateContent = Elem("#cookiesSubListTemplate").content;

  var cookieListElem = templateContent.querySelector("li");
  var cookieNameElem = templateContent.querySelector(".cookieName");
  var cookieValueElem = templateContent.querySelector(".cookieValue");
  
  cookieListElem.setAttribute("data-cookie", cookie.name);
  cookieListElem.setAttribute("data-secure", cookie.secure);
  cookieListElem.setAttribute("data-path", cookie.path);
  cookieNameElem.textContent = cookie.name;
  cookieValueElem.textContent = cookie.value;

  //TODO: We do not know sort position
  parent.appendChild(document.importNode(templateContent, true));
}

function closeDialog()
{
  Elem("[role='dialog']").setAttribute("aria-hidden", true);
}

function closePromt()
{
  Elem("[role='alertdialog']").setAttribute("aria-hidden", true);
}

function removeCookie(cookie, callback)
{
  var url = "http" + (cookie.secure ? "s" : "") + "://" + cookie.domain +
            cookie.path;
  chrome.cookies.remove({"url": url, "name": cookie.name}, callback);
}

function searchByActiveDomain()
{
  chrome.tabs.query({active: true}, function(tab)
  {
    var url = tab[0].url;
    if (url.indexOf("://") > -1)
    {
       var domain = url.split('/')[2].split(':')[0];
       Elem("#search-domain").value = domain;
       loadCookies();
    }
  });
}

chrome.cookies.onChanged.addListener(function(changeInfo)
{
  var cookie = changeInfo.cookie;
  var domain = removeStartDot(cookie.domain);
  var domainListElem = Elem("#cookiesList [data-domain='" + domain + "']");

  if (!domainListElem)
  {
    var templateContent = Elem("#cookiesListTemplate").content;
    var cookieListContainer = Elem("#cookiesList");
    domains.push(domain);
    domains.sort();
    var position = domains.indexOf(domain) + 1;
    createDomainListItem(domain, 1, position);
    return;
  }

  var cookiesNumElem = domainListElem.querySelector(".cookiesNumber");
  var cookiesNum = cookiesNumElem.textContent;
  var spaceIndex = cookiesNum.indexOf(" ");
  cookiesNum = parseInt(cookiesNum.substring(0, spaceIndex));
  
  if (changeInfo.removed)
  {
    cookiesNumElem.textContent = cookiesNumElem.textContent.
                                replace(cookiesNum, cookiesNum - 1);

    var cookieListElem = domainListElem.querySelector("[data-cookie='" + 
                cookie.name +"'][data-path='" + cookie.path + "']");

    if (cookieListElem)
    {
      if (domainListElem.querySelectorAll("li").length == 1)
        domainListElem.parentNode.removeChild(domainListElem);
      else
        cookieListElem.parentNode.removeChild(cookieListElem);
    }
  }
  else
  {
    cookiesNumElem.textContent = cookiesNumElem.textContent.
                                replace(cookiesNum, cookiesNum + 1);
    if (domainListElem.dataset.expanded)
      createAddCookieListItem(cookie, Elem("ul", domainListElem));
  }
});

chrome.storage.onChanged.addListener(function(change)
{
  if (activeTabCookieId in change)
  {
    var isActive = change[activeTabCookieId].newValue;
    getSwitcher(activeTabCookieId).setAttribute("aria-checked", isActive);
    if (isActive)
      searchByActiveDomain();
  }
});
