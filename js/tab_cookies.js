const checkPermission = chrome.permissions.contains;
const removePermission = chrome.permissions.remove;
const requestPermission = chrome.permissions.request;
const permissionRemoved = chrome.permissions.onRemoved;
const permissionAdded = chrome.permissions.onAdded;
const getAllCookies = chrome.cookies.getAll;
const removeCookie = chrome.cookies.remove;
const getCookie = chrome.cookies.get;
const setCookie = chrome.cookies.set;
const onCookieChange = chrome.cookies.onChanged;

const activeTabCookieId = "activeTabCookies";

var cookiesListTmplContent = null;
var cookiesListElem = null;
var domains = [];

var additionalPermission = {"origins": ["http://*/*", "https://*/*"]};
var isAdditionalPermission = false;
var cookieTabIndex = 1;

document.addEventListener("DOMContentLoaded" , function()
{
  cookiesListElem = Elem("#cookiesList");
  cookiesListTmplContent = Elem("#cookiesListTemplate").content;

  Elem("#search-domain").addEventListener("search", populateDomainList, false);
  Elem("#search-domain").addEventListener("keyup", function(ev)
  {
    if (ev.key != "Enter" && ev.key != "Escape")
      populateDomainList();
  }, false);
  var activeTabCookieSwitch = getSwitcher(activeTabCookieId);
  var permissionSwitches = getSwitches("allowHost");

  getStorage(activeTabCookieId, function(data)
  { 
    activeTabCookieSwitch.setAttribute("aria-checked", data[activeTabCookieId]);
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
      disableControls(false);
      getStorage(activeTabCookieId, function(data)
      {
        // Avoide runing populateDomainList() twice
        if (data[activeTabCookieId])
          updateFilterToActiveDomain();
        else
          populateDomainList();
      });
    }
    else
    {
      disableControls(true);
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
    disableControls(true);
    updateSwitches(permissionSwitches, false);
  });

  permissionAdded.addListener(function(permission)
  {
    isAdditionalPermission = true;
    disableControls(false);
    updateSwitches(permissionSwitches, true);
    populateDomainList();
  });
  
  Elem("#cookiesList").addEventListener("keydown", function(ev)
  {
    // Prevent the scrollable list from scrolling
    if (ev.key == "ArrowDown" || ev.key == "ArrowUp")
    {
      ev.preventDefault();
    }
  }, false);
  Elem("#cookiesContainer").addEventListener("click", onCookiesClick, false);
  Elem("#cookiesContainer").addEventListener("keyup", onCookiesKeyUp, false);
}, false);

function updateSwitches(list, value)
{
  list.forEach(function(switchBtn)
  {
    switchBtn.setAttribute("aria-checked", value);
  });
}

/*
 * Populates cookies component with domains 
 */
function populateDomainList()
{
  cookieTabIndex = 1;
  Elem("#cookiesList").innerHTML = "";
  var searchExpression = new RegExp(Elem("#search-domain").value);
  // Use repeative domains to count cookies number
  var repeativeDomains = [];
  getAllCookies({}, function(cookies)
  {
    for (var i = 0; i < cookies.length; i++)
    {
      if (searchExpression.test(cookies[i].domain))
        repeativeDomains.push(removeStartDot(cookies[i].domain));
    }

    repeativeDomains.sort();

    var templateContent = cookiesListTmplContent;
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
    if (lastDomain)
      createDomainListItem(lastDomain, cookiesNumber);

  });
}

/*
 * Get parent element using data-* attribute 
 * @param {Node} Node Dom node
 * @param {String} date data-* attribute value
 * @return {String} value of data attribute
 */
function getParentData(node, data, getElement)
{
  if (node.hasAttribute(data))
    return getElement ? node : node.getAttribute(data);

  return getParentData(node.parentElement, data, getElement);
}


/*
 * Track global click inside of cookies managamenet component 
 * @param {Event} ev Click event
 */
