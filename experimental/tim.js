/*
NOTES.

- plugin API:
  tim.plugin(pattern, fn, [priority], [id]); // pattern is string or regex
  
  // alternative:
  tim.plugin(fn, [priority], [id]); // matching is handled by plugin
  
- walk through template string, char by char. On indexOf("{"), check for next char. If double {{, then var tokensOpen ++. When !tokensOpen, then call each plugin in priority order.

- nested double braces {{foo{{bar}}blah}} will not be parsed by the main loop, although plugins may call tim() on the contents of the passed template, to recursively parse tokens.

- if plugin function returns undefined (or doesn't return at all), then Tim will pass on to next plugin. If no plugins returned string, then throw error. If need be, user can add catchall function that returns "", to prevent the error throwing and fail silently.
(should only throw error if escaping "{{" is possible).

- on calling tim.plugin(), the plugin array is sorted by priority
  

*/
/*
// Syntax ideas

var tim = function(){};

tim["flickr"] = "<a href='http://www.flickr.com/{{farm}}/{{secret}}/{{photoId}}'>{{title}}</a>";

tim(
    "{{!flickr}}",
    {
        farm: 1,
        secret: 121232,
        photoId: 2323342,
        title: "Red kite"
    }
);

tim(
    "{{[]}}foo{{.}}bar]]",
    {
        a: 1,
        b: 2
    }
);

// Grab innerHTML from a DOM node template
tim["vimeo"] = tim("script[type=tim].vimeo"); // use Sizzle selector engine?

tim("{{!vimeo}}", {color:"red"});
*/


///////////////////////

// Debugging
var _ = this.console && this.console.log ?
    function(){
        this.console.log.apply(arguments);
    } :
    function(){};

var tim = (function(){
    var start = "{{",
        end = "}}",
        startLength = start.length,
        endLength = end.length,
        plugins = [],
        pluginsLength = 0,
        plugin,
        tim;

    function applyPlugins(fragment){
        var i = 0,
            plugin;
        
        for (; i < pluginsLength; i++){
            plugin = plugins[i];
            if (plugin.regex.test(fragment)){
                fragment = fragment.replace(plugin.regex, plugin.fn);
            }
        }
        return fragment;
    }

    function nextFragment(template){
        var posFirstOpen = template.indexOf(start),
            posLastClose = 0,
            posOpen,
            posClose,
            tokensOpen = 0,
            fragment;
        
        if (posFirstOpen >= 0){
            tokensOpen ++;
            fragment = template.slice(posFirstOpen + startLength);
            posLastClose += posFirstOpen + startLength;
        }
        
        while (tokensOpen){
            posClose = fragment.indexOf(end);
            posOpen = fragment.indexOf(start);
            
            if (posOpen >= 0 && posOpen < posClose){
                tokensOpen ++;
                fragment = fragment.slice(posOpen + startLength);
                posLastClose += posOpen + startLength;
            }
            else if (posClose >= 0){
                tokensOpen --;
                fragment = fragment.slice(posClose + endLength);
                posLastClose += posClose + endLength;
            }
            else { // unmatched closing braces
                break;
            }
        }

        // if we've found a full token
        if (posClose >= 0){
            fragment = template.slice(posFirstOpen + startLength, posLastClose - endLength);
            fragment = applyPlugins(fragment);
            template = template.slice(0, posFirstOpen) + fragment + template.slice(posLastClose);
            // run again, for next fragment
            return nextFragment(template);
        }
        return template;
    }

    tim = function(template, data){    
        return nextFragment(template);
    };
    
    tim.plugin = function(regex, fn, priority){
        plugins.push({
            regex: regex,
            fn: fn,
            priority: priority
        });
        pluginsLength ++; // cache plugin length, to increase efficiency
        
        // TODO: sort plugins array by plugin priority
    };

    return tim;
}());

// Add plugins

// Dot notation
tim.plugin(/^[a-z0-9_][\.a-z0-9_]*$/g, function(template){
    var path = template.split("."),
        len = path.length,
        lookup = data,
        i = 0,
        undef;

    for (; i < len; i++){
        lookup = lookup[path[i]];
        
        // Error handling for when the property is not found
        if (lookup === undef){
            // Throw error
            throw "tim: '" + path[i] + "' not found in {{" + template + "}}";
        }
        
        // Success! Return the required value
        if (i === len - 1){
            return lookup;
        }	
    }
});

var template = "foo{{blah{{blah}}ba{{}}r}}blob{{doo}}bob",
    data = {
        bl: {
            ah:6
        },
        blah: 77,
        ba: 5,
        r: 4,
        doo: "dah"
    };


// node.js
var print = require('sys').print;
_ = print;

_(tim(template, data));
_("\n");
//////////////////////


