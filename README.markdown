# Tim

A tiny, secure JavaScript micro-templating script.

* by [Premasagar Rose](http://premasagar.com) 
    ([Dharmafly](http://dharmafly.com))
* source: [github.com/premasagar/tim](http://github.com/premasagar/tim)
* [MIT license](http://opensource.org/licenses/mit-license.php)
* 232 bytes minified & gzipped

You can use Tim to write simple templates that use JavaScript's familiar dot notation to replace template tags with JSON object properties.


## Why is micro-templating useful?
Don't you just hate having to write HTML with a mess of string concatenation?:

    var myHTML = "<ul class='" + myClass + "'>" +
        "<li id='" + theId + "'>" + liContents + "</li>" +
        // etc, etc, etc
        
Yuck. There's no need to do this. Simply prepare a JavaScript object with the required dynamic properties, and keep the HTML all together in a "micro-template". See below for details on keeping micro-templates inline within an HTML document.


## How is Tim different from other templating scripts?
It is safe and secure: it doesn't use eval or (new Function), so it cannot execute malicious code. As such, it can be used in secure widgets and apps that disallow eval - e.g. Adobe Air sandboxes, AdSafe ads, etc.

It doesn't include a whole bloat load of features that are unlikely to get used when you just want to get some simple templating up and running.

For these reasons, it is now in use in Sqwidget, the JavaScript widget library: [github.com/premasagar/sqwidget](http://github.com/premasagar/sqwidget)


## Usage

    var template = "Hello {{place}}. My name is {{person.name}}.",
        data = {
            place: "Brighton",
            person: {
                name: "Prem"
            }
        };
        
    var myText = tim(template, data);
    // "Hello Brighton. My name is Prem."


In addition to plain and simple text, you can use Tim to populate HTML or other types of template. For example:

    var myTemplate = "<p><a href='{{url}}'>{{title}}</a></p>",
        data = {
            title: "Dharmafly",
            url:   "http://dharmafly.com"
        };
        
    var myHTML = tim(myTemplate, data);
    // "<p><a href='http://dharmafly.com'>Dharmafly</a></p>"
    
...and so on, all the way up to a full-blown HTML document.


## Nested templates
Sometimes, the same template may need to be populated within a loop, and then wrapped within a bigger template - e.g. when creating an HTML `<ul>` list tag. This is easily achieved:

    var ul = "<ul>{{list}}</ul>",
        li = "<li>{{contents}}</li>",
        myList = "",
        i;
        
    for (i=100; i<103; i++){
        myList += tim(li, {contents: i});
    }
    tim(ul, {list: myList});
    // "<ul><li>100</li><li>101</li><li>102</li></ul>"
        

## Debugging
If your template references a path in the data object that could not actually be found, then Tim will throw an error saying something like:

    tim: 'foo' not found in {{config.foo.bar}}
    
This helps with debugging when creating templates.

If you want to save precious few bytes, and you are certain that your templates will never fail, then feel free to rip out this block: "`if (lookup === undef){ [...] }`"


## `notFound`: an optional third argument
As an alternative to the default debug errors, you can pass an optional third argument "`notFound`", which will be used as the default substitution string, when a property is not found in the data object.

e.g.

    tim(
        "Results: {{a}}, {{b}}, {{c}}",
        {
            a: "foo",
            b: "bar"
        },
        "n/a"
    );
    // "Results: foo, bar, n/a"
    
For the `notFound` subsitution string, you might want to use HTML or simply an empty string `""`.


## Using arrays
The data can be, or can include, an array. Use dot notation to access the array elements.

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


## Changing the {{delimiter}}
By default, template tags are delimited by "{{" and "}}".
To change this, edit the `starts` and `ends` vars below.


## Embedding micro-templates in an HTML document
A little known aspect of browser parsing of HTML documents is that if a document contains a `<script>` tag that has a non-standard `type` attribute, then the browser will not attempt to parse the script element - but it will allow us to grab its contents. This leads us to a very useful coding pattern:

in the HTML, add a script tag with any non-standard type:

    <script type="text/template" id="foo">
        <p><a href='{{url}}'>{{title}}</a></p>
    </script>
    
and in the JavaScript, grab the script element by its `id` and extract its contents:

    var myTemplate = document.getElementById("foo").innerHTML,
        data = {
            title: "Dharmafly",
            url:   "http://dharmafly.com"
        };
        
    var myHTML = tim(myTemplate, data);
    // "<p><a href='http://dharmafly.com'>Dharmafly</a></p>"

then do something with your newly populated template, like replace an element in the DOM with it:

    document.getElementById("bar").innerHTML = myHTML;

Working in this way brings some sanity back to application
development, where you want to specify the markup structure, but swap in specific text and attributes, or whole blocks of markup.

It also makes your code more maintainable - the markup templates can live with the rest of the static markup on a page, where the markup coder can access it, and the JavaScript logic lives in an entirely
different place.

## Feedback
Do you have any issues, questions or suggestions? See [github.com/premasagar/tim/issues](http://github.com/premasagar/tim/issues), or contact me ([@premasagar](http://twitter.com/premasagar))
