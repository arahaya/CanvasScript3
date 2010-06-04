var Tween = new Class(EventDispatcher, function()
{
    this.__init__ = function(obj, prop, func, begin, finish, duration, useSeconds)
    {
        EventDispatcher.call(this);
        this.__duration = duration;
        this.__finish = finish;
        this.__FPS = undefined;
        this.__position = 0;
        this.__time = 0;
        this.begin = begin;
        this.func = func;
        this.isPlaying = false;
        this.looping = false;
        this.obj = obj;
        this.prop = prop;
        this.useSeconds = (useSeconds) ? true : false;
    };
    this.continueTo = function(finish, duration)
    {
        
    };
    this.fforward = function()
    {
        
    };
    this.nextFrame = function()
    {
        
    };
    this.prevFrame = function()
    {
        
    };
    this.resume = function()
    {
        
    };
    this.rewind = function()
    {
        
    };
    this.start = function()
    {
        
    };
    this.stop = function()
    {
        
    };
    this.yoyo = function()
    {
        
    };
    
    /* getters and setters */
    this.getDuration = function()
    {
        return this.__duration;
    };
    this.setDuration = function(v)
    {
        this.__duration = v;
    };
    this.getFinish = function()
    {
        return this.__finish;
    };
    this.setFinish = function(v)
    {
        this.__finish = v;
    };
    this.getFPS = function()
    {
        return this.__FPS;
    };
    this.setFPS = function(v)
    {
        this.__FPS = v;
    };
    this.getPosition = function()
    {
        return this.__position;
    };
    this.setPosition = function(v)
    {
        this.__position = v;
    };
    this.getTime = function()
    {
        return this.__time;
    };
    this.setTime = function(v)
    {
        this.__time = v;
    };
});
Tween.prototype.__defineGetter__("duration", Tween.prototype.getDuration);
Tween.prototype.__defineSetter__("duration", Tween.prototype.setDuration);
Tween.prototype.__defineGetter__("finish", Tween.prototype.getFinish);
Tween.prototype.__defineSetter__("finish", Tween.prototype.setFinish);
Tween.prototype.__defineGetter__("FPS", Tween.prototype.getFPS);
Tween.prototype.__defineSetter__("FPS", Tween.prototype.setFPS);
Tween.prototype.__defineGetter__("position", Tween.prototype.getPosition);
Tween.prototype.__defineSetter__("position", Tween.prototype.setPosition);
Tween.prototype.__defineGetter__("time", Tween.prototype.getTime);
Tween.prototype.__defineSetter__("time", Tween.prototype.setTime);
Tween.prototype.toString = function()
{
    return '[object Tween]';
};
