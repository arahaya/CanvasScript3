var ContextFilter = new Class(Object, function()
{
    this.__filter = function(context, target)
    {
    };
    this.clone = function()
    {
        return new ContextFilter();
    };
});
ContextFilter.prototype.toString = function()
{
    return '[object ContextFilter]';
};
