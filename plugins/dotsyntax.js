// Dot-syntax data substitution (for this functionality alone, use tinytim.js)
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