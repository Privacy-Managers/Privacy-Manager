"use strict";

(function()
{
  const getAllCookies = chrome.cookies.getAll;
  const removeCookie = chrome.cookies.remove;
  const getCookie = chrome.cookies.get;
  const setCookie = chrome.cookies.set;
  const onCookieChange = chrome.cookies.onChanged;

  const activeTabCookieId = "activeTabCookies";

  var tableList = null;
  document.addEventListener("DOMContentLoaded" , function()
  {
    Elem("#search-domain").addEventListener("search", populateDomainList, false);
    Elem("#search-domain").addEventListener("keyup", function(ev)
    {
      if (ev.key != "Enter" && ev.key != "Escape")
        populateDomainList();
    }, false);

    var leftSettingList = Elem("#cookies_tab ul.settings-list:nth-of-type(1)");
    var rightSettingList = Elem("#cookies_tab ul.settings-list:nth-of-type(2)");
    addSettingItem(leftSettingList, "allowHostPermissions", "permission", function(enabled)
    {
      disableControls(!enabled);
      if (enabled)
      {
        checkSettingState(activeTabCookieId, function(active)
        {
          // Avoide runing populateDomainList() twice
          if (active)
            updateFilterToActiveDomain();
          else
            populateDomainList();
        });
      }
    });

    addSettingItem(rightSettingList, activeTabCookieId, "storage", function(active)
    {
      if (active)
        updateFilterToActiveDomain();
    });

    tableList = new TableList(
      Elem("#cookieList"), 
      Elem("#cookiesListTemplate"),
      Elem("#cookiesSubListTemplate"));
    registerActionListener(Elem("#cookiesContainer"), onCookiesAction);
  }, false);

  function updateSwitches(list, value)
  {
    list.forEach(function(switchBtn)
    {
      switchBtn.setAttribute("aria-checked", value);
    });
  }

  function populateDomainList()
  {
    tableList.empty();
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

      var lastDomain = repeativeDomains[0];
      var cookiesNumber = 1;

      for (var i = 1; i < repeativeDomains.length; i++)
      {
        var domain = repeativeDomains[i];
        if (lastDomain != domain || i == repeativeDomains.length - 1)
        {
          tableList.addItem(createDomainObj(lastDomain, cookiesNumber));

          lastDomain = domain;
          cookiesNumber = 1;
        }
        else
        {
          cookiesNumber++;
        }
      }

      tableList.addItem(createDomainObj(lastDomain, cookiesNumber));
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

        var domain = element.getAttribute("data-access");
        getAllCookies({"domain": domain}, function(cookies)
        {
          for (var i = 0; i < cookies.length; i++)
          {
            var cookie = cookies[i];
            // Filter subdomains matched cookies
            if (cookie.domain.indexOf(domain) > 1)
              continue;

            tableList.addSubItem(createCookieSubitemObj(cookie), domain);
          }
        });
        break;
        case "close-expanded-domain":
        var domainElem = getParentData(element, "data-expanded", true);
        tableList.removeAllSubItems(domainElem.dataset.access);
        domainElem.focus(); 
        domainElem.dataset.expanded = false;
        break;
      case "delete-domain-cookies":
        var domain = getParentData(element, "data-access");
        getAllCookies({"domain": domain}, function(cookies)
        {
          var callbackCount = 0;
          for (var i = 0; i < cookies.length; i++)
          {
            var cookie = cookies[i];
            var url = getUrl(cookie.domain, cookie.path, cookie.secure);
            removeCookie({"url": url, "name": cookie.name});
          }
        });
        break;
      case "delete-sublist-cookie":
        var accessObj = JSON.parse(getParentData(element, "data-access"));
        var domain = getParentData(getParentData(element, "data-access", true).
          parentElement, "data-access");
        var url = getUrl(domain, accessObj.path, accessObj.secure);
        removeCookie({"url": url, "name": accessObj.cookie});
        break;
      case "delete-cookie": // From Dialog
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
        var subItemElem = getParentData(element, "data-access", true);
        var accessObj = JSON.parse(subItemElem.dataset.access);
        var domain = getParentData(subItemElem.parentElement, "data-access");
        var url = getUrl(domain, accessObj.path, accessObj.secure);
        getCookie({"url": url, "name": accessObj.cookie}, function(cookie)
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
      case "close-dialog":
        //TODO: Close dialog on ESC
        closeDialog();
        break;
      case "update-cookie":
        var dialogObj = getCookieDialogData();
        if (!dialogObj.form.checkValidity())
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

  function createSubitemAccessor(cookie)
  {
    return JSON.stringify({
      cookie: cookie.name,
      secure: cookie.secure,
      path: cookie.path
    });
  }

  function createCookieSubitemObj(cookie)
  {
    return {
      dataset: { 
        access: createSubitemAccessor(cookie)
      },
      texts: {
        name: cookie.name,
        value: cookie.value
      }
    };
  }

  function createDomainObj(domain, cookienum)
  {
    return {
      dataset: {
        access: domain
      },
      texts: {
        domain: domain,
        cookienum: cookienum + " Cookies"
      }
    };
  }

  onCookieChange.addListener(function(changeInfo)
  {
    var cookie = changeInfo.cookie;
    var domain = removeStartDot(cookie.domain);
    var domainListElem = tableList.getItem(domain);

    if (!domainListElem)
    {
      tableList.addItem(createDomainObj(domain, 1));
      return;
    }

    var cookieNum = domainListElem.texts.cookienum.split(" ")[0];
    if (changeInfo.removed)
    {
      var subItemAccessor = createSubitemAccessor(cookie);
      if (tableList.hasSubItem(domain, subItemAccessor))
      {
        domainListElem.texts.cookienum = cookieNum - 1 + " Cookies";
        tableList.updateItem(domainListElem, domain);

        if (cookieNum == 1)
          tableList.removeItem(domain);
        else
          tableList.removeSubItem(domain, subItemAccessor);
      }
      else
      {
        if (cookieNum == 1)
        {
          tableList.removeItem(domain);
        }
        else
        {
          domainListElem.texts.cookienum = cookieNum - 1 + " Cookies";
          tableList.updateItem(domainListElem, domain);
        }
      }
    }
    else
    {
      domainListElem.texts.cookienum = parseInt(cookieNum) + 1 + " Cookies";
      tableList.updateItem(domainListElem, domain);

      if (domainListElem.subItems)
        tableList.addSubItem(createCookieSubitemObj(cookie), domain);
    }
  });
})();
