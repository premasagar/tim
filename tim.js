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
        
    v0.2
        
*/

var tim = (function(){
    var starts  = "{{",
        ends    = "}}",
        path    = "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
        pattern = new RegExp(starts + "("+ path +")" + ends, "gi"),
        undef;
    
    return function(template, data, notFound){
        // Merge the data into the template string
        return template.replace(pattern, function(tag, ref){
            var path = ref.split("."),
                len = path.length,
                lookup = data,
                i = 0;

            for (; i < len; i++){
                lookup = lookup[path[i]];
                
                // Error handling for when the property is not found
                if (lookup === undef){
                    // If specified, substitute with the "not found" arg
                    if (notFound !== undef){
                        return notFound;
                    }
                    // Throw error
                    throw "tim: '" + path[i] + "' not found in " + tag;
                }
                
                // Success! Return the required value
                if (i === len - 1){
                    return lookup;
                }
            }
        });
    };
}());
