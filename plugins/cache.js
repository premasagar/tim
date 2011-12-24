// cache: Get and set the templates cache object
/*
    Example usage:
    tim.cache("foo"); // get template named "foo"
    tim.cache("foo", "bar"); // set template named "foo" to "bar"
    tim.cache("foo", false); // delete template named "foo"
    tim.cache({foo:"bar", blah:false}); // set multiple templates
    tim.cache(false); // delete all templates
*/
tim.cache = (function(){
    var cache = {};
    
    return function(key, value){
        var t;

        switch (typeof key){
            case "undefined":
            return cache;
        
            case "string":
                if (typeof value === "undefined"){
                    return cache[key];
                }
                else if (value === false){
                    delete cache[key];
                }
                else {
                    cache[key] = value;
                }
            break;
        
            case "object":
                for (t in key){
                    if (key.hasOwnProperty(t)){
                        this.cache(t, key[t]);
                    }
                }
            break;
        
            case "boolean":
            if (!key){
                cache = {};
            }
            break;
        }
        return this;
    };
}());

//

// Allow retrieving cached template by name, e.g. tim("foo") => "<div>{{bar}}</div>"
tim.plugin(
    "template",

    function(template){
        return tim.cache(template);
    },

    {match:/^[a-z0-9_\-]+$/i}
);