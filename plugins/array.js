// Replace "{{this}}" in templates with the data, e.g. for use with arrays
tim.plugin(
    "token",
    
    function(token, data){
        return data.toString();
    },
    
    {match:"this", priority:-100}
);

//

// Match arrays in {{#blocks}}; iterate through each key
tim.plugin(
    "block",
    
    function(template, array){
        var i = 0,
            len = array.length,
            newTemplate = "";
            
        for (i=0, len = array.length; i<len; i++){
            newTemplate += tim(template, array[i]);
        }
        return newTemplate;
    },
    
    {
        match: function(template, data){
            return tim.isArray(data);
        }
    }
);