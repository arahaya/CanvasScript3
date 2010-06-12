var Timer = new Class(EventDispatcher, function()
{
    this.__init__ = function(delay, repeatCount)
    {
        EventDispatcher.call(this);
        this.__currentCount = 0;
        this.__delay = 0;
        this.__repeatCount = repeatCount | 0;
        this.__running = false;
        this.__timer = null;
        
        this.setDelay(delay);
    };
    this.reset = function()
    {
        this.stop();
        this.__currentCount = 0;
    };
    this.start = function()
    {
        this.__running = true;
        this.__timer = setInterval(__closure(this, function()
        {
            this.__currentCount++;
            
            this.dispatchEvent(new TimerEvent(TimerEvent.TIMER, false, false));
            
            if (this.__repeatCount && this.__repeatCount <= this.__currentCount) {
                this.dispatchEvent(new TimerEvent(TimerEvent.TIMER_COMPLETE, false, false));
                this.stop();
            }
        }), this.__delay);
    };
    this.stop = function()
    {
        clearInterval(this.__timer);
        this.__running = false;
    };
    
    this.getCurrentCount = function()
    {
        return this.__currentCount;
    };
    this.getDelay = function()
    {
        return this.__delay;
    };
    this.setDelay = function(v)
    {
        v = +v;
        if (v < 0 || v == Infinity) {
            throw new RangeError('Error #2066: The Timer delay specified is out of range.');
        }
        this.__delay = v;
    };
    this.getRepeatCount = function()
    {
        return this.__repeatCount;
    };
    this.setRepeatCount = function(v)
    {
        this.__repeatCount = v | 0;
    };
    this.getRunning = function()
    {
        return this.__running;
    };
});
Timer.prototype.__defineGetter__("currentCount", Timer.prototype.getCurrentCount);
Timer.prototype.__defineGetter__("delay", Timer.prototype.getDelay);
Timer.prototype.__defineSetter__("delay", Timer.prototype.setDelay);
Timer.prototype.__defineGetter__("repeatCount", Timer.prototype.getRepeatCount);
Timer.prototype.__defineSetter__("repeatCount", Timer.prototype.setRepeatCount);
Timer.prototype.__defineGetter__("running", Timer.prototype.getRunning);
Timer.prototype.toString = function()
{
    return '[object Timer]';
};
