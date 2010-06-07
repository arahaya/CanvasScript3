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
        
        if (typeof(listener) === 'function') {
            listener = new EventListener(this, listener);
        }
        else if (listener instanceof Array) {
            listener = new EventListener(listener[0], listener[1]);
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
        
        var listeners = this.__events[event.type];
        if (listeners !== undefined) {
            for (var i = 0, l = listeners.length; i < l; ++i) {
                //events[i].call(this, event);
                //events[i](event);
                listeners[i].call(event);
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
        var listeners = this.__events[type];
        if (listeners === undefined) { return; }
        
        if (typeof(listener) === 'function') {
            listener = new EventListener(this, listener);
        }
        else if (listener instanceof Array) {
            listener = new EventListener(listener[0], listener[1]);
        }
        
        for (var i = 0, l = listeners.length; i < l; ++i)
        {
            if (listener.equals(listeners[i])) {
                listeners.splice(i, 1);
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
