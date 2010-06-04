var EventDispatcher = new Class(Object, function()
{
    this.__init__ = function()
    {
        this.__events = {};
    };
    this.addEventListener = function(type, listener, useCapture, priority)
    {
        //TODO useCapture, priority
        if (this.__events[type] === undefined) {
            this.__events[type] = [];
        }
        
        this.__events[type].push(listener);
    };
    this.dispatchEvent = function(event)
    {
        //TODO useCapture, priority
        //TODO when do you return false?
        //event = event.clone()
        
        //target only gets set once
        if (!event.target) {
            event.target = this;
        }
        event.currentTarget = this;
        
        var events = this.__events[event.type];
        if (events !== undefined) {
            for (var i = 0, l = events.length; i < l; ++i) {
                events[i].call(this, event);
                //events[i](event);
            }
        }
        if (event.bubbles && this.__parent) {
            //var clone = event.clone();
            //pass the same target to the next event
            //clone.target = event.target;
            //return this.__parent.dispatchEvent(clone);
            return this.__parent.dispatchEvent(event);
        }
        else {
            return true;
        }
    };
    this.hasEventListener = function(type)
    {
        return (this.__events[type] !== undefined);
    };
    this.removeEventListener = function(type, listener, useCapture)
    {
        //TODO useCapture
        var events = this.__events[type];
        if (events === undefined) { return; }
        
        for (var i = 0, l = events.length; i < l; ++i)
        {
            if (events[i] == listener) {
                events.splice(i, 1);
            }
        }
    };
    this.willTrigger = function(type)
    {
        //TODO is this correct?
        var target = this;
        while (target)
        {
            if (target.hasEventListener(type)) {
                return true;
            }
            target = target.__parent;
        }
        return false;
    };
});
EventDispatcher.prototype.toString = function()
{
    return '[object EventDispatcher]';
};
