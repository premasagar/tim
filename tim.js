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

/*
    TODO:
    * a way to prevent a delimiter (e.g. ", ") appearing last in a loop template
    * Sorted constructor for auto-sorting arrays - used for parsers -> two parsers are added, one for identifying and parsing single-tokens and one for open/close tokens - the parsers then create two new Sorted instance, one for single-token plugins and one for open/close token plugins
*/

(function(name, definition, context) {
    if (typeof module != 'undefined' && module.exports) {
        module.exports = definition();
    } else if (typeof context['define'] == 'function' && context['define']['amd']) {
        define(definition);
    } else {
        context[name] = definition();
    }
})('tim', function() {

    var tim = (function createTim(initSettings){
        "use strict";
        
        var settings = {
                start: "{{",
                end  : "}}",
                path : "[a-z0-9_$][\\.a-z0-9_]*" // e.g. config.person.name
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
        
        function extend(obj1, obj2){
            var key;
            for (key in obj2){
                if (obj2.hasOwnProperty(key)){
                    obj1[key] = obj2[key];
                }
            }
            return obj1;
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
                args, i, len, substituted;
                
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
                    substituted = fns[i][0].apply(null, args);
                    if (payload !== undef && substituted !== undef){
                        payload = substituted;
                    }
                    if (substituted === null){
                        payload = '';
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
                .apply(null, arguments);
        }
        filter.stop = function(){
            stopThisFilter = true;
        };
        
        
        /////
        
        
        // Merge data into template
        /*  
            // simpler alternative, without support for iteration:
            template = template.replace(pattern, function(tag, token){
                return applyFilter("token", token, data, template);
            });
        */
        // TODO: all an array to be passed to tim(), so that the template is called for each element in it
        function substitute(template, data){
            var match, tag, token, substituted, startPos, endPos, templateStart, templateEnd, subTemplate, closeToken, closePos, key, loopData, loop;
        
            while((match = pattern.exec(template)) !== null) {
                token = match[1];
                substituted = applyFilter("token", token, data, template);
                startPos = match.index;
                endPos = pattern.lastIndex;
                templateStart = template.slice(0, startPos);
                templateEnd = template.slice(endPos);
                
                // If the final value is a function call it and use the returned
                // value in its place.
                if (typeof substituted === "function") {
                    substituted = substituted.call(data);
                }
                
                if (typeof substituted !== "boolean" && typeof substituted !== "object"){
                    template = templateStart + substituted + templateEnd;
                } else {
                    subTemplate = "";
                    closeToken = settings.start + "/" + token + settings.end;
                    closePos = templateEnd.indexOf(closeToken);
                    
                    if (closePos >= 0){
                        templateEnd = templateEnd.slice(0, closePos);
                        if (typeof substituted === "boolean") {
                            subTemplate = substituted ? templateEnd : '';
                        } else {
                            for (key in substituted){
                                if (substituted.hasOwnProperty(key)){
                                    pattern.lastIndex = 0;
                                
                                    // Allow {{_key}} and {{_content}} in templates
                                    loopData = extend({_key:key, _content:substituted[key]}, substituted[key]);
                                    loopData = applyFilter("loopData", loopData, loop, token);
                                    loop = tim(templateEnd, loopData);
                                    subTemplate += applyFilter("loop", loop, token, loopData);
                                }
                            }
                            subTemplate = applyFilter("loopEnd", subTemplate, token, loopData);
                        }
                        template = templateStart + subTemplate + template.slice(endPos + templateEnd.length + closeToken.length);
                    }
                    else {
                        throw "tim: '" + token + "' not closed";
                    }
                }
                
                pattern.lastIndex = 0;
            }
            return template;
        }
        
        
        // TIM - MAIN FUNCTION
        function tim(template, data){
            var templateLookup;
        
            // On first run, call init plugins
            if (!initialized){
                initialized = 1;        
                applyFilter("init");
            }
            template = applyFilter("templateBefore", template);
        
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
                template = substitute(template, data);
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
        
        // Add new filters and trigger existing ones. Use tim.filter.stop() during processing, if required.
        tim.filter = filter;
        
        
        /////
        
        
        // dotSyntax default plugin: uses dot syntax to parse a data object for substitutions
        addFilter("token", function(token, data, tag){
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
                    // Cannot access "class" using el.getAttribute()
                    key = attr === "class" ? elem.className : elem.getAttribute(attr);
                    if (key && (hasQuery || elem.type === type)){
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

    return tim;

}, this);

/*jslint browser: true, onevar: true, undef: true, eqeqeq: true, bitwise: true, regexp: true, newcap: true, immed: true, strict: true */
