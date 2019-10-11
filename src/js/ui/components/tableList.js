const {registerActionListener} = require("../actionListener");

/**
 * Constructor TableList
 * @param {Node} listElem parent <ul> element
 * @param {Template} listItemTemplate <template>
 * @param {Template} listSubItemTemplate <template> (optional)
 * @param {Function} sort sorting function or "reverse" (optional)
 */
function TableList(listElem, listItemTemplate, listSubItemTemplate, sort)
{
  this.items = [];
  this.sort = sort;
  this.listElem = listElem;
  this.listItemTemplate = listItemTemplate;
  this.listSubItemTemplate = listSubItemTemplate;
  this.loaded = 0;
  this.loadAmount = 50;
  this.scrollLoadPercentage = 0.8;

  listElem.addEventListener("keydown", function(ev)
  {
    // Prevent the scrollable list from scrolling
    if (ev.key == "ArrowDown" || ev.key == "ArrowUp")
    {
      ev.preventDefault();
    }
  }, false);

  this.listElem.addEventListener("scroll", this._onScroll.bind(this), false);
  registerActionListener(this.listElem, this.onAction.bind(this));
}

/**
 * Add items to the Table list
 * @param {Array} itemObjs array of itemObj:
 * {
 *   dataset:  { access: "example.com", datasetname: "/" },
 *   texts: {data-text-value: "example.com", data-text-value: "3 Cookies"}
 * }
 */
TableList.prototype.addItems = function(itemObjs)
{
  this.items = this.items.concat(itemObjs);

  if (this.sort)
    this.items.sort(this.sort);

  for (var i = 0; i < itemObjs.length; i++)
  {
    var itemObj = itemObjs[i];
    var itemIndex = this.items.indexOf(itemObj);

    if (itemIndex < this.loaded || itemIndex <= this.loadAmount)
      this._loadItem(itemObj);
  }
};

/**
 * Load item into the view
 * @param  {JSON} itemObj as specified in addItems
 */
TableList.prototype._loadItem = function(itemObj)
{
  if (!itemObj.dataset)
    itemObj.dataset = {};

  if (!itemObj.dataset.access)
    itemObj.dataset.access = this.items.indexOf(itemObj);

  var listItem = this._itemFromTmpl(itemObj, this.listItemTemplate);
  var itemIndex = this.items.indexOf(itemObj);
  var elemAfter = this.listElem.children[itemIndex];

  if (elemAfter)
    this.listElem.insertBefore(listItem, elemAfter);
  else
    this.listElem.appendChild(listItem);

  this.loaded++;
};

/**
 * Scroll bar event handler
 */
TableList.prototype._onScroll = function()
{
  var listClientScrollBottom = this.listElem.scrollTop +
    this.listElem.clientHeight;
  var percentage = listClientScrollBottom / this.listElem.scrollHeight;
  if (percentage > this.scrollLoadPercentage && this.loaded < this.items.length)
  {
    var loadLimit = this.loaded + this.loadAmount;
    for (var i = this.loaded; i < loadLimit && i < this.items.length; i++)
    {
      this._loadItem(this.items[i]);
    }
  }
};

/**
 * Remove main item by ID
 * @param {String} accessor main item ID
 * @param {Boolean} result
 */
TableList.prototype.removeItem = function(accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex >= 0)
  {
    this.items.splice(itemIndex, 1);
    if (this.loaded >= itemIndex)
    {
      this.onAction("next-sibling", this.listElem.children[itemIndex]);
      this.listElem.removeChild(this.listElem.children[itemIndex]);
    }
    return true;
  }
  return false;
};

/**
 * Add subitem
 * @param {JSON} itemObj as specified in addItems
 * @param {String} accessor item ID
 */
TableList.prototype.addSubItem = function(itemObj, accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex === false)
    return false;

  var subListItemElem = this._itemFromTmpl(itemObj, this.listSubItemTemplate);
  var item = this.items[itemIndex];
  var listItemElem = this.listElem.children[itemIndex];

  if (!item.subItems || item.subItems.length == 0)
  {
    listItemElem.dataset.expanded = true;
    item.subItems = [];
    var subListElem = document.createElement("ul");
    subListElem.appendChild(subListItemElem);
    listItemElem.appendChild(subListElem);
    this.focusEdgeElem(subListElem, true);
  }
  else
  {
    listItemElem.querySelector("ul").appendChild(subListItemElem);
  }
  item.subItems.push(itemObj);
};

/**
 * Remove subitem
 * @param {String} parentAccessor main item ID
 * @param {String} accessor subItem ID
 */
TableList.prototype.removeSubItem = function(parentAccessor, accessor)
{
  var itemIndex = this.indexOfAccessor(parentAccessor);
  if (itemIndex === false)
    return false;

  var item = this.items[itemIndex];
  var listItemElem = this.listElem.children[itemIndex];
  var subListItemElem = listItemElem.querySelector("ul");

  for (var i = 0; i < item.subItems.length; i++)
  {
    if (item.subItems[i].dataset.access == accessor)
    {
      if (item.subItems.length == 1)
      {
        this.onAction("next-sibling", listItemElem);
        listItemElem.removeChild(subListItemElem);
      }
      else
      {
        subListItemElem.children[i].parentElement.removeChild(
          subListItemElem.children[i]);
      }
      item.subItems.splice(i, 1);
    }
  }
};

