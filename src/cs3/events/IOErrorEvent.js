var IOErrorEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, text)
    {
        Event.call(this, type, bubbles, cancelable);
        this.text = (text !== undefined) ? text : "IOError";
    };
    this.clone = function()
    {
        return new IOErrorEvent(this.type, this.bubbles, this.cancelable, this.text);
    };
});
IOErrorEvent.IO_ERROR = 'ioError';
IOErrorEvent.prototype.toString = function()
{
    return '[IOErrorEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
        ' text=' + this.text + ']';
};
