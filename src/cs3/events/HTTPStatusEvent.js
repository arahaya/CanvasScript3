var HTTPStatusEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, status)
    {
        Event.call(this, type, bubbles, cancelable);
        this.status = status | 0;
    };
	
    this.clone = function()
    {
        return new HTTPStatusEvent(this.type, this.bubbles, this.cancelable, this.status);
    };
    
    this.toString = function()
    {
        return '[HTTPStatusEvent type=' + this.type +
                ' bubbles=' + this.bubbles +
                ' cancelable=' + this.cancelable +
                ' status=' + this.status + ']';
    };
});
HTTPStatusEvent.HTTP_STATUS = 'httpStatus';