function onCookiesClick(ev)
{
  var element = ev.target;
  var action = null;

  while (true)
  {
    if (element == this)
      break;

    if (element.hasAttribute("data-action"))
    {
      action = element.getAttribute("data-action");
      break;
    }

    element = element.parentElement;
  }

  if (!action)
    return;

  onCookiesAction(action, element);
}

function onCookiesKeyUp(ev)
{
  var key = ev.key;
  var activeElem = document.activeElement;
  var tabIndex = activeElem.getAttribute("tabindex");
  var action = null;

  switch (key)
  {
    case " ":
    case "Enter":
      action = activeElem.dataset.keyAction;
      break;
    case "Delete":
    case "Backspace":
      action = activeElem.dataset.keyDelete;
      break;
    case "ArrowUp":
      action = activeElem.dataset.keyUp;
      break;
    case "ArrowDown":
      action = activeElem.dataset.keyDown;
      break;
    case "Escape":
      if (Elem("[role='dialog']").getAttribute("aria-hidden") != "true")
        closeDialog();
      else if (Elem("[role='alertdialog']").getAttribute("aria-hidden") != "true")
        closePromt();
      else
        action = activeElem.dataset.keyQuite;
      break;
  }

  if (!action)
      return;

  ev.preventDefault;
  onCookiesAction(action, activeElem);
}

