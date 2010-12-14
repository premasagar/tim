"use strict";

/*!
* Tim
*   github.com/premasagar/tim
*
*//*
    A tiny, secure JavaScript micro-templating script.

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php

    **

    creates global object
        tim

    **
        
    v0.3.0
        
*/

var tim = (function(){
    var start  = "{{",
        end    = "}}",
        path    = "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
        pattern = new RegExp(start + "("+ path +")" + end, "gi"),
        type = "text/tim",
        attr = "className",
        templates,
        undef;
        
    function getTemplate(key){
        var document = window.document,
            elements, elem, i, hasQuerySelector, attrValue;
    
        // Cache templates - can be forced with boolean true as arg
        if (!templates || key === true){
            templates = {};
            hasQuerySelector = !!document.querySelectorAll;
        
            elements = hasQuerySelector ?
                document.querySelectorAll("script[type='" + type + "']") :
                document.getElementsByTagName("script");
                
            for (i = elements.length; i; i--){
                elem = elements[i-1];
                attrValue = elem.getAttribute(attr);
                if (attrValue && hasQuerySelector || elements[elem.type] === type){
                    templates[attrValue] = elem.innerHTML;
                }
            }
        }
        return typeof key === "string" ? templates[key] : templates;
    }
    
    function tim(template, data){
        var settings, templateLookup;
        
        switch(typeof template){
            case "object":
                settings = template;
                if (settings.start){
                    start = settings.start;
                }
                if (settings.end){
                    end = settings.end;
                }
                if (settings.path){
                    path = settings.path;
                }
                if (settings.type){
                    type = settings.type;
                }
                if (settings.attr){
                    attr = settings.attr;
                }
                pattern = new RegExp(start + "("+ path +")" + end, "gi");
            return tim(true);
            
            case "undefined":
            return getTemplate();
            
            case "boolean":
            return getTemplate(template); // if true, then template will re-cache from DOM
            
            case "string":
            // Set new template
            if (typeof data === "string"){
                templates[template] = data;
                return getTemplate();
            }
            
            // When no template tags are found in template, use as identifier for template in HTML script element
            if (template.indexOf(start) < 0){
                templateLookup = getTemplate(template);
                if (templateLookup){
                    template = templateLookup;
                    
                    // A lookup on an HTML template
                    if (typeof data === "undefined"){
                        return template;
                    }
                }
                else {
                    // No template tags, no HTML template found. Just return.
                    return template;
                }
            }
            
            // Merge the data into the template string
            return template.replace(pattern, function(tag, ref){
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
        }
    }       
    return tim;
}());
