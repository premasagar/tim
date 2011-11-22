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
    
    // CREATE PLUGINS
    
    // For subscribing to an event
    function bind(eventType, callback, context){
        this.events.group(eventType, {
            fn: callback,
            context: context || this
        });
        return this;
    }
    
    // For manipulating templates, objects, etc
    function plugin(eventType, callback, pattern, context){
        var plugin = {
            fn: callback,
            context: context || this
        };
        // `pattern` is a RegExp
        if (pattern){
            plugin.match = pattern;
        }
        this.parsers.group(eventType, plugin);
        
        return this;
    }
    
    /////
    
    // EXECUTE PLUGINS
    
    // Trigger an event (additional arg: payload data, optional)
    // Returns `tim` object
    function trigger(eventType, payload){
        var plugins = this.events.groups && this.events.groups[eventType];
        
        if (plugins){
            plugins.trigger(payload);
        }
        return this;
    }
    
    // Transform a payload, on a specific event
    // Returns the transformed payload
    function parse(eventType, toTransform /* , ... arbitrary number of args ... */){
        var groups = this.parsers.groups,
            plugins = groups && groups[eventType],
            subset, args;
        
        if (plugins){
            args = this.toArray(arguments, 1);
            // Add boolean `stopOnFirstTransform` flag to `plugins.transform`
            // TODO: devise a better approach for getting `plugins.transform` to execute only once, when the first transform has been applied
            args.unshift(true);
            
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
        tim.parseTemplate = parseTemplate;
        
        // init
        tim.initialized = true;
        
        // `ready` event
        tim.trigger("ready");
        
        // Parse the first template
        return tim.parseTemplate(template, data);
    }
    
    /////
    
    // REMOVE PLUGINS
    
    function removePluginFn(collectionName){
        return function(eventType, callback){
            var groups = this[collectionName].groups;
        
            if (groups){
                if (callback){
                    if (groups[eventType]){
                        groups[eventType].remove(callback);
                    }
                }
                // No callback supplied -> remove all plugins for that eventType
                else {
                    delete groups[eventType];
                }
            }
            return this;
        };
    }
    
    var unbind = removePluginFn("events"),
        removeParser = removePluginFn("parsers");
    
    /////
    
    
    // The following pattern means: "{{", followed by anything that isn't "}}", followed by "}}"
    // TODO: make pattern more constrained?
    function generatePattern(startToken, endToken){
        return new RegExp(
            startToken +
            "\\s*((?:.(?!" +
            endToken +
            "))*.?)\\s*" +
            endToken,
            "gi"
        );
    }
    
    // Tim's public API
    var api = {
        // Core settings
        start: "{{",
        end: "}}",
        
        // Create plugins
        bind: bind,
        plugin: plugin,
        
        // Execute plugins
        trigger: trigger,
        parse: parse, // previously called `filter`
        parseTemplate: init, // this later gets replaced with `parseTemplate`
        
        // Remove plugins
        unbind: unbind,
        removeParser: removeParser,

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
        var instanceProps;
        options || (options = {});
    
        function tim(template, data){
            return tim.parseTemplate(template, data);
        }
        
        instanceProps = {
            events:  new Pluggables(),
            parsers: new Pluggables()
        };
        
        api.extend(tim, api, instanceProps, options);
        
        // Generate the top-level token-matching regex
        if (!options.pattern){
            tim.pattern = generatePattern(tim.start, tim.end);
        }
        return tim;
    }
    
    // Return a new instance of Tim to the outer variable
    return create();
    
}(this.Pluggables));


/////

// PLUGINS

// Top-level token parser - for single tokens
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

// Top-level data replacement, for single token parser
tim.plugin("token", function(token, data){
    if (token in data){
        return data[token];
    }
});

// Dot-syntax, modified from the original tinytim.js
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
            this.trigger("failure", token, data);
            return;
        }
        // Property found
        if (i === len - 1){
            // Trigger an event for other plugins
            this.trigger("success", token, data, lookup);
            return lookup;
        }
    }
});

// Foobar
tim.plugin(
    "token",
    
    // token === ":foobar"
    // arguments includes the partial tokens matched by the regex (the same sequence as expected from `token.match(regex)`
    function(token, data, payload, regexMatch, fooBackref, barBackref){
        return payload.template +
            "\n=>\n" +
            "***" + fooBackref + "~" + barBackref + "***";
    },
    
    /:(foo)(bar)/
);


// EVENT BINDINGS

/* See browser console */
tim.bind("ready", function(data){
    console.log("Tim ready");
    
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
});

/*
//TODO: reinstate "all" (or `true`) event binding, to be called in all cases
tim.bind(true, function(eventType){
    console.log("event: " + eventType);
});
*/

tim("hello world", {});
