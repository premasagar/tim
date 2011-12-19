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
                // TODO: need way to get plugin, but also `tim`
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
        addPlugin = addPluginFn("plugins"),
        removePlugin = removePluginFn("plugins");
    
    function getPlugin(id){
        return this.plugins.getBy(id);
    }
        
    // Main `plugin` method wraps addPlugin() and getPlugin()
    function plugin(){
        var method = arguments.length === 1 ? getPlugin : addPlugin
        return method.apply(this, arguments);
    }
    
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
    
    // Transform a payload, upon a specific event
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
        
        // Initialisation finished.
        // If no arguments are passed, return `this`.
        // Otherwise, proceed to parsing the first template.
        return typeof template === "undefined" ?
            this : tim.parseTemplate(template, data);
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
        // Plugin collections, created in tim.create():
        
            listeners: new Pluggables(),
            plugins: new Pluggables(),
        
        */
        
        // Execute plugins
        trigger: trigger,
        parse: parse, // previously called `filter`
        parseTemplate: init, // `init` replaces itself with `parseTemplate`
        
        // Remove plugins
        unbind: unbind,
        removePlugin: removePlugin,

        // Initialise Tim
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
    
}(Pluggables));

// end of Tim core

////////////////////////////////////////////////////////////////////////////////

// PLUGINS

// Console logging, for development
window.O = function(){
    if (window.console){
        window.console.log.apply(window.console, arguments);
    }
};


// Function to generate a token-matching regular expression
/* Options:
    `whitespace`: is leading and trailing whitespace OK ? (bool, default false)
    `closing`: is this a closing tag? (bool, default false)
    `prefix`: a string before the token
    `suffix`: a string at the end of the token
    `flags`: flags for the regular expression (string, default "gi" - executes globally on the string and is case-insensitive)
    `name`: the specific name of the token (string, default is a wildcard for any text)
*/
tim.bind("ready", function(){
    this.tagRegex = function(options){
        options || (options = {});
        
        return new RegExp(
            // "{{"
            this.startToken +
            
                // Whitespace at start?
                (!options.whitespace !== false ? "\\s*" : "") +
                
                // Is this a block close tag? If so, start the token a closing forward-slash "/"
                (options.closing ? "/" : "") + 
                
                // Prefix at the start of the token
                (options.prefix || "") +
                    
                // Back-reference: any text that is not the end token
                (options.name || "((?:.(?!" + this.endToken + "))*.?)") +
                
                // Suffix at the end of the token
                (options.suffix || "") +
                
                // Whitespace at end?
                (options.whitespace !== false ? "\\s*" : "") +
            
            // e.g. "}}"
            this.endToken,
            
            // Regular expression flags
            options.flags || "gi"
        );
    }
    
    //
    
    // Top-level tag regex
    this.pattern = this.tagRegex();
    
    //
    
    // Create the block parser plugin, e.g. "{{#foo}} bar {{/foo}}"
    tim.plugin(
        // Transforms the top-level template
        "template",

        // Intercept template whenever an opening `block` tag is detected and replace the block with a sub-template
        function(template, data, payload, env){
            // The token, from the back-reference in the plugin's `match` regular expression (see `tim.tagRegex({prefix: "#"})` below)
            var matches = env.matches,
                token = matches[1],
                closingTag = this.startToken + "/" + token + this.endToken,
                posOpeningTagStart = matches.index,
                posOpeningTagEnd = matches.lastIndex,
                subtemplate = template.slice(posOpeningTagEnd),
                posClosingTokenSubtemplate = subtemplate.indexOf(closingTag),
                posClosingTokenStart, posClosingTokenEnd, subPayload;

            // No closing token found
            if (posClosingTokenSubtemplate === -1){
                tim.trigger("error", "Missing closing token in block", this, subtemplate, arguments);
                return;
            }
            
            subtemplate = subtemplate.slice(0, posClosingTokenSubtemplate);
            posClosingTokenStart = posOpeningTagEnd + posClosingTokenSubtemplate;
            posClosingTokenEnd = posClosingTokenStart + closingTag.length;
            
            // Convert sub-template
            subPayload = tim.extend({}, payload, {token: token});
            subtemplate = tim.parse("block", subtemplate, data, subPayload);
            
            return template.slice(0, posOpeningTagStart) + subtemplate + template.slice(posClosingTokenEnd);
        },
        
        {
            // Only trigger when the token beings with "#"
            match: tim.tagRegex({prefix: "#"}),
            // Make sure this is in place before the main `template` loop
            priority: -100
        }
    );
    
}, {priority:-100});


tim.plugin("block", function(template, data, payload){
    var token = payload.token,
        lookup = data[token];

    if (lookup === null || lookup === false){
        return "";
    }
    
    if (typeof lookup === "object"){
        // TODO: arrays and object keys and elements
        // iterate through array, one sub-template for each element?
        // iterate through object?
        return tim(template, lookup);
    }
        
    // TODO: strings + numbers lookup template.cache(templateName)
});

// Simple, single template tags (top-level parser)
tim.plugin("template", function(template, data, payload){
    var pattern = this.pattern,
        result, token, replacement;
    
    while((result = pattern.exec(template)) !== null){
        token = result[1];
        replacement = this.parse("token", token, data, payload);
        
        if (replacement !== token){
            template =  template.slice(0, result.index) +
                        replacement +
                        template.slice(pattern.lastIndex);
            
            pattern.lastIndex += (replacement.length - result[0].length);
        }
    }

    // Reset regular expression pointer
    pattern.lastIndex = 0;
    return template;
});


/////


// Basic data substitution (does not support dot-syntax)
// NOT needed when the dot-syntax plugin below is present
tim.plugin("token", function(token, data){
    if (token in data){
        return data[token];
    }
});

// Data substitution, allowing dot-syntax (to achieve this behaviour on its own, use tinytim.js)
tim.plugin(
    "token",
    
    function(token, data){
        var path = token.split("."),
            len = path.length,
            lookup = data,
            i = 0;

        for (; i < len; i++){
            lookup = lookup[path[i]];
            
            // Property not found
            if (typeof lookup === "undefined"){
                // Trigger an event for other plugins
                this.trigger("error", this, token, arguments);
                return;
            }
            // Property found
            if (i === len - 1){
                // Trigger an event for other plugins
                this.trigger("success", token, data, lookup);
                return lookup;
            }
        }
    },
    
    {match: /^\s*[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*\s*$/}
);


/////

// DEMO


// Foobar
tim.plugin(
    "token",
    
    // token === ":foobar"
    // arguments includes the partial tokens matched by the regex (the same sequence as expected from `token.match(regex)`
    function(token, data, payload, env){
        var matches = env.matches;
        console.log
        return "***" + matches[1] + "~" + matches[2] + "***";
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
    tim("1. {{#block}}{{apple}}{{/block}} {{foo}} {{bar}} {{:foobar}} {{deep.foo}}",
        {
            foo:"MOO",
            bar:"BAA",
            deep:{
                foo:"bling"
            },
            block: {
                apple:"green"
            }
        }
    )
);
