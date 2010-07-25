var TimerEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable)
    {
        Event.call(this, type, bubbles, cancelable);
    };
    
    this.clone = function()
    {
        return new TimerEvent(this.type, this.bubbles, this.cancelable);
    };
    
    this.updateAfterEvent = function()
    {
        //todo
    };
    
    this.toString = function()
    {
        return '[TimerEvent type=' + this.type +
                ' bubbles=' + this.bubbles +
                ' cancelable=' + this.cancelable + ']';
    };
});
TimerEvent.TIMER = 'timer';
TimerEvent.TIMER_COMPLETE = 'timerComplete';
