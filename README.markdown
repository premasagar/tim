# Tim

A tiny, secure JavaScript micro-templating script.

Tim lets you write simple templates that uses JavaScript's familiar dot notation. You pass in a JavaScript object that contains all the relevant strings, and they are then substituted into the template. For example:

    tim("Hello {{place}}", {place: "world"});
    // "Hello world"

* by [Premasagar Rose](http://premasagar.com) 
    ([Dharmafly](http://dharmafly.com))
* source: [github.com/premasagar/tim](http://github.com/premasagar/tim) ([MIT license](http://opensource.org/licenses/mit-license.php))
* ~200 bytes minified & gzipped


## Why is micro-templating useful?
Don't you just hate having to write HTML with a mess of string concatenation that clutters up your JavaScript?:

    var myHTML = "<ul class='" + myClass + "'>" +
        "<li id='" + theId + "'>" + liContents + "</li>" +
        // etc, etc, etc
        
Yuck. There's no need to do this. Simply prepare a JavaScript object with the required properties, and inject it into a simple template string. The templates can all be tidily kept together with the rest of the markup in an HTML document (see below).


## How is Tim different from other templating scripts?
It is safe and secure: it doesn't use eval or (new Function), so it cannot execute malicious code. As such, it can be used in secure widgets and apps that disallow eval - e.g. Adobe Air sandboxes, AdSafe ads, etc.

It doesn't include a whole bloat load of features that are unlikely to get used when you just want to get some simple templating up and running.

It comes in two versions: "lite" (which is tiny), and "standard", which has advanced functionality and allows extensibility with plugins.

It's easy to debug.

For these reasons, it is now in use in Sqwidget, the JavaScript widget library: [github.com/premasagar/sqwidget](http://github.com/premasagar/sqwidget)


## Usage

    var template = "Hello {{place}}. My name is {{person.name}}.",
        data = {
            place: "Brighton",
            person: {
                name: "Prem"
            }
        };
        
    tim(template, data);
    // "Hello Brighton. My name is Prem."


In addition to plain and simple text, you can use Tim to populate HTML or other types of template.

For example:

    var template = "<p><a href='{{url}}'>{{title}}</a></p>",
        data = {
            title: "Dharmafly",
            url:   "http://dharmafly.com"
        };
        
    tim(myTemplate, data);
    // "<p><a href='http://dharmafly.com'>Dharmafly</a></p>"
    
...and so on, all the way up to a full-blown HTML document.


## Nested templates
Sometimes, you will want to reuse the same template multiple times in a loop, and then wrapped within a bigger template - e.g. when creating an HTML `<ul>` list tag.

This is easily achieved:

    var ul = "<ul>{{list}}</ul>",
        li = "<li>{{contents}}</li>",
        myList = "",
        i;
        
    for (i=100; i<103; i++){
        myList += tim(li, {contents: i});
    }
    tim(ul, {list: myList});
    // "<ul><li>100</li><li>101</li><li>102</li></ul>"
    
_(NOTE: Baked in support for iterating over objects and arrays is on its way. Watch this space)._
        

## Debugging
If your template references a path in the data object that could not actually be found, then Tim will throw an error, to help with debugging:

    tim("Hello {{config.foo.bar}}", {config: {moo: "blah"}});
    // tim: 'foo' not found in {{config.foo.bar}}


## Using arrays
The data can be, or can include, an array. Use dot notation to access the array elements.

e.g:

    tim("Hello {{0}}", ["world"]);
    // "Hello world"
    
or:

    tim("Hello {{places.0}}", {places: ["world"]});
    // "Hello world"


## Changing the {{curly braces}} delimiter
By default, template tags are delimited by "`{{`" and "`}}`" tokens.
To change this, edit the `start` and `end` vars in the code.


## Embedding micro-templates within an HTML document
A little known aspect of browser parsing of HTML documents is that if a document contains a `<script>` tag that has a non-standard `type` attribute, then the browser will not attempt to parse that script element. However, JavaScript can still access the contents of the element. This leads us to a very useful coding pattern:

in the HTML, add a script tag with a non-standard type, e.g. "`text/tim`:

    <script type="text/tim" id="foo">
        <p><a href='{{url}}'>{{title}}</a></p>
    </script>
    
and in the JavaScript, grab the script element by its `id` and extract its contents:

    var template = document.getElementById("foo").innerHTML,
        data = {
            title: "Dharmafly",
            url:   "http://dharmafly.com"
        };
        
    tim(template, data);
    // "<p><a href='http://dharmafly.com'>Dharmafly</a></p>"

then do something with your newly populated HTML, such as inject it into an element in the DOM:

    document.getElementById("bar").innerHTML = myHTML;
        

Working in this way brings some sanity back to application development, where you want to specify the markup structure, but swap in specific text and attributes, or whole blocks of markup.

It also makes your code more maintainable - the markup templates can live with the rest of the static markup on a page, where the markup coder can access it, and the JavaScript logic lives in an entirely
different place.

### Another example: using class names
This time, using class names on the script element, and a little jQuery:

    <!-- HTML -->
    <script type="text/tim" class="foo">
        <p><a href='{{url}}'>{{title}}</a></p>
    </script>
    
    /* JavaScript */
    var template = jQuery("script[type=text/tim].foo").html(),
        data = {
            title: "Dharmafly",
            url:   "http://dharmafly.com"
        };
        
    jQuery("#bar").html(
        tim(template, data)
    );

### Another example: caching your micro-templates
E.g. by looping through all the template elements:

    <!-- HTML -->
    <script type="text/tim" class="foo">
        <p><a href='{{url}}'>{{title}}</a></p>
    </script>
    
    /* JavaScript */
    var templates = {}; // template cache object
    
    jQuery("script[type=text/tim]").each(function(){
        templates[this.className] = this.innerHTML;
    });
    
    tim(templates.foo, data);

## Future development
Some future developments include support for loops and custom plugins.

## Feedback
Do you have any issues, questions or suggestions, or are you finding Tim useful in one of your projects? See [github.com/premasagar/tim/issues](http://github.com/premasagar/tim/issues), or get in touch ([@premasagar](http://twitter.com/premasagar)).