function onCookiesAction(action, element)
{
  switch (action)
  {
    case "get-cookies":
      if (element.dataset.expanded == "true")
      {
        onCookiesAction("close-expanded-domain", element);
        return;
      }
      var domain = element.getAttribute("data-domain");
      getAllCookies({"domain": domain}, function(cookies)
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
        
        focusEdgeElem(listElem, true);
      });
      break;
    case "close-expanded-domain":
      var domainElem = getParentData(element, "data-expanded", true);
      var sublistElem = domainElem.querySelector("ul");
      sublistElem.parentNode.removeChild(sublistElem);
      domainElem.dataset.expanded = false;
      domainElem.focus();
      break;
    case "delete-domain-cookies":
      var domain = getParentData(element, "data-domain");
      getAllCookies({"domain": domain}, function(cookies)
      {
        var callbackCount = 0;
        for (var i = 0; i < cookies.length; i++)
        {
          var cookie = cookies[i];
          var url = getUrl(cookie.domain, cookie.path, cookie.secure);
          removeCookie({"url": url, "name": cookie.name}, function()
          {
            callbackCount++;
            if (cookies.length == callbackCount)
            {
              onCookiesAction("next-sibling" ,element);
              element.parentNode.removeChild(element);
            }
          });
        }
      });
      break;
    case "delete-sublist-cookie":
      var cookieName = getParentData(element, "data-cookie");
      var url = getUrl(getParentData(element, "data-domain"), 
                        getParentData(element, "data-path"), 
                        getParentData(element, "data-secure") == "true");
      removeCookie({"url": url, "name": cookieName});
      break;
    case "delete-cookie":
      var fieldsObj = getCookieDialogData().fields;
      var url = getUrl(fieldsObj.domain.value, fieldsObj.path.value, 
                      fieldsObj.secure.checked);

      var name = fieldsObj.name.value;
      removeCookie({"url": url, "name": name}, function(cookie)
      {
        if (cookie)
          closeDialog();
      });
      break;
    case "close-dialog":
      closeDialog();
      break;
    case "add-cookie":
      var dialogObj = getCookieDialogData();
      dialogObj.dialog.setAttribute("data-dialog", "add-cookie");
      dialogObj.dialog.setAttribute("aria-hidden", false);
      dialogObj.form.reset();
      var fieldsObj = dialogObj.fields;
      fieldsObj.domain.removeAttribute("disabled");
      fieldsObj.domain.focus();
      fieldsObj.name.removeAttribute("disabled");
      dialogObj.header.textContent = "Add Cookie";
      fieldsObj.submitBtn.textContent = "Add";
      break;
    case "edit-cookie":
      var dialogObj = getCookieDialogData();
      dialogObj.form.reset();
      var cookieName = getParentData(element, "data-cookie");
      var url = getUrl(getParentData(element, "data-domain"), 
                        getParentData(element, "data-path"), 
                        getParentData(element, "data-secure") == "true");
      getCookie({"url": url, "name": cookieName}, function(cookie)
      {
        dialogObj.dialog.setAttribute("aria-hidden", false);
        dialogObj.dialog.setAttribute("data-dialog", "edit-cookie");
        dialogObj.header.textContent = "Edit Cookie";

        var fieldsObj = dialogObj.fields;
        fieldsObj.submitBtn.textContent = "Update";
        fieldsObj.domain.setAttribute("disabled", "disabled");
        fieldsObj.name.setAttribute("disabled", "disabled");
        fieldsObj.name.value = cookie.name;
        fieldsObj.value.value = cookie.value;
        fieldsObj.value.focus();
        fieldsObj.domain.value = cookie.domain;
        fieldsObj.path.value = cookie.path;
        fieldsObj.hostOnly.checked = cookie.hostOnly;
        fieldsObj.httpOnly.checked = cookie.httpOnly;
        fieldsObj.secure.checked = cookie.secureElem;
        fieldsObj.session.checked = cookie.session;
        fieldsObj.storeId.value = cookie.storeId;

        var times = new Date(cookie.expirationDate * 1000).toISOString().
                    split("T");
        fieldsObj.expDate.value = times[0];
        fieldsObj.expTime.value = times[1].split(".")[0];
      });
      break;
    case "update-cookie":
        var dialogObj = getCookieDialogData();
        if (dialogObj.form.checkValidity())
          ev.preventDefault(); //stop from submiting
        else
          return;

        var fieldsObj = dialogObj.fields;
        var datetime = fieldsObj.expDate.value;
        var time = fieldsObj.expTime.value;
        datetime += time ? "T" + time : "";
        //TODO: Past expirationDate is invalid
        var expirationDate = new Date(datetime).getTime() / 1000;

        var cookieSetObj = {
                            "url": getUrl(fieldsObj.domain.value, 
                                          fieldsObj.path.value, 
                                          fieldsObj.secure.value), 
                            "name": fieldsObj.name.value,
                            "value": fieldsObj.value.value, 
                            "secure": fieldsObj.secure.checked,
                            "httpOnly": fieldsObj.httpOnly.checked, 
                            "storeId": fieldsObj.storeId.value,
                            "expirationDate": expirationDate
                          };
        
        // Omitted domain makes host-only cookie
        if (!fieldsObj.hostOnly.checked)
          cookieSetObj.domain = domain;

        setCookie(cookieSetObj, function(cookie)
        {
          if (cookie)
            closeDialog();
        });
      break;
    case "next-sibling":
      var isNext = true;
    case "previouse-sibling":
      var sibling = isNext ? element.nextSibling : element.previousSibling;
      while (sibling && sibling.nodeType != 1)
        sibling = isNext ? sibling.nextSibling : sibling.previousSibling;

      if (sibling)
        sibling.focus();
      else
        focusEdgeElem(element.parentNode, isNext);
      break;
    case "open-promt":
        Elem("[role='alertdialog']").setAttribute("aria-hidden", false);
      break;
    case "cancel-promt":
      closePromt();
      break;
    case "delete-all-cookies":
      chrome.browsingData.removeCookies({}, function()
      {
        populateDomainList();
      });
      closePromt();
      break;
  }
}

/*
 * Get Dialog and Elements in JSON format 
 */
