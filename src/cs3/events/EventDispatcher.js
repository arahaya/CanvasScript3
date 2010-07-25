var EventDispatcher = new Class(Object, function()
{
    var sortByPriority = function(a, b)
    {
        var p = 'priority';
        if (a[p] < b[p]) 
        {
            return 1;
        }
        else if (a[p] > b[p]) 
        {
            return -1;
        }
        else 
        {
            return 0;
        }
    };
    
    this.__init__ = function()
    {
        this.__events = {};
    };
    
    /**
     * obj.addEventListener(type, listener, useCapture, priority);
     * obj.addEventListener(type, [scope, listener], useCapture, priority);
     * obj.addEventListener(type, new EventListener(scope, listener, useCapture, priority));
     */
    this.addEventListener = function(type, listener, useCapture, priority)
    {
        //TODO useCapture
        var events = this.__events;
        
        if (listener instanceof Function) 
        {
            listener = new EventListener(this, listener, useCapture, priority);
        }
        else if (listener instanceof Array) 
        {
            listener = new EventListener(listener[0], listener[1], useCapture, priority);
        }
        
        if (events[type] === undefined) 
        {
            events[type] = [];
        }
        
        var listeners = events[type];
        listeners.push(listener);
        listeners.sort(sortByPriority);
    };
    
    this.dispatchEvent = function(event)
    {
        //TODO useCapture, priority
        //TODO when do you return false?
        //event = event.clone()
        
        //target only gets set once
        if (!event.target) 
        {
            event.target = this;
        }
        event.currentTarget = this;
        
        var listeners = this.__events[event.type];
        if (listeners !== undefined) 
        {
            for (var i = 0, l = listeners.length; i < l; ++i) 
            {
                //events[i].call(this, event);
                //events[i](event);
                listeners[i].call(event);
            }
        }
        if (event.bubbles && this.__parent) 
        {
            //var clone = event.clone();
            //pass the same target to the next event
            //clone.target = event.target;
            //return this.__parent.dispatchEvent(clone);
            return this.__parent.dispatchEvent(event);
        }
        else 
        {
            return true;
        }
    };
    
    this.hasEventListener = function(type)
    {
        return (this.__events[type] !== undefined);
    };
    
    /**
     * obj.removeEventListener(type, listener, useCapture);
     * obj.removeEventListener(type, [scope, listener], useCapture);
     * obj.removeEventListener(type, new EventListener(scope, listener, useCapture));
     */
    this.removeEventListener = function(type, listener, useCapture)
    {
        //TODO useCapture
        var listeners = this.__events[type];
        if (listeners === undefined) 
        {
            return;
        }
        
        if (listener instanceof Function) 
        {
            listener = new EventListener(this, listener, useCapture);
        }
        else if (listener instanceof Array) 
        {
            listener = new EventListener(listener[0], listener[1], useCapture);
        }
        
        for (var i = 0, l = listeners.length; i < l; ++i) 
        {
            if (listener.equals(listeners[i])) 
            {
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
            if (target.hasEventListener(type)) 
            {
                return true;
            }
            target = target.__parent;
        }
        return false;
    };
    
    this.toString = function()
    {
        return '[object EventDispatcher]';
    };
});
