// TIM PLUGINS

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
tim.ready(function(){
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
    
}, -100);


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

//

tim.templates = {};

// cache: Get and set the templates cache object
/*
    Example usage:
    tim.cache("foo"); // get template named "foo"
    tim.cache("foo", "bar"); // set template named "foo" to "bar"
    tim.cache("foo", false); // delete template named "foo"
    tim.cache({foo:"bar", blah:false}); // set multiple templates
    tim.cache(false); // delete all templates
*/
tim.cache = function(key, value){
    var templates = this.templates,
        t;

    switch (typeof key){
        case "undefined":
        return templates;
        
        case "string":
            if (typeof value === "undefined"){
                return templates[key];
            }
            else if (value === false){
                delete templates[key];
            }
            else {
                templates[key] = value;
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
            this.templates = {};
        }
        break;
    }
    return this;
};

// Dom plugin: finds micro-templates in <script>'s in the DOM
// Default: <script type="text/tim" class="foo">{{TEMPLATE}}</script>
tim.dom = function(domSettings){
    domSettings = domSettings || {};
    
    var type = domSettings.type || "text/tim",
        attr = domSettings.attr || "class",
        document = window.document,
        hasQuery = !!document.querySelectorAll,
        elements = hasQuery ?
            document.querySelectorAll(
                "script[type='" + type + "']"
            ) :
            document.getElementsByTagName("script"),
        i = 0,
        len = elements.length,
        elem, key,
        templatesInDom = {};
        
    for (; i < len; i++){
        elem = elements[i];
        // Cannot access "class" using el.getAttribute()
        key = attr === "class" ? elem.className : elem.getAttribute(attr);
        if (key && (hasQuery || elem.type === type)){
            templatesInDom[key] = elem.innerHTML;
        }
    }
    
    this.cache(templatesInDom);
    return this;
};

// Allow retrieving cached template by name, e.g. tim("foo", {})
// TODO: don't let this substitution prevent further plugins operating
tim.plugin("template", function(template, data, payload){
    return tim.cache(template);
}, {match:/^[a-z0-9_\-]+$/i, priority:-200});

tim.ready(function(){
    // Cache all DOM templates
    tim.cache(tim.dom());
}, -500);


/////

// DEMO


// Foobar
tim.plugin(
    "token",
    
    // token === ":foobar"
    // arguments includes the partial tokens matched by the regex (the same sequence as expected from `token.match(regex)`
    function(token, data, payload, env){
        var matches = env.matches;
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