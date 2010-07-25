var EventListener = new Class(Object, function()
{
    this.__init__ = function(scope, callback, useCapture, priority)
    {
        this.scope = scope;
        this.callback = callback;
        this.useCapture = useCapture ? true : false;
        this.priority = priority | 0;
    };
    
    this.call = function()
    {
        this.callback.apply(this.scope, arguments);
    };
    
    this.equals = function(toCompare)
    {
        if (toCompare.scope !== this.scope)
        {
            return false;
        }
        if (toCompare.callback !== this.callback)
        {
            return false;
        }
        if (toCompare.useCapture !== this.useCapture)
        {
            return false;
        }
        return true;
    };
    
    this.toString = function()
    {
        return '[object EventListener]';
    };
});
