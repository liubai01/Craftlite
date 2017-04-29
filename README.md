# Craftlite

### liubai01, 2017.4.29



### Introduction

Craftlite is a lightweight plugin of [RPGMakerMV](http://www.rpgmakerweb.com/products/programs/rpg-maker-mv). With it, you can design your own recipe list easily.

![Logo](https://github.com/liubai01/Craftlite/raw/master/images/Craftlite.png)

### Getting started

To make the plugin work, please follow these steps to install this plugin:

1. Download `Craftlite.json` & `Craftlite.js` in the version you need.
2. Copy `Craftlite.json` to `{%Your project directory%}\data\`
3. Copy `Craftlite.js` to `{%Your project directory%}\js\plugins`
4. Enable this plugin in RPGMakerMV editor.

*If you feel puzzle about step 4, please press "F1" in editor for help*

Run the plugin command "Craftlite open". If you enter the menu of a craft table, your plugin has been successfully installed.



### Some terms

- Craft table: a collection of craft rules
- Craft rules: a craft rule includes materials, target items, rid. Player consume materials to make target items.
- rid: each craft rules should have its unique id. It helps the plugin to manage the rules.



### Setup your own craft rule

Add an element as a craft rule in `Craftlite.json`, its format looked like this.

```json
{
    "data": [
        {
            "rid": <rid>,
            "name": "<name for this craft rule>",
            "materials": {
                "<itemID>": <amount>
            },
            "targetItems": {
                "<itemID>": <amount>
            },
            "desc": "<description for this craft rule>"
        },
      ...
    ]
}
```

Here is the example:

```json
{
    "data": [
        {
            "rid": 0,
            "name": "Black Magic 01",
            "materials": {
                "1": 1
            },
            "targetItems": {
                "1": 2
            },
            "desc": "Craft two from one! Black magic~"
        },
        {
            "rid": 1,
            "name": "Black Magic 02",
            "materials": {
                "1": 1,
                "2": 1
            },
            "targetItems": {
                "1": 3
            },
            "desc": "Craft three from two! Can be good... urg?"
        }
    ]
}
```

### Plugin compatibility

I only test this plugin on the RPGMakerMV v.1.0.1. It will be tested on the other versions sooner or later.