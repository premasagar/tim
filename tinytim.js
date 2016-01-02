/*!
* Tim (lite)
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

    var tim = (function(){
        "use strict";

        var start   = "{{",
            end     = "}}",
            allowed = "mod|even|odd",
            path    = "[a-z0-9_$][\\.a-z0-9_]*", // e.g. config.person.name
            pattern = new RegExp(start + "\\s*("+ path +")\\s*" + end, "gi"),
            functions = new RegExp( start + "\\s*@(" + allowed + ")\\s*(\\d+)*\\s*" + end + "([\\s\\S]+?)" + start + "\\s*@end(\\1)\\s*" + end , "gi"),
            undef;
        
        return function(template, data, index){
            // Interpret allowed function tags in the templates
            template = template.replace(functions,function(match, tag, criteria, content){
                switch(tag.toLowerCase()) {
                    case 'even':
                        return ( index % 2 === 0 ) ? content : '';
                    case 'odd':
                        return ( index % 2 === 1 ) ? content : '';
                    case 'mod':
                        return ( index % criteria === 0 ) ? content : '';
                }
                return '' // should never get here but just in case;
            });
            // Merge data into the template string
            return template.replace(pattern, function(tag, token){
                var path = token.split("."),
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

    return tim;

}, this);
