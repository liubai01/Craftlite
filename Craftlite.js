//=============================================================================
// Craftlite.js
//=============================================================================

/*:
 * @plugindesc A lightweight craft plugin
 * @author liubai01
 *
 * @param Title
 * @desc The title of the craft menu.
 * @default Craft Table
 * 
 * @param Unknown Craft Rule
 * @desc The index name for an unknown craft rule.
 * @default ??????
 *
 * @param Unknown Item
 * @desc The name for an unknow item.
 * @default ??????
 *
 * @param Material
 * @desc The name for Material in menu.
 * @default Material
 * 
 * @help
 *
 * Plugin Command:
 */

/**
 * This is a static class that manages the craftlite system.
 * 
 * @static
 * @class Craftlite
 */
var Craftlite = function() {
    throw new Error('This is a static class');
}

/*!
 *  This is an object that contained  the informaion about craft rules. 
 *  Each element in the $dataCraftLite.data represents a rule.
 *  Data stores at data/CraftRule.json
 *  Please create data/CraftRules.json if it doesn't exsits!
 *  The format of craft rule: 
 *  {
 *  rid:<rid>, 
 *  name:"<name>",
 *  materials:{<itemID>: <amount>, ...}, 
 *  targetItems: {<itemID>: <amount>, ...},
 *  desc: <description>
 *  }
 *  
 * @type {Object}
 */
DataManager.loadDataFile('$dataCraftLite', 'CraftRules.json');

Craftlite.parameters = PluginManager.parameters('Craftlite');
Craftlite.unknownData = String(Craftlite.parameters['Unknown Craft Rule'] || '??????');
Craftlite.unknownItemName = String(Craftlite.parameters['Unknown Item'] || '??????');
Craftlite.menuTitle = String(Craftlite.parameters['Title'] || 'Craft Table');
Craftlite.menuMaterial = String(Craftlite.parameters['Material'] || 'Material');

/**
 *  The intermediate variable to extend the Game_Interpreter.prototype 
 *  function, in order to manage its own plugin command.
 *  
 * @type {function}
 */
Craftlite._Game_Interpreter_pluginCommand = Game_Interpreter.prototype.pluginCommand;

Game_Interpreter.prototype.pluginCommand = function(command, args) {
    Craftlite._Game_Interpreter_pluginCommand.call(this, command, args);
    if (command === 'Craftlite') {
        switch (args[0]) {
            case 'open':
                SceneManager.push(Craftlite.Scene);
                break;
            case 'add':
                Craftlite.setValid(args[1], true);
                break;
            case 'remove':
                Craftlite.setValid(args[1], false);
                break;
            case 'complete':
                Craftlite.clearValidTable();
                break;
        }
    }
}

/**
 * This function Both initialize the plugin database in $gameSystem
 *  and clear the data in plugin database.
 *
 *  Note: $gameSystem will be serialized in the save file. To persist the
 *  data of plugin, it can be a good way.
 *  
 * @return {None}
 */
Craftlite.clearValidTable = function() {
    if (!$gameSystem.Craftlite) {
        $gameSystem.Craftlite = {};
    }
    $gameSystem.Craftlite.validTable = [];
}

/**
 * Make a craft rule valid for the player.
 * 
 * @param {Number} rid The unqie id for each craft rule.
 * @param {Boolean} status Valid or invalid.
 */
Craftlite.setValid = function(rid, status) {
    if (!$gameSystem.Craftlite) {
        Craftlite.clearValidTable();
    }
    if (!Craftlite.isValid(rid) && status) {
        $gameSystem.Craftlite.validTable.push(rid);
    }
    if (!status) {
        for (var i = $gameSystem.Craftlite.validTable.length - 1; i >= 0; i--) {
            if ($gameSystem.Craftlite.validTable[i] == rid) {
                $gameSystem.Craftlite.validTable.splice(i, 1);
                break;
            }
        }
    }
}

/**
 * @param  {Number}  rid The unique id for each craft rule.
 * @return {Boolean}     Whether it is valid.
 */
Craftlite.isValid = function(rid) {
    if (!$gameSystem.Craftlite) {
        Craftlite.clearValidTable();
    }
    for (var i = 0; i < $gameSystem.Craftlite.validTable.length; i++) {
        if (rid == $gameSystem.Craftlite.validTable[i]) {
            return (true);
        }
    }
    return (false);
}

/**
 * Get the craft rule by its id.
 * 
 * @param  {Number} rid The unique id for each craft rule.
 * @return {Object}     The craft rule object.
 * example: {rid:<rid>, materials:{<itemID>: <amount>, ...}, targetItems: {<itemID>: <amount>, ...}}
 */
Craftlite._getCraftRuleByID = function(rid) {
    for (var i = 0; i < $dataCraftLite.data.length; i++) {
        if (rid == $dataCraftLite.data[i].rid) {
            return ($dataCraftLite.data[i]);
        }
    }
}

