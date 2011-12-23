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
        return function(eventType, callback, options){
            // If a number passed, then use for the priority
            if (typeof options === "number"){
                options = {priority:options};
            }
            
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
    
    function ready(fn){
        return this.bind("ready", fn);
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
    
    /*
    var extensions = {};
    function extend(arg1, arg2){
        // Extending into the first argument
        if (arg2){
            return Pluggables.extend.apply(Pluggables, arguments);
        }
        
        // Extending into Tim - and ensure all extensions are available 
        extend(this, arg1);
        extend(extensions, arg1);
        return this;
    }
    */
    
    /////
    
    // Tim's public API
    var api = {
        // Core settings
        startToken: "{{",
        endToken: "}}",
        
        // Create plugins
        bind: bind,
        plugin: plugin,
        ready: ready,
        
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