function getCookieDialogData()
{
  return {
    "dialog": Elem("[role='dialog']"),
    "header": Elem("#dialog-header-text"),
    "form": Elem("#cookie-form"),
    "fields":
    {
      "domain": Elem("#cookie-domain"), "name": Elem("#cookie-name"),
      "path": Elem("#cookie-path"), "value": Elem("#cookie-value"),
      "hostOnly": Elem("#cookie-host-only"), 
      "httpOnly": Elem("#cookie-http-only"), "secure": Elem("#cookie-secure"),
      "session": Elem("#cookie-session"),
      "expDate": Elem("#cookie-expiration-date"),
      "expTime": Elem("#cookie-expiration-time"),
      "storeId": Elem("#cookie-store-id"), "submitBtn": Elem("#update-cookie")
    }
  };
}

/*
 * Create Domain list item and add to the Domains list element
 * @param {String} domain domain name
 * @param {Number} cookiesNum number of cookies that applies to domain
 * @param {Number} position position in the list [optional]
 */
function createDomainListItem(domain, cookiesNum, position)
{
  var template = cookiesListTmplContent;
  var tmpList = template.querySelector("li");
  tmpList.setAttribute("data-domain", domain);

  if (cookiesListElem.childElementCount == 0)
    tmpList.setAttribute("tabindex", "0");
  else
    tmpList.setAttribute("tabindex", "-1");

  template.querySelector(".domainName").textContent = domain;
  template.querySelector(".cookiesNumber").textContent = cookiesNum + 
                                                         " Cookies";

  var listItem = document.importNode(template, true);
  if (position)
  {
    var nextElem = Elem("#cookiesList > li:nth-child(" + position + ")");
    cookiesListElem.insertBefore(listItem ,nextElem);
  }
  else
  {
    cookiesListElem.appendChild(listItem);
    cookieTabIndex++;
  }
}

/*
 * Create Cookie list item and add as a sublist to a domain
 * @param {Cookie} cookie cookie OBJ as specified by cookies API
 * @param {Node} parent list Element to be added to
 */
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

  parent.appendChild(document.importNode(templateContent, true));
}

/*
 * Filter cookies list according to the active tab URL
 */
function updateFilterToActiveDomain()
{
  chrome.tabs.query({active: true}, function(tab)
  {
    var url = tab[0].url;
    if (url.indexOf("://") > -1)
    {
       var domain = url.split('/')[2].split(':')[0];
       Elem("#search-domain").value = domain;
       populateDomainList();
    }
  });
}

/*
 * Enable/disable control elements
 * @param {Boolean} disabled
 */
function disableControls(disabled)
{
  Elem("#cookie-controls").childNodes.forEach(function(Node)
  {
    if (Node.nodeType == 1)
      if (disabled)
        Node.setAttribute("disabled", disabled);
      else
        Node.removeAttribute("disabled");
  });
}

function closeDialog()
{
  Elem("[role='dialog']").setAttribute("aria-hidden", true);
}

function closePromt()
{
  Elem("[role='alertdialog']").setAttribute("aria-hidden", true);
}

function removeStartDot(string)
{
  return string.replace(/^\./, "");
}

function getUrl(domain, path, isSecure)
{
  return "http" + (isSecure ? "s" : "") + "://" + domain + path;
}

function focusEdgeElem(element, isFirst)
{
  var childElem = isFirst ? element.firstChild : element.lastChild;
  while(childElem != null && childElem.nodeType == 3)
    childElem = isFirst ? childElem.nextSibling : childElem.previousSibling;

  if (childElem)
    childElem.focus();
}

onCookieChange.addListener(function(changeInfo)
{
  var cookie = changeInfo.cookie;
  var domain = removeStartDot(cookie.domain);
  var domainListElem = Elem("#cookiesList [data-domain='" + domain + "']");

  if (!domainListElem)
  {
    var templateContent = cookiesListTmplContent;
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
      {
        onCookiesAction("next-sibling" ,domainListElem);
        domainListElem.parentNode.removeChild(domainListElem);
      }
      else
      {
        onCookiesAction("next-sibling" ,cookieListElem);
        cookieListElem.parentNode.removeChild(cookieListElem);
      }
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
      updateFilterToActiveDomain();
  }
});
