// Basic data substitution of an object property with its value (does not support dot-syntax)
tim.plugin("token", function(token, data){
    if (token in data){
        return data[token];
    }
});