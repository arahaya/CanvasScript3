var InteractiveObject = new Class(DisplayObject, function()
{
    this.__init__ = function()
    {
        DisplayObject.call(this);
        //this.doubleClickEnabled = true;
        this.mouseEnabled = true;
        //this.tabEnabled = true;
        //this.tabIndex = 0;
        //this.focusRect = null;
    };
    
    this.toString = function()
    {
        return '[object InteractiveObject]';
    };
});
