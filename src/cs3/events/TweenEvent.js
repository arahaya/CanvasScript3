var TweenEvent = new Class(Event, function()
{
    this.__init__ = function(type, time, position, bubbles, cancelable)
    {
        Event.call(this, type, bubbles, cancelable);
        this.time = time;
        this.position = position;
    };
    
    this.clone = function()
    {
        return new TweenEvent(this.type, this.time, this.position, this.bubbles, this.cancelable);
    };
    
    this.toString = function()
    {
        return '[TweenEvent' +
                ' type=' + this.type +
                ' time=' + this.time +
                ' position=' + this.position +
                ' bubbles=' + this.bubbles +
                ' cancelable=' + this.cancelable + ']';
    };
});
TweenEvent.MOTION_CHANGE = 'motionChange';
TweenEvent.MOTION_FINISH = 'motionFinish';
TweenEvent.MOTION_LOOP = 'motionLoop';
TweenEvent.MOTION_RESUME = 'motionResume';
TweenEvent.MOTION_START = 'motionStart';
TweenEvent.MOTION_STOP = 'motionStop';
