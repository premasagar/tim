// Basic data substitution of an object property with its value (does not support dot-syntax)
tim.plugin(
    "token",
    
    function(token, data){
        return data[token];
    },
    
    {
        match: function(token, data){
            return typeof data === "object" && typeof data[token] !== "undefined"; 
        }
    }
);