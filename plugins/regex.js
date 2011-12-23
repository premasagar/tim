// Function to generate a token-matching regular expression
/* Options:
    `whitespace`: is leading and trailing whitespace OK ? (bool, default false)
    `closing`: is this a closing tag? (bool, default false)
    `prefix`: a string before the token
    `suffix`: a string at the end of the token
    `flags`: flags for the regular expression (string, default "gi" - executes globally on the string and is case-insensitive)
    `name`: the specific name of the token (string, default is a wildcard for any text)
*/
tim.regex = function(options){
    options || (options = {});
    
    return new RegExp(
        // "{{"
        this.startToken +
        
            // Whitespace at start?
            (!options.whitespace !== false ? "\\s*" : "") +
            
            // Is this a block close tag? If so, start the token a closing forward-slash "/"
            (options.closing ? "/" : "") + 
            
            // Prefix at the start of the token
            (options.prefix || "") +
                
            // Back-reference: any text that is not the end token
            (options.name || "((?:.(?!" + this.endToken + "))*.?)") +
            
            // Suffix at the end of the token
            (options.suffix || "") +
            
            // Whitespace at end?
            (options.whitespace !== false ? "\\s*" : "") +
        
        // e.g. "}}"
        this.endToken,
        
        // Regular expression flags
        options.flags || "gi"
    );
};

//

// Cache the regular expression for general template tags
tim.tagRegex = tim.regex();