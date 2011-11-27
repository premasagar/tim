/*!
* Tim
*   github.com/premasagar/tim
*
*//*
    An extensible JavaScript micro-templating library.
*//*

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php

    **

    creates global object
        tim

    **

    v0.5.0

*/

var tim = (function(Pluggables){
    "use strict";
    
    // ADD / REMOVE PLUGINS
    
    // add
    function addPluginFn(collectionName){
        return function bind(eventType, callback, options){
            this[collectionName].type(eventType, this.extend({
                fn: callback,
                context: this
            }, options));
            
            return this;
        };
    }
    
    // remove
    function removePluginFn(collectionName){
        return function(eventType, callback){
            var types = this[collectionName].types;
        
            if (types){
                if (callback){
                    if (types[eventType]){
                        types[eventType].remove(callback);
                    }
                }
                // No callback supplied -> remove all plugins of eventType
                else {
                    delete types[eventType];
                }
            }
            return this;
        };
    }
    
    
    // For subscribing to an event
    var bind = addPluginFn("listeners"),
        unbind = removePluginFn("listeners"),
        
    // For manipulating templates, objects, etc
        plugin = addPluginFn("plugins"),
        removePlugin = removePluginFn("plugins");
    
    /////
    
    // EXECUTE PLUGINS
    
    // Trigger an event (additional arg: payload data, optional)
    // Returns `tim` object
    function trigger(eventType, payload){
        var types = this.listeners.types,
            listeners = types && types[eventType];
        
        if (listeners){
            listeners.trigger(payload);
        }
        return this;
    }
    
    // Transform a payload, on a specific event
    // Returns the transformed payload
    function parse(eventType, toTransform /* , ... arbitrary number of args ... */){
        var types = this.plugins.types,
            plugins = types && types[eventType],
            subset, args;
        
        if (plugins){
            args = this.toArray(arguments, 1);
            subset = plugins.filter(toTransform);
            toTransform = subset.transform.apply(subset, args);
        }
        return toTransform;
    }
        
    // Parse template with parser plugins
    function parseTemplate(template, data){
        var payload = {template:template, data:data};
    
        this.trigger("parseStart", payload);
        
        // Pass template and data through parser plugins
        // `payload.template` is set so that it is available to `this.trigger("parseEnd")`
        template = payload.template = this.parse("template", template, data, payload);
        
        this.trigger("parseEnd", payload);
        
        return template;
    }
    
    // Initialise Tim on first use of `tim(template, data)`
    function init(template, data){
        // Change the function used for `tim.parseTemplate`
        this.parseTemplate = parseTemplate;
        
        // init
        this.initialized = true;
        
        // `ready` event
        this.trigger("ready")
            // Discard `ready` listeners; the event will not fire again
            .unbind("ready");
        
        // Parse the first template
        return tim.parseTemplate(template, data);
    }
    
    /////
    
    // Tim's public API
    var api = {
        // Core settings
        startToken: "{{",
        endToken: "}}",
        
        // Create plugins
        bind: bind,
        plugin: plugin,
        
        /*
        // Created on Tim construction - see `create()`
        listeners: new Pluggables(),
        plugins: new Pluggables(),
        */
        
        // Execute plugins
        trigger: trigger,
        parse: parse, // previously called `filter`
        parseTemplate: init, // this later gets replaced with `parseTemplate`
        
        // Remove plugins
        unbind: unbind,
        removePlugin: removePlugin,

        // Advanced                
        create: create, // create a new instance of Tim
        
        // utils
        extend:  Pluggables.extend,
        isArray: Pluggables.isArray,
        toArray: Pluggables.toArray
    };

    /////
    
    // Create a new instance of Tim
    function create(options){
        var instanceProps = {
            listeners:  new Pluggables(),
            plugins: new Pluggables()
        };
    
        function tim(template, data){
            return tim.parseTemplate(template, data);
        }
        Pluggables.extend(tim, api, instanceProps, options);

        return tim;
    }
    
    // Return a new instance of Tim to the outer variable
    return create();
    
}(this.Pluggables));


/////

// PLUGINS

// Top-level token-matching regex
tim.bind("ready",
    function(){
        this.pattern = new RegExp(
            this.startToken +
            "\\s*((?:.(?!" +
            this.endToken +
            "))*.?)\\s*" +
            this.endToken,
            "gi"
        );
    },
    {priority:100}
);

// Enclosing template tags - e.g. "{{foo}} bar {{/foo}}" - (top-level parser)
tim.plugin("template", function(template, data, payload){
    var pattern = this.pattern, 
        count = {}, currentCount, tagName, result, token, replacement, subtemplate, subdata;
    
    // Cycle through singular template tags
    while((result = pattern.exec(template)) !== null){    
        token = result[1];
        currentCount = count[token] || 0;
        
        // Determine if this an opening tag or a closing tag
        // Open tag
        if (token[1] !== "/"){
            tagName = token;
            currentCount ++;
        }
        // Close tag
        else {
            tagName = token.slice(1);
            currentCount --;
        }
        
        // Update counter
        count[token] = currentCount;
        
        if (!currentCount){
            subtemplate = template.slice(result.index, pattern.lastIndex);
        
            replacement = tim(subtemplate, subdata, payload);
        
            // Splice the replacement into the template, if a transformation has been made
            if (replacement !== token){
                template = template.slice(0, result.index) + replacement + template.slice(pattern.lastIndex);
                pattern.lastIndex += (replacement.length - result[0].length);
            }
        }
    }
    
    return template;
});

// Singular template tags (top-level parser)
tim.plugin("template", function(template, data, payload){
    var pattern = this.pattern,
        result, token, replacement;
    
    while((result = pattern.exec(template)) !== null){    
        token = result[1];
        replacement = this.parse("token", token, data, payload);
        
        if (replacement !== token){
            template = template.slice(0, result.index) + replacement + template.slice(pattern.lastIndex);
            pattern.lastIndex += (replacement.length - result[0].length);
        }
    }
    
    return template;
});


/////


// Basic data substitution (does not support dot-syntax)
tim.plugin("token", function(token, data){
    if (token in data){
        return data[token];
    }
});

// Data substitution, allowing dot-syntax (to achieve this behaviour on its own, use tinytim.js)
tim.plugin("token", function(token, data){
    var path = token.split("."),
        len = path.length,
        lookup = data,
        i = 0;

    for (; i < len; i++){
        lookup = lookup[path[i]];
        
        // Property not found
        if (typeof lookup === "undefined"){
            // Trigger an event for other plugins
            this.trigger("fail", token, data);
            return;
        }
        // Property found
        if (i === len - 1){
            // Trigger an event for other plugins
            this.trigger("success", token, data, lookup);
            return lookup;
        }
    }
}, {match:/^\s*[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\s*$/});


// Foobar
tim.plugin(
    "token",
    
    // token === ":foobar"
    // arguments includes the partial tokens matched by the regex (the same sequence as expected from `token.match(regex)`
    function(token, data, payload, regexMatch, fooBackref, barBackref){
        return "***" + fooBackref + "~" + barBackref + "***";
    },
    
    {match: /:(foo)(bar)/}
);



// EVENT BINDINGS

// See browser console
tim.bind("ready", function(data){
    console.log("Tim ready");
});

/*
//TODO: reinstate "all" (or `true`) event binding, to be called in all cases
tim.bind(true, function(eventType){
    console.log("event: " + eventType);
});
*/


    
console.log(
    tim("{{foo}} {{bar}} {{:foobar}} {{deep.foo}}",
        {
            foo:"MOO",
            bar:"BAA",
            deep:{
                foo:"bling"
            }
        }
    )
);
