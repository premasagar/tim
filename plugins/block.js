// Create the block parser plugin, e.g. "{{#foo}} bar {{/foo}}"
tim.plugin(
    // Transforms the top-level template
    "template",

    // Intercept template whenever an opening `block` tag is detected and replace the block with a sub-template
    function(template, data, payload, env){
        // The token, from the back-reference in the plugin's `match` regular expression (see `tim.regex({prefix: "#"})` below)
        var matches = env.matches,
            token = matches[1],
            closingTag = this.startToken + "/" + token + this.endToken,
            posOpeningTagStart = matches.index,
            posOpeningTagEnd = matches.lastIndex,
            subtemplate = template.slice(posOpeningTagEnd),
            posClosingTokenSubtemplate = subtemplate.indexOf(closingTag),
            posClosingTokenStart, posClosingTokenEnd, subPayload;

        // No closing token found
        if (posClosingTokenSubtemplate === -1){
            tim.trigger("error", "Missing closing token in block", this, subtemplate, arguments);
            return;
        }
        
        subtemplate = subtemplate.slice(0, posClosingTokenSubtemplate);
        posClosingTokenStart = posOpeningTagEnd + posClosingTokenSubtemplate;
        posClosingTokenEnd = posClosingTokenStart + closingTag.length;
        
        // Convert sub-template
        subPayload = tim.extend({}, payload, {token: token});
        
        // Trigger "block" parsers
        subtemplate = tim.parse("block", subtemplate, data, subPayload);
        
        return template.slice(0, posOpeningTagStart) + subtemplate + template.slice(posClosingTokenEnd);
    },
    
    {
        // Only trigger when the token beings with "#"
        match: tim.regex({prefix: "#"}),
        // Make sure this is in place before the main `template` loop
        priority: -100
    }
);


tim.plugin("block", function(template, data, payload){
    var token = payload.token,
        lookup = data[token];

    if (lookup === null || lookup === false){
        return "";
    }
    
    if (typeof lookup === "object"){
        // TODO: arrays and object keys and elements
        // iterate through array, one sub-template for each element?
        // iterate through object?
        return tim(template, lookup);
    }
        
    // TODO: strings + numbers lookup template.cache(templateName)
});