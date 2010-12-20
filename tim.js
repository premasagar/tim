/*!
* Tim
*   github.com/premasagar/tim
*
*//*
    A tiny, secure JavaScript micro-templating script.
*//*

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php

    **

    creates global object
        tim

    **
        
    v0.3.0
        
*//*global window */

var tim = (function createTim(settings){
    "use strict";
    
    settings = settings || {};
    var start = settings.start || "{{",
        end   = settings.end   || "}}",
        path  = settings.path  || "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
        templates = settings.templates || {},
        pattern = new RegExp(start + "\\s*("+ path +")\\s*" + end, "gi"),
        isFirstRun = 1,
        initFunctions = [],
        undef;
    
    // Allow plugins to initialise on first run
    function initPlugin(fn){
        initFunctions.push(fn);
        return fn;
    }
    
    // On first run, call plugin init functions
    function firstRunInit(){
        isFirstRun = 0;
        
        for(var i = 0, len = initFunctions.length; i < len; i++){
            initFunctions[i]();
        }
    }
    
    // Get and set to the templates cache object
    function templateCache(key, value){
        var t;
    
        switch (typeof key){
            case "string":
                if (value === undef){
                    return templates[key];
                }
                templates[key] = value;
            break;
            
            case "undefined":
            return templates;
            
            case "object":
                for (t in key){
                    if (key.hasOwnProperty(t)){
                        templates[t] = key[t];
                    }
                }
            break;
        }
    }
    
    // Main function
    function tim(template, data){
        if (isFirstRun){
            firstRunInit();
        }
    
        switch(typeof template){            
            case "string":
            // Cache a new template
            if (typeof data === "string"){
                return templateCache(template, data);
            }
            
            // No template tags found in template
            if (template.indexOf(start) < 0){
                // Is this a key for a cached template?
                template = templateCache(template);
                                
                if (!template || data === undef){
                    return template;
                }
            }
            
            // Merge data into the template string
            return template.replace(pattern, function(tag, ref){
                var path = ref.split("."),
                    len = path.length,
                    dataLookup = data,
                    i = 0;

                for (; i < len; i++){
                    dataLookup = dataLookup[path[i]];
                    
                    // Property not found
                    if (dataLookup === undef){
                        throw "tim: '" + path[i] + "' not found in " + tag;
                    }
                    
                    // Return the required value
                    if (i === len - 1){
                        return dataLookup;
                    }
                }
            });
            
            case "undefined":
            // Return cached templates
            return templateCache();
            
            case "object":
            // Create new Tim function, based on new settings
            return createTim(template);
        }
    }
    
    // Settings object. Should be considered read-only. If you need to change the settings, create a new Tim function, e.g. tim = tim({attr:"id"});
    tim.settings = settings;
    
    // Allow plugins to set an init handler that is called on first run
    tim.init = initPlugin;
    
    /////
    
    // Dom plugin: finds micro-templates in <script>'s in the DOM
    // Can be removed if unneeded - e.g. with server-side JS
    // Default: <script type="text/tim" class="foo">{{TEMPLATE}}</script>
    tim.dom = initPlugin(function(domSettings){
        domSettings = domSettings || {};
        
        var type = domSettings.type || settings.type || "text/tim",
            attr = domSettings.attr || settings.attr || "class",
            document = window.document,
            hasQuery = !!document.querySelectorAll,
            elements = hasQuery ?
                document.querySelectorAll(
                    "script[type='" + type + "']"
                ) :
                document.getElementsByTagName("script"),
            i = elements.length,
            elem, attrValue;
            
        for (; i; i--){
            elem = elements[i-1];
            attrValue = elem.getAttribute(attr);
            if (attrValue && hasQuery || elements[elem.type] === type){
                tim(attrValue, elem.innerHTML);
            }
        }
    });
    
    return tim;
}());

/*jslint browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
