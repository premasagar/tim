/*!
* Tim (lite, cached)
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
        
    v0.3.1
        
*/

var tim = (function(){
    "use strict";

    var start   = "{{",
        end     = "}}",
        path    = "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
        pattern = new RegExp(start + "\\s*("+ path +")\\s*" + end, "gi"),
        cache   = {},
        JSON    = window.JSON,
        undef;
    
    function tim(template, data){
        // Merge data into the template string
        return template.replace(pattern, function(tag, token){
            var path = token.split("."),
                len = path.length,
                lookup = data,
                i = 0;

            for (; i < len; i++){
                lookup = lookup[path[i]];
                
                // Property not found
                /*
                if (lookup === undef){
                    throw "tim: '" + path[i] + "' not found in " + tag;
                }
                */
                
                // Return the required value
                if (i === len - 1){
                    return lookup;
                }
            }
        });
    }
    
    return JSON ?
        function(template, data){
            var stringified  = JSON.stringify(data), // NOTE: requires stringifiable data
                cachedResult = cache[template] && cache[template][stringified];
                
            if (cachedResult){
                return cachedResult;
            }
            if (!cache[template]){
                cache[template] = {};
            }
            cachedResult = cache[template][stringified] = tim(template, data);
            return cachedResult;
        } : tim;
}());
