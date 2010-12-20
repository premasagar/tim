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
        
    v0.2.1
        
*/

var tim = (function(){
    "use strict";

    var start  = "{{",
        end    = "}}",
        path    = "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
        pattern = new RegExp(start + "\\s*("+ path +")\\s*" + end, "gi"),
        undef;
    
    return function(template, data){
        // Merge data into the template string
        return template.replace(pattern, function(tag, ref){
            var path = ref.split("."),
                len = path.length,
                lookup = data,
                i = 0;

            for (; i < len; i++){
                lookup = lookup[path[i]];
                
                // Property not found
                if (lookup === undef){
                    throw "tim: '" + path[i] + "' not found in " + tag;
                }
                
                // Return the required value
                if (i === len - 1){
                    return lookup;
                }
            }
        });
    };
}());
