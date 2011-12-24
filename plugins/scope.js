// Fallback for blocks: if a template tag is present, then tim() with run in the new scope
tim.plugin(
    "block",

    function(template, data){
        return tim(template, data);
    },

    {match: tim.tagRegex, priority: 100}
);