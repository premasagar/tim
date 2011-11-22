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
        
            for (prop in obj){
                if (obj.hasOwnProperty(prop)){
                    target[prop] = obj[prop];
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
                // TODO: remove, or auto-create group when match is a string or number ?
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
        }
    };
    
    /////
    
    function Pluggables(plugins /* ...Any number of Plugin instances or settings objects */){
        if (plugins){
            this.add.apply(this, arguments);
        }
    }
    
    Pluggables.prototype = extend([], {
        // Placeholder for `groups` object, which may contain clusters of other Pluggables
        groups: null,
    
        // Whether to sort the plugins each time a plugin is added
        // NOTE: when using the `filter` and `group` methods, new Pluggables instances are returned and currently, these new instances do not inherit the `autosort` setting from the parent, so this setting would need to be re-applied if it is needed again on the new instances
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
        // TODO: allow `group` setting that auto-adds to a group? or too much magic?
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
        
        // Find a plugin's main function (`fn` is *not* a fn that is invoked in order to determine the index of a plugin)
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
            else if (typeof plugin === "function") {
                for (; i<len; i++){
                    if (plugin === this[i].fn) {
                        return i;
                    }
                }
            }
            
            // not found
            return -1;
        },
        
        // Return matching plugins (in order of priority, if they've been sorted or auto-sorted)
        filter: function(pattern){
            var len = this.length,
                plugins = new Pluggables(),
                i = 0;
                
            for (; i<len; i++){
                if (this[i].isMatch(pattern)){
                    plugins.push(this[i]);
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
        trigger: function(/* ... arbitrary number of args ... */){
            var i = 0,
                len = this.length,
                plugin;
            
            for (; i<len; i++){
                plugin = this[i];
                plugin.fn.apply(plugin.context || plugin, arguments);
            }
            
            return this;
        },
        
        // Execute all plugins, in priority order, and allow plugins to transform the 1st argument
        transform: function(stopOnFirstTransform /* , ... arbitrary number of args ... */){
            var i = 0,
                len = this.length,
                // If `stopOnFirstTransform` flag is passed, then slice the flag out of the `args` array
                args = toArray(arguments, stopOnFirstTransform === true ? 1 : 0),
                parseRegex = this.parseRegex,
                plugin, result;
            
            for (; i<len; i++){
                plugin = this[i];
                
                // Get result from plugin fnution
                result = plugin.fn.apply(
                    // Context, for `this` in callback
                    plugin.context || plugin,
                    
                    // Apply the arguments, with parsed regex
                    parseRegex && plugin.matchType === "regexp" ?
                        args.slice().concat(args[0].match(plugin.match)) :
                        args
                );
                
                // If a result was given, then use it to replace the 2nd argument, and pass it on to the next plugin
                if (typeof result !== "undefined"){
                    // The result is to be returned once the first plugin has transformed it; don't proceed to further plugins in the group
                    if (stopOnFirstTransform){
                        return result;
                    }
                    args[0] = result;
                }
            }
            
            // Return the transformed result
            return args[0];
        },
        
        group: function(namespace, plugins /* , ...Any number of Plugin instances or settings objects */){
            var groups = this.groups,
                group = groups && groups[namespace],
                settings;
        
            // Getter: return the group
            if (!plugins){
                return group;
            }
            
            // Setter: add plugins to group; create the group if necessary
            if (!group){
                // Create `groups` property if not yet created
                if (!groups){
                    groups = this.groups = {};
                }
                // Create individual, namespaced group if not yet created
                // TODO: need a way to pass in settings to new Pluggables - maybe only settings on construction? or if first obj is not a function and doesn't have `fn`
                group = groups[namespace] = new Pluggables();
            }
            group.add.apply(group, toArray(arguments, 1));
            
            return this;
        }
        
        // TODO: reinstate `"all"` or `true` match plugins as part of all groups?
    });
    
    /////
    
    // Public API
    return extend(Pluggables, {
        extend: extend,
        isArray: isArray,
        toArray: toArray
    });
}());
