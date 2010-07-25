var ProgressEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, bytesLoaded, bytesTotal)
    {
        Event.call(this, type, bubbles, cancelable);
        this.bytesLoaded = bytesLoaded | 0;
        this.bytesTotal = bytesTotal | 0;
    };
    
    this.clone = function()
    {
        return new ProgressEvent(this.type, this.bubbles, this.cancelable, this.bytesLoaded, this.bytesTotal);
    };
    
    this.toString = function()
    {
        return '[ProgressEvent type=' + this.type +
                ' bubbles=' + this.bubbles +
                ' cancelable=' + this.cancelable +
                ' bytesLoaded=' + this.bytesLoaded +
                ' bytesTotal=' + this.bytesTotal + ']';
    };
});
ProgressEvent.PROGRESS = 'progress';
