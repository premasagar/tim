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



///////////////////////

var _ = console.log;

var tim = (function(){
    var start = "{{",
        end = "}}",
        startLength = start.length,
        endLength = end.length,
        plugins = [],
        pluginsLength = 0,
        plugin,
        tim;

    tim = function(template, data){
        var posFirstOpen = template.indexOf(start),
            posOpen,
            posClose,
            tokensOpen = 0,
            fragment,
            i = 0;
        
        if (posFirstOpen >= 0){
            tokensOpen ++;
            fragment = template.slice(posFirstOpen + startLength);
        }
        
        while (tokensOpen){
            posClose = fragment.indexOf(end);
            posOpen = fragment.indexOf(start);
            
            if (posOpen >= 0 && posOpen < posClose){
                tokensOpen ++;
                fragment = fragment.slice(posOpen + startLength);
            }
            else if (posClose >= 0){
                tokensOpen --;
            }
            else { // unmatched closing braces
                break;
            }
        }
        
        if (posClose >= 0){
            fragment = fragment.slice(0, 
        }
        
        
        
        do {
            posOpen = fragment.indexOf(start);
            if (posOpen >= 0){
                tokensOpen ++;
                fragment = fragment.slice(posOpen);
            }
            posClose = template.indexOf(end);
            if (posOpen >= 0){
                tokensOpen ++;
            }
        }
        while (tokensOpen);
            
            
        if (posOpen > -1){
            tokensOpen ++;
            fragment = template.slice(posOpen + startLength);
            
            posOpen = fragment.indexOf(start);
            posClose = fragment.indexOf(end);
            
            if (posOpen < 0 && posClose <0){
                return;
            }
            if (posOpen > 0 && posOpen < posClose){
                
            }

            if (posClose > posOpen){
                fragment = template.slice(posOpen + startLength, posClose + endLength);
                _(fragment);

                for (; i < pluginsLength; i++){
                    plugin = plugins[i];
                    if (plugin.regex.test(fragment)){
                        return fragment.replace(plugin.regex, plugin.fn);
                    }
                }
            }
        }
    };
    tim.plugin = function(regex, fn, priority){
        plugins.push({
            regex: regex,
            fn: fn,
            priority: priority
        });
        pluginsLength ++; // cache plugin length, to increase efficiency
    };

    return tim;
}());

// Add plugins

// Dot notation
tim.plugin(/[a-z0-9_][\.a-z0-9_]*/, function(template){
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

var template = "{{bl.ah}}",
    data = {
        bl: {
            ah:6
        },
        blah: 77
    };

tim(template, data);

/////////////////////////////

// 339 gzipped

var tim=function(){var g=[],d=0,c,b;b=function(a){var e=a.indexOf("{"),f,h=0;if(e>-1&&a.charAt(e+1)==="{"){f=a.slice(e+1).indexOf("}");if(f>-1&&a.charAt(f+1)==="}")for(a=a.slice(e+2,f+1);h<d;h++){c=g[h];if(c.a.test(a))return a.replace(c.a,c.b)}}};b.plugin=function(a,e,f){g.push({a:a,b:e,c:f});d++};return b}();tim.plugin(/[a-z0-9_][\.a-z0-9_]*/,function(g){for(var d=g.split("."),c=d.length,b=data,a=0;a<c;a++){b=b[d[a]];if(b===void 0)throw"tim: '"+d[a]+"' not found in {{"+g+"}}";if(a===c-1)return b}});
posOpen
