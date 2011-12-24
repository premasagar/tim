// Simple, single template tags (top-level parser)
tim.plugin("template", function(template, data, payload){
    var tagRegex = this.tagRegex,
        result, token, replacement;
    
    // Reset regular expression pointer
    tagRegex.lastIndex = 0;

    while((result = tagRegex.exec(template)) !== null){
        token = result[1];
        replacement = this.parse("token", token, data, payload);
    
        if (replacement !== token){
            template =  template.slice(0, result.index) +
                        replacement +
                        template.slice(tagRegex.lastIndex);
        
            tagRegex.lastIndex += (replacement.length - result[0].length);
        }
    }

    // Reset regular expression pointer
    tagRegex.lastIndex = 0;
    
    return template;
});