/**
 * The error throwed when input a invalid itemID.
 * 
 * @param {Number} itemID The itemID in $dataItems
 * @extends {Error}
 */
Craftlite.InvalidItemError = function(itemID) {
    itemID = itemID || "[undefined]";
    this.name = 'Invalid Item ID';
    this.message = 'The itemID ' + itemID.toString() + ' is  Invalid';
    this.stack = (new Error()).stack;
}

Craftlite.InvalidItemError.prototype = Object.create(Error.prototype);
Craftlite.InvalidItemError.prototype.constructor = Craftlite.InvalidItemError;

/**
 * Craft an item by rule id
 * 
 * @param  {Number} rid The unique id for each craft rule.
 * @return {Boolean}     Whether crafting is a success or not.
 */
Craftlite.craftItem = function(rid) {
    if (Craftlite.isValid(rid)) {
        var rule = Craftlite._getCraftRuleByID(rid);
        return (Craftlite._craftItem(rule.materials, rule.targetItems));
    }
    return (false);
}

/**
 * Craft an item by given materials and target items.
 *
 * @private
 * @param  {Object} materials   An object that contains info of materials.
 *                                                e.g: {<itemID>: <amount>, ...}
 * @param  {Object} targetItems An object that contains info of target items.
 *                                                  e.g: {<itemID>: <amount>, ...}
 * @return {Boolean}             Whether crafting is a success or not.
 */
Craftlite._craftItem = function(materials, targetItems) {
    if (Craftlite._hasItems(materials)) {
        if (Craftlite._giveItems(targetItems)) {
            Craftlite._deleteItems(materials)
            return (true);
        } else {
            return (false);
        }
    } else {
        return (false);
    }
}

Craftlite._hasItems = function(items) {
    for (var item in items) {
        if (items.hasOwnProperty(item)) {
            Craftlite.validItemID(item);
            var hasItemNum = $gameParty._items[item] || 0;
            if (items[item] > hasItemNum) {
                return (false);
            }
        }
    }
    return (true);
}

Craftlite._deleteItems = function(items) {
    if (Craftlite._hasItems(items)) {
        for (var item in items) {
            if (items.hasOwnProperty(item)) {
                Craftlite.validItemID(item);
                if ($gameParty._items[item]) {
                    $gameParty._items[item] -= items[item];
                } else {
                    $gameParty._items[item] = 0;
                }
            }
        }
        return (true);
    } else {
        return (false);
    }
}

Craftlite._giveItems = function(items) {
    for (var item in items) {
        if (items.hasOwnProperty(item)) {
            Craftlite.validItemID(item);
            if (!$gameParty._items[item]) {
                $gameParty._items[item] = 0;
            }
            if ($gameParty._items[item] + items[item] > $gameParty.maxItems()) {
                return (false);
            }
        }
    }
    for (var item in items) {
        if (items.hasOwnProperty(item)) {
            $gameParty._items[item] += items[item];
        }
    }
    return (true);
}

Craftlite.validItemID = function(itemID) {
    if (itemID > $dataItems.length - 1) {
        throw new Craftlite.InvalidItemError(itemID);
    }
}

Craftlite.Scene = function() {
    this.initialize.apply(this, arguments);
}

Craftlite.Scene.prototype = Object.create(Scene_MenuBase.prototype);
Craftlite.Scene.prototype.constructor = Craftlite.Scene;

Craftlite.Scene.prototype.initialize = function() {
    Scene_MenuBase.prototype.initialize.call(this);
}

Craftlite.Scene.prototype.create = function() {
    Scene_MenuBase.prototype.create.call(this);
    this._WindowIndexRule = new Craftlite._WindowIndexRule(0, 100);
    this._WindowIndexRule.setHandler('cancel', this.popScene.bind(this));
    this._WindowIndexRule.setHandler('ok', this._WindowIndexRule.getCraftFunction());

    this._WindowMaterials = new Craftlite._WindowMaterials(Graphics.boxWidth / 3, 0);
    this._WindowTargets = new Craftlite._WindowTargets(Graphics.boxWidth / 3, Window_Base.prototype.lineHeight() * 11);
    this._WindowDesc = new Craftlite._WindowDescription(0, Graphics.boxHeight - 120);
    this._WindowTitle = new Craftlite._WindowTitle(0, 0);

    this._WindowIndexRule.setDescWindow(this._WindowDesc);
    this._WindowIndexRule.setMaterialWindow(this._WindowMaterials);
    this._WindowIndexRule.setTargetWindow(this._WindowTargets);

    this.addWindow(this._WindowIndexRule);
    this.addWindow(this._WindowMaterials);
    this.addWindow(this._WindowTargets);
    this.addWindow(this._WindowDesc);
    this.addWindow(this._WindowTitle);
}