/**
 * Remove All sub items
 * @param {String} accessor main item ID
 */
TableList.prototype.removeAllSubItems = function(accessor)
{
  var item = this.getItem(accessor);
  if (!item)
    return false;

  var i = item.subItems.length;
  while (i--) // Avoide re-indexing
    this.removeSubItem(item.dataset.access, item.subItems[i].dataset.access);

  delete item.subItems;
};

/**
 * Check for subItem existance
 * @param {String} accessor main item ID
 * @param {String} accessor subItem ID
 * @return {Boolean} result
 */
TableList.prototype.hasSubItem = function(parentAccessor, accessor)
{
  var parentItem = this.getItem(parentAccessor);
  if (!parentItem || !parentItem.subItems)
    return false;

  for (var i = 0; i < parentItem.subItems.length; i++)
  {
    if (parentItem.subItems[i].dataset.access == accessor)
      return true;
  }
  return false;
};

/**
 * Update list element using itemObj
 * @param {JSON} itemObj
 * @param {Node} listElem target <li> element
 */
TableList.prototype._updateListElem = function(itemObj, listElem)
{
  var datasetObj = itemObj.dataset;
  for (const name in datasetObj)
    listElem.dataset[name] = datasetObj[name];

  var textsObj = itemObj.texts;
  for (const name in textsObj)
  {
    var textElement = listElem.querySelector("[data-text='"+ name +"']");
    if (textElement)
      textElement.textContent = textsObj[name];
  }
  var titleObjs = itemObj.titles;
  for (var title in titleObjs)
  {
    var titleElement = listElem.querySelector("[data-text='"+ title +"']");
    if (titleElement)
      titleElement.title = titleObjs[title];
  }

  // Set default tabindex to the first list Element
  if (this.listElem.childElementCount == 0)
    listElem.setAttribute("tabindex", "0");
  else
    listElem.setAttribute("tabindex", "-1");
};

/**
 * Create list element from template
 * @param {JSON} itemObj
 * @param {Template} template
 * @return {Node} node
 */
TableList.prototype._itemFromTmpl = function(itemObj, template)
{
  var tmpContent = template.content;
  var tmpList = tmpContent.querySelector("li");

  this._updateListElem(itemObj, tmpList);
  return document.importNode(tmpContent, true);
};

/**
 * Empty data and view
 */
TableList.prototype.empty = function()
{
  this.items = [];
  this.listElem.innerHTML = "";
};

/**
 * Get the index (position) of the item
 * @param {String} accessor
 * @return {Number} index of the item or false if can't find
 */
TableList.prototype.indexOfAccessor = function(accessor)
{
  for (var i = 0; i < this.items.length; i++)
  {
    if (this.items[i].dataset.access == accessor)
      return i;
  }
  return false;
};

/**
 * Getting the item
 * @param {String} accessor main item ID
 * @return {JSON} itemObj or false if doesn't exist
 */
TableList.prototype.getItem = function(accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  if (itemIndex >= 0)
    return this.items[itemIndex];
  else
    return false;
};

/**
 * Update the item and DOM
 * @param {JSON} newItemObj
 * @param {String} accessor ID of the main Item
 */
TableList.prototype.updateItem = function(newItemObj, accessor)
{
  var itemIndex = this.indexOfAccessor(accessor);
  this.items[itemIndex] = newItemObj;

  if (this.loaded >= itemIndex)
    this._updateListElem(newItemObj, this.listElem.children[itemIndex]);
};

/**
 * Reverse focus first or last list item
 * @param {Node} parentElement list item parent element
 * @param {Boolean} isFirst focus first if true otherwise last element
 */
TableList.prototype.focusEdgeElem = function(parentElement, isFirst)
{
  //TODO: use utils method instead 
  var childElem = isFirst ? parentElement.firstChild : parentElement.lastChild;
  while(childElem != null && childElem.nodeType == 3)
    childElem = isFirst ? childElem.nextSibling : childElem.previousSibling;

  if (childElem)
    childElem.focus();
};

/**
 * Action listener
 * @param {String} action
 * @param {Node} element target
 */
TableList.prototype.onAction = function(action, element)
{
  switch (action)
  {
    case "next-sibling":
      var isNext = true;
      break;
    case "previouse-sibling":
      var sibling = isNext ? element.nextSibling : element.previousSibling;
      while (sibling && sibling.nodeType != 1)
        sibling = isNext ? sibling.nextSibling : sibling.previousSibling;

      if (sibling)
        sibling.focus();
      else
        this.focusEdgeElem(element.parentNode, isNext);
      break;
  }
};

module.exports = {TableList};
