var TextField = new Class(InteractiveObject, function()
{
    this.__init__ = function()
    {
        InteractiveObject.call(this);
        this.__buffer = [];
        this.__textWidth = 0;
        this.__textHeight = 0;
        this.__defaultTextFormat = new TextFormat();
        
        this.background = false;
        this.backgroundColor = 0xFFFFFF;
        this.border = false;
        this.borderColor = 0;
    };
    //override
    this.__getContentBounds = function()
    {
        if (this.border) {
            //border changes the rect size
            return new Rectangle(0, 0, this.__textWidth + 2, this.__textHeight + 2);
        }
        return new Rectangle(0, 0, this.__textWidth, this.__textHeight);
    };
    //override
    this.__getModified = function()
    {
        return this.__modified || this.__transform.__modified;
    };
    //override
    this.__setModified = function(v)
    {
        this.__modified = v;
        this.__transform.__modified = v;
    };
    //override
    this.__render = function(context, matrix, color, rects)
    {
        var bounds = this.__getContentBounds();
        
        //convert local bounds to global coords
        var globalBounds = matrix.transformRect(bounds);
        
        //hit test
        var doRender = false;
        for (var i = 0, l = rects.length; i < l; ++i)
        {
            if (globalBounds.intersects(rects[i])) {
                doRender = true;
                break;
            }
        }
        if (!doRender) {
            return;
        }
        
        //render
        var buffer = this.__buffer;
        var format = this.__defaultTextFormat;
        var lineHeight = format.size + format.leading;
        var lineWidth = this.__textWidth;
        
        //add 1px margin on each side
        var offsetX = 1;
        var offsetY = 1;
        if (this.border) {
            //shift the margin 1px more
            offsetX = 2;
            offsetY = 2;
            
            //border changes the rect size
            context.fillStyle = __toRGB(this.borderColor);
            context.beginPath();
            context.rect(0, 0, bounds.width, bounds.height);
            //do not use stroke for borders because for some reason
            //the lines will not become solid(maybe in Chrome only)
            context.fill();
            
            context.beginPath();
            context.rect(1, 1, bounds.width - 2, bounds.height - 2);
        }
        else {
            context.beginPath();
            context.rect(0, 0, bounds.width, bounds.height);
        }
        
        if (this.background) {
            context.fillStyle = __toRGB(this.backgroundColor);
            context.fill();
        }
        
        context.clip();
        context.beginPath();
        context.fillStyle = __toRGB(format.color);
        
        var align = format.align;
        if (align == TextFormatAlign.RIGHT) {
            context.textAlign = 'right';
            //with no border offsetX = lineWidth - 1 to add a 1px right margin
            //with border it gets shifted 1px to the right and offsetX = lineWidth - 1 + 1
            offsetX = lineWidth - 2 + offsetX;
        }
        else if (align == TextFormatAlign.CENTER) {
            context.textAlign = 'center';
            //with no border offsetX = lineWidth / 2
            //with border offsetX = lineWidth / 2 + 1
            offsetX = lineWidth / 2 - 1 + offsetX;
        }
        else {
            //case LEFT or JUSTIFY
            context.textAlign = 'left';
        }
        
        var font = (format.italic) ? "italic " : "";
        font += (format.bold) ? "bold " : "";
        font += format.size + "px '" + format.font + "'";
        
        context.font = font;
        context.textBaseline = 'top';
        
        if (align == TextFormatAlign.JUSTIFY) {
            //TODO need a better algorithm
            for (i = 0, l = buffer.length; i < l; ++i)
            {
                var row = buffer[i];
                var rowLength = row.length;
                var perChar = lineWidth / rowLength;
                for (var ii = 0; ii < rowLength; ++ii)
                {
                    context.fillText(row[ii], offsetX + perChar * ii, offsetY + i * lineHeight);
                }
                
            }
        }
        else {
            for (i = 0, l = buffer.length; i < l; ++i)
            {
                context.fillText(buffer[i], offsetX, offsetY + i * lineHeight);
            }
        }
    };
    //override
    this.__renderPoint = function(context, matrix, point)
    {
        var bounds = this.__getContentBounds();
        
        //convert local bounds to global coords
        var globalBounds = matrix.transformRect(bounds);
        
        if (globalBounds.containsPoint(point)) {
            context.beginPath();
            context.rect(0, 0, bounds.width, bounds.height);
            context.fill();
        }
    };
    /**
     * update width and height and set modified flag to TRUE
     */
    this.__updateRect = function()
    {
        var context = cs3.core.testContext;
        var width = 0;
        var height = 0;
        var buffer = this.__buffer;
        var format = this.__defaultTextFormat;
        var lineHeight = format.size + format.leading;
        
        var font = (format.italic) ? "italic " : "";
        font += (format.bold) ? "bold " : "";
        font += format.size + "px '" + format.font + "'";
        
        context.font = font;
        for (var i = 0, l = buffer.length; i < l; ++i)
        {
            var testWidth = context.measureText(buffer[i]).width;
            width = (testWidth > width) ? testWidth : width;
            height += lineHeight;
        }
        
        this.__textWidth = width + 2;//add 1px margin on each side
        this.__textHeight = height + 2;
        this.__modified = true;
    };
    
    /* getters and setters */
    this.getText = function()
    {
        return this.__buffer.join("\n");
    };
    this.setText = function(v)
    {
        v = v.replace(/\r\n/gim, "\n");
        v = v.replace(/\r/gim, "\n");
        this.__buffer = v.split("\n");
        this.__updateRect();
    };
    this.getDefaultTextFormat = function()
    {
        //TODO clone it
        return this.__defaultTextFormat;
    };
    this.setDefaultTextFormat = function(v)
    {
        this.__defaultTextFormat = v;
        this.__updateRect();
    };
});
TextField.prototype.__defineGetter__("text", TextField.prototype.getText);
TextField.prototype.__defineSetter__("text", TextField.prototype.setText);
TextField.prototype.__defineGetter__("defaultTextFormat", TextField.prototype.getDefaultTextFormat);
TextField.prototype.__defineSetter__("defaultTextFormat", TextField.prototype.setDefaultTextFormat);
TextField.prototype.toString = function()
{
    return '[object TextField]';
};
