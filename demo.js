// Console logging, for development
window.O = function(){
    if (window.console){
        window.console.log.apply(window.console, arguments);
    }
};


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
    tim("{{#quotes}}{{frankie}}{{/quotes}} {{foo}} {{bar}} {{:foobar}} {{deep.foo}} {{#array}}{{this}}{{/array}}",
        {
            foo:"MOO",
            bar:"BAA",
            deep:{
                foo:"bling"
            },
            quotes: {
                frankie:"relax"
            },
            array: [1,2,3]
        }
    )
);