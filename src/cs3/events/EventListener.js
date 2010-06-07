var EventListener = new Class(Object, function()
{
    this.__init__ = function(scope, callback)
    {
        this.scope = scope;
        this.callback = callback;
        //this.useCapture = (useCapture) ? true : false;
        //this.priority = priority | 0;
    };
    this.call = function()
    {
        this.callback.apply(this.scope, arguments);
    };
    this.equals = function(toCompare)
    {
        return (
            toCompare.scope === this.scope &&
            toCompare.callback === this.callback) ? true : false;
    };
});
EventListener.prototype.toString = function()
{
    return '[object EventListener]';
};
