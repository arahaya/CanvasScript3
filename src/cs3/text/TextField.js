var TextField;
(function()
{
    TextField = new Class(InteractiveObject, function()
    {
        //context used for measureing text width
        var textCanvas = cs3.utils.createCanvas(0, 0);
        var textContext = cs3.utils.getContext2d(textCanvas);
        
        var formatToFont = function(format)
        {
            var font = (format.italic) ? "italic " : "";
            font += (format.bold) ? "bold " : "";
            font += format.size + "px '" + format.font + "'";
            return font;
        };
        
        this.__init__ = function()
        {
            InteractiveObject.call(this);
            this.__buffer = "";
            this.__lines = [];
            this.__formats = [];
            this.__textWidth = 0;
            this.__textHeight = 0;
            this.__defaultTextFormat = new TextFormat();
            
            this.__autoSize = true;//allways true for now
            
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
        this.__render = function(context, colorTransform)
        {
            var bounds = this.__getContentBounds();
            var buffer = this.__buffer;
            var lines  = this.__lines;
            var defaultFormat = this.__defaultTextFormat;
            var lineHeight = defaultFormat.size + defaultFormat.leading;
            var lineWidth = this.__textWidth;
            
            //add 1px margin on each side
            var offsetX = 1;
            var offsetY = 1;
            if (this.border) {
                var borderColor = (colorTransform) ?
                        colorTransform.transformColor(this.borderColor) :
                        this.borderColor;
                
                //shift the margin 1px more
                offsetX = 2;
                offsetY = 2;
                
                //border changes the rect size
                context.fillStyle = __toRGB(borderColor);
                context.beginPath();
                context.rect(0, 0, bounds.width, bounds.height);
                context.stroke();
                
                context.beginPath();
                context.rect(1, 1, bounds.width - 2, bounds.height - 2);
            }
            else {
                context.beginPath();
                context.rect(0, 0, bounds.width, bounds.height);
            }
            
            if (this.background) {
                var backgroundColor = (colorTransform) ?
                        colorTransform.transformColor(this.backgroundColor) :
                        this.backgroundColor;
                context.fillStyle = __toRGB(backgroundColor);
                context.fill();
            }
            
            context.save();
            context.clip();
            context.beginPath();
            
            var align = defaultFormat.align;
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
            
            context.textBaseline = 'top';
            
            if (align == TextFormatAlign.JUSTIFY) {
                //TODO
                return;
            }
            else {
                for (i = 0, l = lines.length; i < l; ++i)
                {
                    var line = lines[i];
                    var blocks = line.blocks;
                    for (var ii = 0, ll = blocks.length; ii < ll; ++ii)
                    {
                        var block = blocks[ii];
                        var str = buffer.slice(block.start, block.end + 1);
                        var format = block.format;
                        context.font = formatToFont(format);
                        context.fillStyle = (colorTransform) ?
                                __toRGB(colorTransform.transformColor(format.color)) :
                                __toRGB(format.color);
                        context.fillText(str, offsetX + block.x, offsetY + block.y + (line.height - block.height));
                    }
                }
            }
            
            context.restore();
        };
        
        //override
        this.__hitTestPoint = function(context, matrix, point)
        {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            return bounds.containsPoint(localPoint);
        };
        
        
        this.__setTextFormat = function(format, beginIndex, endIndex)
        {
            var formats = this.__formats;
            for (var i = beginIndex; i < endIndex; ++i)
            {
                formats[i] = format;
            }
            trace(formats);
        };
        /**
         * update the visual lines and blocks.
         * TODO: add word wrap
         */
        this.__updateBlocks = function()
        {
            var context = textContext;
            var buffer = this.__buffer;
            var defaultFormat = this.__defaultTextFormat;
            var formats = this.__formats;
            var lines = [];
            
            //calculate the width and height of each line(block)
            var temp = [];
            var format = defaultFormat;
            var width = 0;
            var height = 0;
            
            //start the first line
            var line = new Line(0, 0, 0, 0, 0, format.size);
            //start the first block
            var block = new Block(format, 0, 0, 0, 0, 0, format.size);
            context.font = formatToFont(format);
            
            for (var i = 0, l = buffer.length; i < l; ++i)
            {
                var chr = buffer[i];
                
                if (formats[i] !== format) {
                    //textFormat has changed
                    if (temp.length) {
                        //update the block width
                        block.width = context.measureText(temp.join("")).width;
                        //update the line width
                        line.width += block.width;
                    }
                    
                    //close the block
                    block.end = i - 1;
                    line.blocks.push(block);
                    
                    //start the new format
                    format = formats[i];
                    trace(1);
                    trace(i);
                    trace(format);
                    trace(2);
                    context.font = formatToFont(format);
                    trace(3);
                    //start a new block
                    block = new Block(format, i, 0, line.width, line.y, 0, format.size);
                    
                    //update the line height
                    line.height = Math.max(line.height, block.height);
                    
                    temp = [];
                }
                
                //if (chr !== "\n") {
                    temp.push(chr);
                //}
                
                if (chr === "\n" || i == (l - 1)) {
                    //EOL or EOF
                    if (temp.length) {
                        //update the block width
                        block.width = context.measureText(temp.join("")).width;
                        //update the line width
                        line.width += block.width;
                    }
                    
                    //close the block
                    block.end = i;
                    line.blocks.push(block);
                    
                    //close the line
                    line.end = i;
                    lines.push(line);
                    
                    //update the total width and height
                    width  = (line.width > width) ? line.width : width;
                    height = line.y + line.height;
                    
                    //start a new line
                    line = new Line(i + 1, 0, 0, height + format.leading, 0, format.size);
                    
                    //start a new block
                    block = new Block(format, i + 1, 0, 0, line.y, 0, format.size);
                    
                    temp = [];
                }
            }
            
            this.__lines  = lines;
            this.__textWidth = width + 2;//add 1px margin on each side
            this.__textHeight = height + 2;
            this.__modified = true;
        };
        
        this.appendText = function(newText)
        {
            var length = this.__buffer.length;
            this.replaceText(length, length, newText);
        };
        this.replaceText = function(beginIndex, endIndex, newText)
        {
            newText = newText.replace(/\r\n/gim, "\n");
            newText = newText.replace(/\r/gim, "\n");
            
            var buffer = this.__buffer;
            this.__buffer = buffer.substring(0, beginIndex) + newText + buffer.substring(endIndex);
            
            this.__setTextFormat(this.__defaultTextFormat, beginIndex, beginIndex + newText.length);
            this.__updateBlocks();
        };
        this.setTextFormat = function(format, beginIndex, endIndex)
        {
            if (beginIndex == -1) {
                beginIndex = 0;
            }
            if (endIndex == -1) {
                endIndex = this.__buffer.length;
            }
            
            this.__setTextFormat(format, beginIndex, endIndex);
            this.__updateBlocks();
        };
        
        /* getters and setters */
        this.__get__length = function()
        {
            return this.__buffer.length;
        };
        this.__get__numLines = function()
        {
            return this.__lines.length;
        };
        this.__get__text = function()
        {
            return this.__buffer;
        };
        this.__set__text = function(v)
        {
            this.__buffer = "";
            this.__formats = [];
            this.appendText(v);
        };
        this.__get__defaultTextFormat = function()
        {
            //TODO clone it
            return this.__defaultTextFormat;
        };
        this.__set__defaultTextFormat = function(v)
        {
            this.__defaultTextFormat = v;
            this.__updateBlocks();
        };
        
        this.toString = function()
        {
            return '[object TextField]';
        };
    });
    
    var Line = new Class(Object, function()
    {
        this.__init__ = function(start, end, x, y, width, height)
        {
            this.start = start;
            this.end = end;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.blocks = [];
        };
    });
    
    var Block = new Class(Object, function()
    {
        this.__init__ = function(format, start, end, x, y, width, height)
        {
            this.format = format;
            this.start = start;
            this.end = end;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        };
    });
})();
