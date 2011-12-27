// Match arrays in {{#blocks}}; iterate through each key
tim.plugin(
    "block",
    
    function(template, array, payload){
        var i = 0,
            len = array.length,
            newTemplate = "",
            subPayload = tim.extend({}, payload, {array:array, arrayLength:array.length});
            
        for (i=0, len = array.length; i<len; i++){
            // Transform the sub-template with "arrayElement" parsers
            subPayload.arrayIndex = i;
            newTemplate += tim.parse("arrayElement", template, array[i], subPayload);
        }
        return newTemplate;
    },
    
    {
        match: function(template, data){
            return tim.isArray(data);
        }
    }
);

//

// Parsing for array elements
(function(){
    var this_regex = tim.regex({name:"this", flags:"g"});
    
    // Replace "{{this}}" in templates with the data, e.g. for use with arrays
    tim.plugin("arrayElement", function(template, arrayElement, payload){
        template = template.replace(this_regex, arrayElement.toString());
        return tim(template, arrayElement);
    });
}());