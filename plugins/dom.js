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
    
    return templatesInDom;
};

//

// If caching is available, then cache the DOM on first use of Tim
tim.ready(function(){
    if (tim.cache){
        // Cache all DOM templates
        tim.cache(tim.dom());
    }
});