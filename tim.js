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

var tim = (function createTim(initSettings){
    "use strict";
    
    var settings = {
            start: "{{",
            end  : "}}",
            path : "[a-z0-9_][\\.a-z0-9_]*" // e.g. config.person.name
        },
        templates = {},
        filters = {},
        stopThisFilter, pattern, initialized, undef;
        
        
    /////
    

    // Update cached regex pattern
    function patternCache(){
        pattern = new RegExp(settings.start + "\\s*("+ settings.path +")\\s*" + settings.end, "gi");
    }
    
    // settingsCache: Get and set settings
    /*
        Example usage:
        settingsCache(); // get settings object
        settingsCache({start:"<%", end:"%>", attr:"id"}); // set new settings
    */
    function settingsCache(newSettings){
        var s;
    
        if (newSettings){
            for (s in newSettings){
                if (newSettings.hasOwnProperty(s)){
                    settings[s] = newSettings[s];
                }
            }
            patternCache();
        }
        return settings;
    }
        
    // Apply custom settings
    if (initSettings){
        settingsCache(initSettings);
    }
    else {
        patternCache();
    }
    
    
    /////
    
    
    // templatesCache: Get and set the templates cache object
    /*
        Example usage:
        templatesCache("foo"); // get template named "foo"
        templatesCache("foo", "bar"); // set template named "foo" to "bar"
        templatesCache("foo", false); // delete template named "foo"
        templatesCache({foo:"bar", blah:false}); // set multiple templates
        templatesCache(false); // delete all templates
    */
    function templatesCache(key, value){
        var t;
    
        switch (typeof key){
            case "string":
                if (value === undef){
                    return templates[key] || "";
                }
                else if (value === false){
                    delete templates[key];
                }
                else {
                    templates[key] = value;
                }
            break;
            
            case "object":
                for (t in key){
                    if (key.hasOwnProperty(t)){
                        templatesCache(t, key[t]);
                    }
                }
            break;
            
            case "boolean":
            if (!key){
                templates = {};
            }
            break;
        }
        return templates;
    }
    
    
    /////
    
    
    // FILTERS    
    function sortByPriority(a, b){
        return a[1] - b[1];
    }
    
    // Add filter to the stack
    function addFilter(filterName, fn, priority){
        var fns = filters[filterName];
        if (!fns){
            fns = filters[filterName] = [];
        }
        fns.push([fn, priority || 0]);
        fns.sort(sortByPriority);
        return fn;
    }
    
    function applyFilter(filterName, payload){
        var fns = filters[filterName],
            args, i, len, response;
            
        if (fns){
            args = [payload];
            i = 2;
            len = arguments.length;            
            for (; i < len; i++){
                args.push(arguments[i]);
            }
            
            i = 0;
            len = fns.length;
            for (; i < len; i++){
                args[0] = payload;
                response = fns[i][0].apply(this, args);
                if (payload !== undef && response !== undef){
                    payload = response;
                }
                if (stopThisFilter){
                    stopThisFilter = false;
                    break;
                }
            }
        }
        return payload;
    }
    
    // Router for adding and applying filters, for Tim API
    function filter(filterName, payload){
        return (typeof payload === "function" ? addFilter : applyFilter)
            .apply(this, arguments);
    }
    filter.stop = function(){
        stopThisFilter = true;
    };
    
    
    /////
    
    
    // Wrapper function
    function tim(template, data){
        var templateLookup;
    
        // On first run, call init plugins
        if (!initialized){
            initialized = 1;        
            applyFilter("init");
        }
    
        // No template tags found in template
        if (template.indexOf(settings.start) < 0){
            // Is this a key for a cached template?
            templateLookup = templatesCache(template);
            if (templateLookup){
                template = templateLookup;
            }
        }
        template = applyFilter("template", template);
        
        // Substitute tokens in template
        if (template && data !== undef){
            template = template.replace(pattern, function(tag, token){
                return applyFilter("token", token, data, template);
            });
        }
        
        template = applyFilter("templateAfter", template);
        return template;
    }
    
    // Get and set settings, e.g. tim({attr:"id"});
    tim.settings = settingsCache;
    
    // Get and set cached templates
    tim.templates = templatesCache;
    
    // Create new Tim function, based on supplied settings, if any
    tim.parser = createTim;
    
    // Add new filters and trigger existing ones
    tim.filter = filter;
    
    
    /////
    
    
    // dotSyntax default plugin: uses dot syntax to parse a data object for substitutions
    addFilter("token", function(token, data, template){
        var path = token.split("."),
            len = path.length,
            dataLookup = data,
            i = 0;

        for (; i < len; i++){
            dataLookup = dataLookup[path[i]];
            
            // Property not found
            if (dataLookup === undef){
                throw "tim: '" + path[i] + "' not found" + (i ? " in " + tag : "");
            }
            
            // Return the required value
            if (i === len - 1){
                return dataLookup;
            }
        }
    });
    
    
    /////
    
    
    // Dom plugin: finds micro-templates in <script>'s in the DOM
    // This block of code can be removed if unneeded - e.g. with server-side JS
    // Default: <script type="text/tim" class="foo">{{TEMPLATE}}</script>
    if (window && window.document){
        tim.dom = function(domSettings){
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
                i = 0,
                len = elements.length,
                elem, key,
                templatesInDom = {};
                
            for (; i < len; i++){
                elem = elements[i];
                key = elem.getAttribute(attr);
                if (key && hasQuery || elements[elem.type] === type){
                    templatesInDom[key] = elem.innerHTML;
                }
            }
            
            templatesCache(templatesInDom);
            return templatesInDom;
        };
        
        addFilter("init", function(){
            tim.dom();
        });
    }
    
    return tim;
}());

/*jslint browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