Craftlite._WindowIndexRule = function() {
    this.initialize.apply(this, arguments);
}

Craftlite._WindowIndexRule.prototype = Object.create(Window_Selectable.prototype);
Craftlite._WindowIndexRule.prototype.constructor = Craftlite._WindowIndexRule;

Craftlite._WindowIndexRule.lastTopRow = 0;
Craftlite._WindowIndexRule.lastIndex = 0;

Craftlite._WindowIndexRule.prototype.initialize = function(x, y) {
    var width = Graphics.boxWidth / 3; // get the width of the window
    var height = Graphics.boxHeight - 200; // get the height of the window
    Window_Selectable.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
    this.setTopRow(Craftlite._WindowIndexRule.lastTopRow);
    this.select(Craftlite._WindowIndexRule.lastIndex);
    // to recover the status of EnemyBook Index to last version
    this.activate(); // make the select effective
}

Craftlite._WindowIndexRule.prototype.maxCols = function() {
    return(1);
}

Craftlite._WindowIndexRule.prototype.maxItems = function() {
    return(this._list ? this._list.length : 0);
}

Craftlite._WindowIndexRule.prototype.setDescWindow = function(descWindow) {
    this._descWindow = descWindow;
    this.updateDesc();
}

Craftlite._WindowIndexRule.prototype.setMaterialWindow = function(materialWindow) {
    this._materialWindow = materialWindow;
    this.updateMaterial();
}

Craftlite._WindowIndexRule.prototype.setTargetWindow = function(targetWindow) {
    this._targetWindow = targetWindow;
    this.updateTarget();
}

Craftlite._WindowIndexRule.prototype.select = function (index) {
    Window_Selectable.prototype.select.call(this, index);
    this.updateDesc();
    this.updateMaterial();
    this.updateTarget();
}

Craftlite._WindowIndexRule.prototype.updateDesc = function() {
    if (this._descWindow) {
        if (Craftlite.isValid(this._list[this.index()].rid)) {
            var descInfo = this._list[this.index()].desc;
            this._descWindow.setDesc(descInfo);
        } else {
            this._descWindow.setDesc(Craftlite.unknownData);
        }
    }
}

Craftlite._WindowIndexRule.prototype.updateMaterial = function() {
    if (this._materialWindow) {
        if (Craftlite.isValid(this._list[this.index()].rid)) {
            var materialInfo = this._list[this.index()].materials;
            this._materialWindow.setMaterial(materialInfo);
        } else {
            this._materialWindow.setMaterial({});
        }
    }
}

Craftlite._WindowIndexRule.prototype.updateTarget = function() {
    if (this._targetWindow) {
        if (Craftlite.isValid(this._list[this.index()].rid)) {
            var targetItemsInfo = this._list[this.index()].targetItems;
            this._targetWindow.setTarget(targetItemsInfo);
        } else {
            this._targetWindow.setTarget({});
        }
    }
}

Craftlite._WindowIndexRule.prototype.refresh = function() {
    this._list = [];
    // to storge all the craft rules
    // _list is provided by the Window_Selectable built-in system
    for (var i = 0; i < $dataCraftLite.data.length; i++) {
        var rule = $dataCraftLite.data[i];
        this._list.push(rule);
    }
    this.createContents();
    this.drawAllItems();
}

Craftlite._WindowIndexRule.prototype.drawItem = function(index) {
    var rule = this._list[index];
    var rect = this.itemRectForText(index);
    // give the x, y, width according to the index
    var name;
    if (Craftlite.isValid(rule.rid)) {
        name = rule.name;
    } else {
        name = Craftlite.unknownData;
    }
    this.drawText(name, rect.x, rect.y, rect.width);
}

Craftlite._WindowIndexRule.prototype.processCancel = function() {
    Window_Selectable.prototype.processCancel.call(this);
    Craftlite._WindowIndexRule.lastTopRow = this.topRow();
    Craftlite._WindowIndexRule.lastIndex = this.index();
    // record the history of indexBook
}

Craftlite._WindowIndexRule.prototype.getCraftFunction = function() {
    var indexWindow = this;
    return(function() {
        Craftlite.craftItem(indexWindow._list[indexWindow.index()].rid);
        indexWindow.updateMaterial();
        indexWindow.updateTarget();
        indexWindow.activate();
    });
}

Craftlite._WindowMaterials = function() {
    this.initialize.apply(this, arguments);
}

Craftlite._WindowMaterials.prototype = Object.create(Window_Base.prototype);
Craftlite._WindowMaterials.prototype.constructor = Craftlite._WindowMaterials;

Craftlite._WindowMaterials.prototype.initialize = function(x, y) {
    var width = Graphics.boxWidth / 3 * 2; // get the width of the window
    var height = this.lineHeight() * 11; // get the height of the window
    Window_Base.prototype.initialize.call(this, x, y, width, height);
}

