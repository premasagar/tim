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

    // Initialise Tim
    // this is called automatically, the first time `tim(template, data)` is called
    function init() {
        this.trigger("init");        
        this.initialized = true;
        return this.trigger("ready");
    }
    
    /////
    
    // CREATE PLUGINS
    
    // For subscribing to an event
    function bind(eventType, callback, context){
        this.events.group(eventType, {
            exec: callback,
            context: context || this
        });
        return this;
    }
    
    // For manipulating templates, objects, etc
    // TODO: change `exec` -> `callback` or `fn`?
    function addParser(eventType, callback, pattern, context){
        var plugin = {
            exec: callback,
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
            args;
        
        if (plugins){
            args = this.toArray(arguments, 1);
            // Add boolean `stopOnFirstTransform` flag to `plugins.transform`
            args.unshift(true);
            
            plugins = plugins.filter(toTransform);
            toTransform = plugins.transform.apply(plugins, args);
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
    
    function parseFirstRun(template, data){
        // On first use with a template, initialise
        tim.init.call(tim);
        
        tim.parseTemplate = parseTemplate;
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
        addParser: addParser,
        
        // Execute plugins
        trigger: trigger,
        parse: parse, // previously called `filter`
        parseTemplate: parseFirstRun, // this later gets replaced with `parseTemplate`
        
        // Remove plugins
        unbind: unbind,
        removeParser: removeParser,

        // Advanced                
        init: init, // re-initialise Tim
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

// EXPERIMENTAL EXAMPLES

/* try this in the browser console:
   
    tim(
        "{{foo}} {{bar}} {{:foobar}} {{deep.foo}}",
        {
            foo:"MOO",
            bar:"BAA",
            deep:{
                foo:"bling"
            }
        }
    );
   
*/

// Top-level token parser - for single tokens
tim.addParser("template", function(template, data, payload){
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
tim.addParser("token", function(token, data){
    if (token in data){
        return data[token];
    }
});

// Dot-syntax, modified from the original tinytim.js
tim.addParser("token", function(token, data){
    var path = token.split("."),
        len = path.length,
        lookup = data,
        i = 0;

    for (; i < len; i++){
        lookup = lookup[path[i]];
        
        // Property not found
        if (typeof lookup === "undefined"){
            return;
        }
        
        // Property found
        if (i === len - 1){
            return lookup;
        }
    }
});

tim.addParser(
    "token",
    
    // token === ":foobar"
    // arguments includes the partial tokens matched by the regex (the same sequence as expected from `token.match(regex)`
    function(token, data, payload, regexMatch, backref1, backref2){
        return "***" + backref1 + "~" + backref2 + "***";
    },
    
    /:(foo)(bar)/
);

tim.bind("init", function(data){
    console.log("INIT`ing. 'init?");
});

/*
//TODO: reinstate "all" (or `true`) event binding, to be called in all cases
tim.bind(true, function(eventType){
    console.log("event: " + eventType);
});
*/
