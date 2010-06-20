var TextFormat = new Class(Object, function()
{
    this.__init__ = function(font, size, color, bold, italic, underline, url, target, align, leftMargin, rightMargin, indent, leading)
    {
        this.align = (align) ? align : TextFormatAlign.LEFT;
        this.blockIndent = 0;
        this.bold = (bold) ? true : false;
        this.bullet = false;
        this.color = color | 0;
        this.font = (font) ? font : "Times New Roman";//TODO MacOS should be 'Times'
        this.indent = (indent) ? indent : 0;
        this.italic = (italic) ? true : false;
        this.kerning = false;
        this.leading = (leading) ? leading : 0;
        this.leftMargin = (leftMargin) ? leftMargin : 0;
        this.rightMargin = (rightMargin) ? rightMargin : 0;
        this.size = (size) ? size : 12;
        this.tabStops = [];
        this.target = (target) ? target : "";
        this.underline = (underline) ? true : false;
        this.url = (url) ? url : "";
    };
    
    this.toString = function()
    {
        return '[object TextFormat]';
    };
});
