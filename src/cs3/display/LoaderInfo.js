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
    this.__get__content = function()
    {
        return this.__content;
    };
    this.__get__width = function()
    {
        return this.__width;
    };
    this.__get__height = function()
    {
        return this.__height;
    };
    
    this.toString = function()
    {
        return '[object LoaderInfo]';
    };
});
