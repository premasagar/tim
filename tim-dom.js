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

var tim = (function init(settings){
    "use strict";
    
    settings = settings || {};
    var start = settings.start || "{{",
        end   = settings.end   || "}}",
        path  = settings.path  || "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
        _templateCache = settings.templates || {},
        pattern = new RegExp(start + "(\\s*("+ path +")\\s*)" + end, "gi"),
        undef;
    
    function templateCache(key, value){
        var t;
    
        switch (typeof key){
            case "string":
                if (typeof value === "undefined"){
                    return _templateCache[key];
                }
                _templateCache[key] = value;
            break;
            
            case "undefined":
            return _templateCache;
            
            case "object":
                for (t in key){
                    if (key.hasOwnProperty(t)){
                        _templateCache[t] = key[t];
                    }
                }
            break;
        }
    }
    
    function tim(template, data){
        switch(typeof template){            
            case "string":
            // Set new template
            if (typeof data === "string"){
                return templateCache(template, data);
            }
            
            // When no template tags are found in template, use as identifier for template in HTML script element
            if (template.indexOf(start) < 0){
                template = templateCache(template);
                
                if (!template){
                    return "";
                }
                                   
                // Lookup a cached template
                if (typeof data === "undefined"){
                    return template;
                }
            }
            
            // Merge the data into the template string
            return template.replace(pattern, function(tag, match, ref){
                var path = ref.split("."),
                    len = path.length,
                    dataLookup = data,
                    i = 0;

                for (; i < len; i++){
                    dataLookup = dataLookup[path[i]];
                    
                    // Error handling for when the property is not found
                    if (dataLookup === undef){
                        // Throw error
                        throw "tim: '" + path[i] + "' not found in " + tag;
                    }
                    
                    // Success! Return the required value
                    if (i === len - 1){
                        return dataLookup;
                    }
                }
            });
            
            case "undefined":
            return templateCache();
            
            case "object":
            return init(template);
        }
    }
    tim.settings = settings;
    
    tim.fromDom = function(domSettings){
        domSettings = domSettings || {};
        
        var type = domSettings.type || tim.settings.type || "text/tim",
            attr = domSettings.attr || tim.settings.attr || "class",
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
    };
    
    return tim;
}());

/*jslint browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
