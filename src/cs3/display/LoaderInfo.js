var LoaderInfo = new Class(EventDispatcher, function()
{
    this.__init__ = function()
    {
        EventDispatcher.call(this);
        this.__content = null;
        this.__width = 0;
        this.__height = 0;
    };
    
    /* getters and setters */
    this.getContent = function()
    {
        return this.__content;
    };
    this.getWidth = function()
    {
        return this.__width;
    };
    this.getHeight = function()
    {
        return this.__height;
    };
});
LoaderInfo.prototype.__defineGetter__("content", LoaderInfo.prototype.getContent);
LoaderInfo.prototype.__defineGetter__("width", LoaderInfo.prototype.getWidth);
LoaderInfo.prototype.__defineGetter__("height", LoaderInfo.prototype.getHeight);
LoaderInfo.prototype.toString = function()
{
    return '[object LoaderInfo]';
};
