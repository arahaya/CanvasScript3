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
        
        this.__set__delay(delay);
    };
    this.reset = function()
    {
        this.stop();
        this.__currentCount = 0;
    };
    this.start = function()
    {
        this.__running = true;
        this.__timer = setInterval(cs3.utils.closure(this, function()
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
    
    this.__get__currentCount = function()
    {
        return this.__currentCount;
    };
    this.__get__delay = function()
    {
        return this.__delay;
    };
    this.__set__delay = function(v)
    {
        v = +v;
        if (v < 0 || v == Infinity) {
            throw new RangeError('Error #2066: The Timer delay specified is out of range.');
        }
        this.__delay = v;
    };
    this.__get__repeatCount = function()
    {
        return this.__repeatCount;
    };
    this.__set__repeatCount = function(v)
    {
        this.__repeatCount = v | 0;
    };
    this.__get__running = function()
    {
        return this.__running;
    };
    
    this.toString = function()
    {
        return '[object Timer]';
    };
});
