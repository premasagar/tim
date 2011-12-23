var Pluggables = (function(){
    "use strict";
    
        // Cache an array, to reuse its methods
    var array = [];
    
    function isArray(obj){
        return toString.call(obj) === "[object Array]";
    }
    
    function toArray(obj, from, to){
        return array.slice.call(obj, from, to);
    }
    
    function extend(target /* , ...Any number of source objects, copied in turn ... */ ){
        var i = 1,
            len = arguments.length,
            obj, prop;
        
        for (; i < len; i++){
            obj = arguments[i];
        
            if (obj){
                for (prop in obj){
                    if (obj.hasOwnProperty(prop)){
                        target[prop] = obj[prop];
                    }
                }
            }
        }
        return target;
    }
    
    /////
    
    /*
        Options:
            `fn`: The main function for the plugin.
            `context`: An optional `this` context for the `fn` function to be called with.
            `match`: A string, regex or boolean-returning function, used to determine if the plugin matches any given string; used to route namespaces or tokens to appropriate plugins.
    */
    function Plugin(settings){
        var match,
            matchType,
            isMatchFn;
            
        if (typeof settings !== "object"){
            this.settings = {};
        }
        
        else {
            this.settings = settings;
        
            // `fn` setting
            if (settings.fn) {
                this.fn = settings.fn;
            }
        
            // `priority` setting
            if (settings.priority) {
                this.priority = settings.priority;
            }
            // `context` setting; this supplies a `this` context to each plugin `fn` call (see `Pluggables.morph` method)
            // NOTE: supplying a `settings.context` can be a potential security hazard, if your JavaScript context is available to untrusted third-party code, and if private data is accessible from the context.
            if (settings.context) {
                this.context = settings.context;
            }
        
            // `match` setting
            match = settings.match;
            matchType = typeof match;
        
            // Pre-assign correct code path for pattern matching (better performance than an if/else on every cycle)
            if (matchType !== "undefined"){
                this.match = match;
                
                // Regex
                if (match.test){
                    isMatchFn = this._isRegexMatch;
                    matchType = "regexp"; // TODO: or `regexp` ?
                }
                
                // A function that returns `true` or `false` (the function is called with `this` as the plugin)
                else if (matchType === "function"){
                    isMatchFn = this._isFunctionMatch;
                }
                
                // String or number
                // TODO: remove, or auto-create type group when match is a string or number ?
                else if (matchType === "string" || matchType === "number"){
                    isMatchFn = this._isEqualMatch;
                }
                
                // NOTE: a boolean value of `true` or `false` will include or exclude the plugin from filtering; the value can be switched at runtime to include or exclude, as required
                
                if (isMatchFn){
                    this.isMatch = isMatchFn;
                }
                this.matchType = matchType;
            }
        }
    }
    
    Plugin.prototype = {
        priority: 0,
        
        match: true,
        
        // Default match method. This is replaced in the constructor if `options.match` exists
        isMatch: function(){
            return !!this.match;
        },
        
        _isRegexMatch: function(str){
            return this.match.test(str);
        },
        
        _isFunctionMatch: function(arg){
            return this.match.call(this, arg);
        },
        
        _isEqualMatch: function(arg){
            return arg === this.match;
        },

        exec: function(){
            return this.fn.apply(this.context || this, arguments);
        }
    };
    
    /////
    
    function Pluggables(plugins /* ...Any number of Plugin instances or settings objects */){
        if (plugins){
            this.add.apply(this, arguments);
        }
    }
    
    Pluggables.prototype = extend([], {
        // Placeholder for `types` object, which may contain clusters of other Pluggables
        types: null,
    
        // Whether to sort the plugins each time a plugin is added
        // NOTE: when using the `filter` and `type` methods, new Pluggables instances are returned and currently, these new instances do not inherit the `autosort` setting from the parent, so this setting would need to be re-applied if it is needed again on the new instances
        autosort: true,
        
        parseRegex: true,
        
        toArray: function(){
            return toArray(this);
        },
        
        // Assumes arguments are Plugin instances and doesn't do sorting; more performant, but less robust than `add`
        push: function(){
            array.push.apply(this, arguments);
            return this;
        },

        slice: function(){
            var plugins = array.slice.apply(this, arguments);
            return new Pluggables(plugins);
        },
        
        create: function(settingsOrFunction){
            // If argument is the isolated function
            if (typeof settingsOrFunction === "function"){
                settingsOrFunction = {fn: settingsOrFunction};
            }
            return new Plugin(settingsOrFunction);
        },
    
        // Add a new plugin
        // TODO: allow `type` setting that auto-adds to a type? or too much magic?
        add: function(/* ...Any number of Plugin instances or settings objects that will be used to create plugin instances */){
            var plugins = array.concat.apply([], arguments), // allow multiple args or an array of args
                plugin,
                i = 0,
                len = plugins.length;
            
            for (; i<len; i++){
                plugin = plugins[i];
                
                // Add the plugin, or if settings were passed then use them to create a plugin
                this.push(plugin instanceof Plugin ?
                    plugin : this.create(plugin)
                );
            }
            
            // Sort plugins in priority order, unless `autosort` has been set to `false`
            return this.autosort ?
                this.sort() : this;
        },
        
        remove: function(plugin){
            var i = typeof plugin === "number" ?
                plugin : this.indexOf(plugin);
            
            if (i >= 0){
                this.splice(i, 1);
            }
            return this;
        },
        
        // Find a plugin's index in the array-like collection; argument is either a Plugin instance or a Plugin instance's function
        indexOf: function(plugin){
            var len = this.length,
                i = 0;
            
            // if argument is a Plugin instance, find the first instance of it
            if (plugin instanceof Plugin){
                for (; i<len; i++){
                    if (plugin === this[i]) {
                        return i;
                    }
                }
            }
            
            // if argument is a function, find the first plugin having the function as its `fn` method
            else if (typeof plugin === "function"){
                for (; i<len; i++){
                    if (plugin === this[i].fn){
                        return i;
                    }
                }
            }
            
            // not found
            return -1;
        },
        
        // Pluck the first object that contains a key and optional value
        getBy: function(property, value){
            var len = this.length,
                i = 0,
                plugin;
                
            for (; i<len; i++){
                plugin = this[i];
                
                // Plugin contains the property
                if (typeof plugin[property] !== "undefined"){
                    // If we don't need to match the value
                    if (typeof value === "undefined"){
                        // then, if the value matches return the plugin
                        if (plugin[property] === value){
                            return plugin;
                        }
                    }
                
                    // Match the value
                    else {
                        // Plugin contains the property and the value
                        if (plugin[property] === value){
                            return plugin;
                        }
                    }
                }
            }
            return null;
        },
        
        // Return matching plugins (in order of priority, if they've been sorted or auto-sorted)
        filter: function(subject, inverse){
            var len = this.length,
                plugins = new Pluggables(),
                i = 0;
            
            // NOTE: two for loops included here to avoid the `(inverse)` lookup taking place every loop cycle
            if (inverse){
                for (; i<len; i++){
                    if (!this[i].isMatch(subject)){
                        plugins.push(this[i]);
                    }
                }
            }
            else {
                for (; i<len; i++){
                    if (this[i].isMatch(subject)){
                        plugins.push(this[i]);
                    }
                }
            }
            return plugins;
        },
        
        // Sort plugins by `priority` property
        // Accepts optional `sortAlgorithm` argument for a custom sort
        sort: (function(){
            function sortByPriority(a, b){
                return a.priority - b.priority;
            }
            
            return function(sortAlgorithm){
                array.sort.call(this, sortAlgorithm || sortByPriority);
                return this;
            };
        }()),
        
        // Execute all plugins, in priority order
        exec: function(/* ... arbitrary number of args ... */){
            var i = 0,
                len = this.length,
                plugin;
            
            for (; i<len; i++){
                plugin = this[i];
                plugin.exec.apply(plugin, arguments);
            }
            
            return this;
        },
        
        // alias of exec
        trigger: function(){
            return this.exec.apply(this, arguments);
        },
        
        // Execute all plugins, in priority order, and allow plugins to transform the 1st argument
        // TODO: move to tim.js?
        transform: function(subject /* , ... arbitrary number of args ... */){
            var env = {}, // environment object (see "regexp" below)
                args = toArray(arguments).concat(env),
                parseRegex = this.parseRegex,
                i = 0,
                len = this.length,
                output, plugin, matches, regex, lastIndex;
                
            function exec(){
                // Get transformation from plugin function  
                output = plugin.fn.apply(
                    // Context, for `this` in callback
                    plugin.context || plugin,
                    
                    // Apply the arguments
                    args
                );
                
                // If a result was given, then use it to replace the 1st argument and pass it on to the next plugin
                if (typeof output !== "undefined" && subject !== output){
                    subject = args[0] = output;
                }
            }
                
            for (; i<len; i++){
                plugin = this[i];
                
                if (plugin.isMatch(subject)){
                    // Matching info for plugins with regular expressions
                    if (plugin.matchType === "regexp" && parseRegex){
                        regex = plugin.match;

                        // Reset the regex point - TODO: required?
                        regex.lastIndex = 0;

                        // Exec on the `subject`
                        // TODO: iterate through all matches
                        while(matches = regex.exec(subject)){
                            if (matches){
                                // The last index of the match within the template
                                matches.lastIndex = regex.lastIndex;
                            }

                            args = args
                                // Remove the blank `env` object
                                .slice(0, -1)
                                // and replace with a new one
                                .concat({matches: matches});
                                
                            exec();
                        }
                        
                        // Reset the pointer
                        regex.lastIndex = 0;
                    }
                    
                    else {
                        exec();
                    }
                }
            }
            
            // Return the transformed subject
            return subject;
        },
        
        type: function(namespace, plugins /* , ...Any number of Plugin instances or settings objects */){
            var types = this.types,
                type = types && types[namespace];
        
            // Getter: return the type group
            if (!plugins){
                return type;
            }
            
            // Setter: add plugins to the type group; create the group if necessary
            if (!type){
                // Create `types` property if not yet created
                if (!types){
                    types = this.types = {};
                }
                // Create individual, namespaced type if not yet created
                // TODO: need a way to pass in settings to new Pluggables - maybe only settings on construction? or if first obj is not a function and doesn't have `fn`
                type = types[namespace] = new Pluggables();
            }
            type.add.apply(type, toArray(arguments, 1));
            
            return this;
        }
        
        // TODO: reinstate `"all"` or `true` match plugins as part of all types?
    });
    
    /////
    
    // Public API
    return extend(Pluggables, {
        extend: extend,
        isArray: isArray,
        toArray: toArray
    });
}());