Craftlite._WindowMaterials.prototype.setMaterial = function(material) {
    this._items = material;
    this.refresh();
}

Craftlite._WindowMaterials.prototype.refresh = function() {
    var item_obj = null;
    var required_num = 0;
    var current_num = 0;
    var sq = 1;
    var x = null;
    var y = null;

    this.contents.clear();

    for (var item in this._items) {
        if (this._items.hasOwnProperty(item)) {
            Craftlite.validItemID(item);

            x = this.textPadding();
            y = sq * (this.lineHeight() + 5);
            item_obj = $dataItems[item];

            this.drawItemName(item_obj, x, y, this.lineHeight());

            required_num = "-" + this._items[item].toString();
            current_num = ($gameParty._items[item] || 0).toString();

            var x1 = this.contents.width - this.textWidth(current_num);
            var x2 = x1 - this.textWidth("/")
            var x3 = x2 - this.textWidth(required_num);

            this.drawText(current_num, x1, y);
            this.drawText("/", x2, y);
            this.drawText(required_num, x3, y);

            var x4 = (this.contents.width - this.textWidth(Craftlite.menuMaterial)) / 2;
            var y4 = 0;

            this.drawText(Craftlite.menuMaterial, x4, y4);

            sq += 1;
        }
    }
}

Craftlite._WindowTargets = function() {
    this.initialize.apply(this, arguments);
}

Craftlite._WindowTargets.prototype = Object.create(Window_Base.prototype);
Craftlite._WindowTargets.prototype.constructor = Craftlite._WindowTargets;

Craftlite._WindowTargets.prototype.initialize = function(x, y) {
    var width = Graphics.boxWidth / 3 * 2; // get the width of the window
    var height = Graphics.boxHeight - 120 - this.lineHeight() * 11; // get the height of the window
    Window_Base.prototype.initialize.call(this, x, y, width, height);
}

Craftlite._WindowTargets.prototype.setTarget = function(targetItems) {
    this._targetItems = targetItems;
    this.refresh();
}

Craftlite._WindowTargets.prototype.refresh = function() {
    var item_obj = null;
    var target_num = 0;
    var current_num = 0;
    var sq = 0;
    var x = null;
    var y = null;

    this.contents.clear();

    for (var item in this._targetItems) {
        if (this._targetItems.hasOwnProperty(item)) {
            Craftlite.validItemID(item);

            x = this.textPadding();
            y = sq * (this.lineHeight() + 5);
            item_obj = $dataItems[item];

            this.drawItemName(item_obj, x, y, this.lineHeight());

            target_num = "+" + this._targetItems[item].toString();
            current_num = ($gameParty._items[item] || 0).toString();

            var x1 = this.contents.width - this.textWidth(current_num);
            var x2 = x1 - this.textWidth("/")
            var x3 = x2 - this.textWidth(target_num);

            this.drawText(current_num, x1, y);
            this.drawText("/", x2, y);
            this.drawText(target_num, x3, y);

            sq += 1;
        }
    }
}

Craftlite._WindowDescription = function() {
    this.initialize.apply(this, arguments);
}

Craftlite._WindowDescription.prototype = Object.create(Window_Base.prototype);
Craftlite._WindowDescription.prototype.constructor = Craftlite._WindowDescription;

Craftlite._WindowDescription.prototype.initialize = function(x, y) {
    var width = Graphics.boxWidth; // get the width of the window
    var height = 120; // get the height of the window
    Window_Base.prototype.initialize.call(this, x, y, width, height);
}

Craftlite._WindowDescription.prototype.setDesc = function(desc) {
    this._desc = desc;
    this.refresh();
}

Craftlite._WindowDescription.prototype.refresh = function() {
    this.contents.clear();
    var x = this.textPadding();
    var y = (this.contents.height - this.lineHeight()) / 2;
    this.drawText(this._desc, x, y);
}

Craftlite._WindowTitle = function() {
    this.initialize.apply(this, arguments);
}

Craftlite._WindowTitle.prototype = Object.create(Window_Base.prototype);
Craftlite._WindowTitle.prototype.constructor = Craftlite._WindowDescription;

Craftlite._WindowTitle.prototype.initialize = function(x, y) {
    var width = Graphics.boxWidth / 3; // get the width of the window
    var height = 100; // get the height of the window
    Window_Base.prototype.initialize.call(this, x, y, width, height);
    this.refresh();
}

Craftlite._WindowTitle.prototype.refresh = function() {
    var x = (this.contents.width - this.textWidth(Craftlite.menuTitle)) / 2;
    var y = (this.contents.height - this.lineHeight()) / 2;
    this.drawText(Craftlite.menuTitle, x, y);
}