var ContextFilter = new Class(Object, function()
{
    this.__filter = function(context, target)
    {
    };
    this.__generateRect = function(sourceRect)
    {
    };
    this.clone = function()
    {
        return new ContextFilter();
    };
    
    this.toString = function()
    {
        return '[object ContextFilter]';
    };
});
