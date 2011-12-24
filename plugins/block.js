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
        
        // Sub-template and payload for processing the block
        subtemplate = subtemplate.slice(0, posClosingTokenSubtemplate);
        subPayload = tim.extend({}, payload, {token: token, previousData: data});
        
        // Transform the sub-template with "block" parsers
        subtemplate = tim.parse("block", subtemplate, data[token], subPayload);
        
        // Positions
        posClosingTokenStart = posOpeningTagEnd + posClosingTokenSubtemplate;
        posClosingTokenEnd = posClosingTokenStart + closingTag.length;
        
        return template.slice(0, posOpeningTagStart) + subtemplate + template.slice(posClosingTokenEnd);
    },
    
    {
        // Only trigger when the token beings with "#"
        match: tim.regex({prefix: "#"}),
        // Make sure this is in place before the main `template` loop
        priority: -100
    }
);