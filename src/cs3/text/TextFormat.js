var TextFormat = new Class(Object, function()
{
    this.__init__ = function()
    {
        this.align = TextFormatAlign.LEFT;
        this.bold = false;
        this.color = 0;
        this.font = "Times New Roman";
        this.italic = false;
        this.leading = 0;
        this.size = 12;
    };
});
