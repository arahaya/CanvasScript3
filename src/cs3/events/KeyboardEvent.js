var KeyboardEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, charCode, keyCode, keyLocation, ctrlKey, altKey, shiftKey)
    {
        Event.call(this, type, bubbles, cancelable);
        this.altKey = (altKey) ? true : false;
        this.charCode = charCode | 0;
        this.ctrlKey = (ctrlKey) ? true : false;
        this.keyCode = keyCode | 0;
        this.keyLocation = keyLocation || 0;
        this.shiftKey = (shiftKey) ? true : false;
    };
    this.clone = function()
    {
        return new KeyboardEvent(this.type, this.bubbles, this.cancelable,
            this.charCode, this.keyCode, this.keyLocation, this.ctrlKey, this.altKey, this.shiftKey);
    };
    this.updateAfterEvent = function()
    {
        //todo
    };
    
    this.toString = function()
    {
        return '[KeyboardEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
            ' charCode=' + this.charCode + ' keyCode=' + this.keyCode + ' keyLocation=' + this.keyLocation +
            ' ctrlKey=' + this.ctrlKey + ' altKey=' + this.altKey + ' shiftKey=' + this.shiftKey + ']';
    };
});
KeyboardEvent.KEY_DOWN = 'keyDown';
KeyboardEvent.KEY_UP = 'keyUp';
