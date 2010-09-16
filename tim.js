"use strict";

/*!
* Tim
*   github.com/premasagar/tim
*
*//*
    A tiny, secure JavaScript micro-templating script

    by Premasagar Rose
        dharmafly.com

    license
        opensource.org/licenses/mit-license.php

    **

    creates global object
        tim

    **
        
    v0.2
        
*//*
    You can use Tim to write simple templates that use JavaScript's
    familiar dot notation to replace template tags with JSON object
    properties.
    
    
    == Why is micro-templating useful? ==
    Don't you just hate having to write HTML with a mess of string
    concatenation?:
    
        var myHTML = "<ul class='" + myClass + "'>" +
            "<li id='" + theId + "'>" + liContents + "</li>" +
            // etc, etc, etc
            
    Yuck. There's no need to do this. Simply prepare a JavaScript object
    with the required dynamic properties, and keep the HTML all together
    in a "micro-template". See below for details on keeping micro-
    templates inline within an HTML document.
    
    
    == How is Tim different from other templating scripts? ==

    It is safe and secure: it doesn't use eval or (new Function), so it
    cannot execute malicious code. As such, it can be used in secure
    widgets and apps that disallow eval - e.g. Adobe Air sandboxes,
    AdSafe ads, etc.

    It doesn't include a whole bloat load of features that are unlikely
    to get used when you just want to get some simple templating up and
    running.

    It's a mere 232 bytes when minified and gzipped.
    
    For these reasons, it is now in use in Sqwidget, the JavaScript
    widget library: http://github.com/premasagar/sqwidget

    
    == Usage ==
    
        var template = "Hello {{place}}. My name is {{person.name}}.",
            data = {
                place: "Brighton",
                person: {
                    name: "Prem"
                }
            };
            
        var myText = tim(template, data);
        // "Hello Brighton. My name is Prem."
    
    
    In addition to plain and simple text, you may want to use Tim to
    populate HTML or other types of template. For example:
    
        var myTemplate = "<p><a href='{{url}}'>{{title}}</a>",
            data = {
                title: "Dharmafly",
                url:   "http://dharmafly.com"
            };
            
        var myHTML = tim(myTemplate, data);
        // "<p><a href='http://dharmafly.com'>Dharmafly</a></p>"
        
    ...and so on, all the way up to a full-blown HTML document.
    
    
    == Debugging ==
    
    By default, if your template references a property that is not
    present in the data object, then Tim will throw an error saying 
    something like:
    
        "Tim: 'foo' not found in {{config.data.bar}}"
        
    This helps with debugging when creating templates.
    
    If you want to save precious few bytes, and you are certain that
    your templates will never fail, then feel free to rip out the `if`
    block `if (lookup === undef){ [...] }`.
    
    
    == notFound: an optional third argument ==
    
    As an alternative to the default debug errors, you can specify an
    optional third argument, which will be used as the default
    substitution string, when a property is not found in the data
    object.
    
    e.g.
    
        tim("abc{{d}}ef", {}, "*unknown*");
        // "abc*unknown*ef"
        
    You might want to use HTML, or simply an empty string "".


    == Using arrays ==
    The data can be, or can include, an array. Use dot notation to
    access the array elements.

    e.g:
    
        tim(
            "Hello {{0}}",
            ["world"]
        );
        // "Hello world"
        
    or:
    
        tim(
            "Hello {{places.0}}",
            {
                places: ["world"]
            }
        );
        // "Hello world"


    == Changing the {{delimter}} ==
    By default, template tags are delimited by "{{" and "}}".
    To change this, edit the `starts` and `ends` vars below.
    
    
    == Embedding micro-templates in an HTML document ==
    
    A little known aspect of browser parsing of HTML documents is that
    if a document contains a <script> tag that has a non-standard `type`
    attribute, then the browser will not attempt to parse the script
    element - but it will allow us to grab its contents. This leads us
    to a very useful coding pattern:
    
    in the HTML, add a script tag with any non-standard type:
    
        <script type="text/template" id="foo">
            <p><a href='{{url}}'>{{title}}</a></p>
        </script>
        
    and in the JavaScript, grab the script element by its id and pull
    out its contents:
    
        var myTemplate = document.getElementById("foo").innerHTML,
            data = {
                title: "Dharmafly",
                url:   "http://dharmafly.com"
            };
            
        var myHTML = tim(myTemplate, data);
        // "<p><a href='http://dharmafly.com'>Dharmafly</a></p>"
    
    then do something with your newly populated template, like replace
    an element in the DOM with it:
    
        document.getElementById("bar").innerHTML = myHTML;
    
    Working in this way brings some sanity back to application
    development, where you want to specify the markup structure, but
    swap in specific text and attributes, or whole blocks of markup.
    
    It also makes your code more maintainable - the markup templates can
    live with the rest of the static markup on a page, where the markup
    coder can access it, and the JavaScript logic lives in an entirely
    different place.
        
*/


var tim = (function(){
    var starts  = "{{",
        ends    = "}}",
        path    = "[a-z0-9_][\\.a-z0-9_]*", // e.g. config.person.name
        pattern = new RegExp(starts + "("+ path +")" + ends, "gim"),
        undef;
    
    return function(template, data, notFound){
        // Merge the data into the template string
        return template.replace(pattern, function(tag, ref){
            var path = ref.split("."),
                len = path.length,
                lookup = data,
                i = 0;

            for (; i < len; i++){
                lookup = lookup[path[i]];
                
                // Error handling for when the property is not found
                if (lookup === undef){
                    // If specified, substitute with the "not found" arg
                    if (notFound !== undef){
                        return notFound;
                    }
                    // Throw error
                    throw "tim: '" + path[i] + "' not found in " + tag;
                }
                
                // Success! Return the required value
                if (i === len - 1){
                    return lookup;
                }
            }
        });
    };
}());
