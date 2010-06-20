/*
    CanvasScript3
    Copyright (c) 2010 ARAKI Hayato
    
    MIT License
    
    Permission is hereby granted, free of charge, to any person
    obtaining a copy of this software and associated documentation
    files (the "Software"), to deal in the Software without
    restriction, including without limitation the rights to use,
    copy, modify, merge, publish, distribute, sublicense, and/or sell
    copies of the Software, and to permit persons to whom the
    Software is furnished to do so, subject to the following
    conditions:
    
    The above copyright notice and this permission notice shall be
    included in all copies or substantial portions of the Software.
    
    THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
    EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
    OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
    NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
    HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
    WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
    FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
    OTHER DEALINGS IN THE SOFTWARE.
*/

//Opera Fix
if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.createImageData && window.ImageData) {
    CanvasRenderingContext2D.prototype.createImageData = function(w, h) { return new ImageData(w, h); };
}

//IE Fix
if (Object.prototype.__defineGetter__ == undefined) {
    Object.prototype.__defineGetter__ = function(){};
    Object.prototype.__defineSetter__ = function(){};
}

var cs3 = {
    core: {
        initialized: false,
        debug: false,
        isOpera: (window.opera) ? true : false,//TODO add beter browser detection
        isChrome: navigator.userAgent.toLowerCase().indexOf('chrome') > -1,
        stages: [],
        canvasId: 0,
        instanceId: 0,
        resizeTimeout: null,
        startTime: 0,
        nextInstanceId: function()
        {
            ++this.instanceId;
            return this.instanceId;
        },
        init: function()
        {
            if (this.initialized) { return; }
            
            window.onresize = this.resizeHandler;
            
            this.startTime = new Date().getTime();
            this.initialized = true;
        },
        resizeHandler: function(e)
        {
            var c = cs3.core;
            var t = c.resizeTimeout;
            clearTimeout(t);
            t = setTimeout(c.resizeHandlerDelay, 10);
        },
        resizeHandlerDelay: function()
        {
            var s = cs3.core.stages;
            for (var i = 0, l = s.length; i < l; ++i) {
                s[i].__resize();
            }
        },
        registerStage: function(stage)
        {
            this.init();
            var canvas = stage.canvas;
            
            //mouse events
            cs3.utils.addEventListener(document, 'mousemove', function(e) { setTimeout(cs3.utils.closure(stage, stage.__mouseMoveHandler, [e]), 1); });
            cs3.utils.addEventListener(document, 'mousedown', function(e) { stage.__mouseDownHandler(e); });
            cs3.utils.addEventListener(document, 'mouseup', function(e) { stage.__mouseUpHandler(e); });
            
            //Firefox
            if (window.addEventListener) {
                canvas.addEventListener('DOMMouseScroll', function(e) { stage.__mouseWheelHandler(e); }, false);
            }
            //Opera, Chrome
            cs3.utils.addEventListener(canvas, 'mousewheel', function(e) { stage.__mouseWheelHandler(e); });
            
            //focus events
            cs3.utils.addEventListener(canvas, 'focus', function(e) { stage.__focusHandler(e); });
            cs3.utils.addEventListener(canvas, 'blur', function(e) { stage.__blurHandler(e); });
            
            //key events
            cs3.utils.addEventListener(canvas, 'keydown', function(e) { stage.__keyDownHandler(e); });
            cs3.utils.addEventListener(canvas, 'keyup', function(e) { stage.__keyUpHandler(e); });
            
            this.stages.push(stage);
        }
    },
    config: {
        DEFAULT_FRAMERATE: 30
    },
    utils: {
        __events: {},
        addOnload: function(func)
        {
            var self = this;
            this.addEventListener(window, 'load', function()
            {
                func();
                //self.removeEventListener(window, 'load', arguments.callee);
            });
        },
        /**
         * unsafely add a single event listener
         * should only be called after your sure the handler exists
         */
        __addEventListener: function(element, type, listener)
        {
            this.__events[element][type].push(listener);
        },
        /**
         * unsafely remove a single event listener
         * should only be called after your sure the handler exists
         */
        __removeEventListener: function(element, type, listener)
        {
            var events = this.__events[element][type];
            for (var i = 1, l = events.length; i < l; ++i)
            {
                if (events[i] == listener) {
                    events.splice(i, 1);
                    return;
                }
            }
        },
        /**
         * unsafely remove all event listeners associated with type by removing the handler
         * should only be called after your sure the handler exists
         */
        __removeEventListeners: function(element, type)
        {
            var handler = this.__events[element][type][0];
            if (window.removeEventListener) {
                element.removeEventListener(type, handler, false);
            }
            else if (window.detachEvent) {
                element.detachEvent(type, handler);
            }
            else {
                if (element['on' + type] == handler) {
                    element['on' + type] = null;
                }
            }
            this.__events[element][type] = null;
            delete this.__events[element][type];
        },
        /**
         * check if the element has an event listener associated with type
         */
        __hasEventListener: function(element, type)
        {
            var events = this.__events;
            if (events[element] == undefined) { return false; }
            if (events[element][type] == undefined) { return false; }
            if (events[element][type].length === 0) { return false; }
            return true;
        },
        /**
         * make the actual function to handle the events
         * should only be called after your sure the handler doesn't exists
         */
        __makeEventHandler: function(element, type)
        {
            if (this.__events[element] === undefined) {
                this.__events[element] = {};
            }
            this.__events[element][type] = [];
            var listeners = this.__events[element][type];
            var handler = function(event)
            {
                for (var i = 1, l = listeners.length; i < l; ++i)
                {
                    listeners[i](event);
                }
            };
            listeners[0] = handler;
            
            if (window.addEventListener) {
                element.addEventListener(type, handler, false);
            }
            else if (window.attachEvent) {
                element.attachEvent('on' + type, handler);
            }
            else {
                var old = element['on' + type];
                if (typeof(old) !== 'function') {
                    element['on' + type] = handler;
                }
                else {
                    element['on' + type] = function() {
                        old();
                        handler(window.event);
                    };
                }
            }
        },
        /**
         * add a single event listener
         */
        addEventListener: function(element, type, listener)
        {
            if (this.__hasEventListener(element, type) === false) {
                this.__makeEventHandler(element, type);
            }
            this.__addEventListener(element, type, listener);
        },
        /**
         * remove a single event listener
         */
        removeEventListener: function(element, type, listener)
        {
            if (this.__hasEventListener(element, type)) {
                this.__removeEventListener(element, type, listener);
                if (this.__events[element][type].length === 1) {
                    //if it was the last listener remove the handler
                    this.__removeEventListeners(element, type);
                }
            }
        },
        /**
         * remove all event listeners associated with type
         */
        removeEventListeners: function(element, type)
        {
            if (this.__hasEventListener(element, type)) {
                this.__removeEventListeners(element, type);
            }
        },
        /**
         * remove all event listeners from an element
         */
        removeAllEventListeners: function(element)
        {
            if (this.__events[element]) {
                for (type in this.__events[element])
                {
                    this.__removeEventListeners(element, type);
                }
            }
            this.__events[element] = null;
            delete this.__events[element];
        },
        createXMLHttpRequest: function()
        {
            var req = null;
            if (window.XMLHttpRequest) {
                req = new XMLHttpRequest();
                //req.overrideMimeType('text/xml');
            }
            else if (window.ActiveXObject) {
                try {
                    req = new ActiveXObject('Msxml2.XMLHTTP');
                }
                catch (e) {
                    req = new ActiveXObject('Microsoft.XMLHTTP');
                }
            }
            return req;
        },
        createCanvas: function(width, height)
        {
            cs3.core.canvasId++;
            var canvas = document.createElement('CANVAS');
            canvas.id = "_cs3_canvas_" + cs3.core.canvasId;
            canvas.width = width | 0;
            canvas.height = height | 0;
            return canvas;
        },
        getContext2d: function(canvas)
        {
            if (!canvas) { return null; }
            
            if (!canvas.getContext) {
                try {
                    G_vmlCanvasManager.initElement(canvas);
                }
                catch (e) {
                    throw new Error('canvas is not available');
                }
            }
            return canvas.getContext('2d');
        },
        timeit: function(scope, func, args)
        {
            var s = (new Date()).getTime();
            func.apply(scope, args);
            trace((new Date()).getTime() - s);
        },
        closure: function(scope, func, args)
        {
            return function()
            {
                func.apply(scope, args);
            };
        }
    }
};
var __clearContext = (function()
{
    if (cs3.core.isChrome) {
        return function(context) {
            context.canvas.width = context.canvas.width;
        };
    }
    else {
        return function(context) {
            context.clearRect(0, 0, context.canvas.width, context.canvas.height);
        };
    }
})();
/**
 * Fix rectangle coords from floats to integers
 */
function __ceilRect(rect)
{
    var x = rect.x;
    var y = rect.y;
    rect.x = Math.floor(x);
    rect.y = Math.floor(y);
    rect.width = Math.ceil(rect.width + (x - rect.x));
    rect.height = Math.ceil(rect.height + (y - rect.y));
}
/**
 * apply a function up towards the display list root(including your self)
 */
function __applyUp(self, func, args)
{
    func.apply(self, args);
    if (self.__parent) {
        __applyUp(self.__parent, func, args);
    }
}
/**
 * apply a function down the display list(including your self)
 */
function __applyDown(self, func, args)
{
    func.apply(self, args);
    if (self.__children) {
        var c = self.__children;
        for (var i = 0, l = c.length; i < l; ++i)
        {
            __applyDown(c[i], func, args);
        }
    }
}
/**
 * convert hexadecimal rgb color to css format
 * eg. 0xFF00FF -> rgb(255, 0, 255)
 */
function __toRGB(color)
{
    var r = color >> 16 & 0xFF;
    var g = color >> 8  & 0xFF;
    var b = color & 0xFF;
    return "rgb(" + r + ", " + g + ", " + b + ")";
}
/**
 * convert hexadecimal argb color to css format
 * eg. 0xFF00FF00 -> rgba(0, 255, 0, 1)
 */
function __toRGBA(color)
{
    var a = color >> 24 & 0xFF;
    var r = color >> 16 & 0xFF;
    var g = color >> 8  & 0xFF;
    var b = color & 0xFF;
    return "rgba(" + r + ", " + g + ", " + b + ", " + (a / 255) + ")";
}
function __noImp(name)
{
    throw new Error(name + ' is not implemented');
}
var trace = (function()
{
    if (window.console) {
        return function(msg) {
            console.log(msg);
        };
    }
    else {
        return function(msg){};
    }
})();


function Class(superClass, object)
{
    if (superClass === undefined) {
        superClass = {};
    }
    if (object === undefined) {
        object = superClass;
        superClass = Object;
    }
    if (typeof(object) === 'function') {
        object = new object();
    }
    if (object.__init__ === undefined) {
        object.__init__ = function(){};
    }
    var subClass = object.__init__;
    var copy = function(){};
    copy.prototype = superClass.prototype;
    subClass.prototype = new copy();
    subClass.prototype.constructor = subClass;
    
    //copy properties
    var preffix, name, method;
    for (var property in object)
    {
        if (property == '__init__') {
            //do not copy the constructor
            continue;
        }
        
        preffix = property.substr(0, 7);
        if (preffix == '__get__') {
            //define getters
            name = property.substr(7);
            subClass.prototype.__defineGetter__(name, object[property]);
            
            //also copy as a public method for IE
            //eg: obj.__get__methodName will become obj.getMethodName()
            method = 'get' + name.charAt(0).toUpperCase() + name.slice(1);
            if (!subClass.hasOwnProperty(method)) {
                //do not override if a method or property with the same name exists
                subClass.prototype[method] = object[property];
            }
        }
        else if (preffix == '__set__') {
            //define setters
            name = property.substr(7);
            subClass.prototype.__defineSetter__(name, object[property]);
            
            //also copy as a public method for IE
            //eg: obj.__set__methodName will become obj.setMethodName()
            method = 'set' + name.charAt(0).toUpperCase() + name.slice(1);
            if (!subClass.hasOwnProperty(method)) {
                //do not override if a method or property with the same name exists
                subClass.prototype[method] = object[property];
            }
        }
        
        subClass.prototype[property] = object[property];
    }
    return subClass;
}


var ArgumentError = function(message)
{
    Error.apply(this, arguments);
    this.name = 'ArgumentError';
    this.message = message;
};
ArgumentError.prototype = new Error();

var IOError = function(message)
{
    Error.apply(this, arguments);
    this.name = 'IOError';
    this.message = message;
};
IOError.prototype = new Error();

var EOFError = function(message)
{
    IOError.apply(this, arguments);
    this.name = 'EOFError';
    this.message = message;
};
EOFError.prototype = new IOError();


var XML = new Class(Object, function()
{
    this.__init__ = function(str)
    {
        this.__str = str;
        this.__xml = null;
        if (window.DOMParser) {
            var parser = new DOMParser();
            this.__xml = parser.parseFromString(str, "text/xml");
        }
        else {
            this.__xml = new ActiveXObject("Microsoft.XMLDOM");
            this.__xml.async="false";
            this.__xml.loadXML(str); 
        }
        return this.__xml;
    };
});
XML.prototype.toString = function()
{
    return '[object XML]';
};
var Event = new Class(Object, function()
{
    this.__init__ = function(type, bubbles, cancelable)
    {
        this.type = type;
        this.bubbles = (bubbles) ? true : false;
        this.cancelable = (cancelable) ? true : false;
        this.__preventDefault = false;
        this.__stopImmediatePropagation = false;
        this.__stopPropagation = false;
    };
    this.clone = function()
    {
        return new Event(this.type, this.bubbles, this.cancelable);
    };
    this.isDefaultPrevented = function()
    {
        return this.__preventDefault;
    };
    this.preventDefault = function()
    {
        this.__preventDefault = true;
    };
    this.stopImmediatePropagation = function()
    {
        this.__stopImmediatePropagation = true;
    };
    this.stopPropagation = function()
    {
        this.__stopPropagation = true;
    };
    
    this.toString = function()
    {
        return '[Event type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable + ']';
    };
});
Event.ACTIVATE = 'activate';
Event.ADDED = 'added';
Event.ADDED_TO_STAGE = 'addedToStage';
Event.CANCEL = 'cancel';
Event.CHANGE = 'change';
Event.CLOSE = 'close';
Event.COMPLETE = 'complete';
Event.CONNECT = 'connect';
Event.DEACTIVATE = 'deactivate';
Event.ENTER_FRAME = 'enterFrame';
Event.FULLSCREEN = 'fullScreen';
Event.ID3 = 'id3';
Event.INIT = 'init';
Event.MOUSE_LEAVE = 'mouseLeave';
Event.OPEN = 'open';
Event.REMOVED = 'removed';
Event.REMOVED_FROM_STAGE = 'removedFromStage';
Event.RENDER = 'render';
Event.RESIZE = 'resize';
Event.SCROLL = 'scroll';
Event.SELECT = 'select';
Event.SOUND_COMPLETE = 'soundComplete';
Event.TAB_CHILDREN_CHANGE = 'tabChildrenChange';
Event.TAB_ENABLED_CHANGE = 'tabEnabledChange';
Event.TAB_INDEX_CHANGE = 'tabIndexChange';
Event.UNLOAD = 'unload';
var HTTPStatusEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, status)
    {
        Event.call(this, type, bubbles, cancelable);
        this.status = status | 0;
    };
    this.clone = function()
    {
        return new HTTPStatusEvent(this.type, this.bubbles, this.cancelable, this.status);
    };
    
    this.toString = function()
    {
        return '[HTTPStatusEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
            ' status=' + this.status + ']';
    };
});
HTTPStatusEvent.HTTP_STATUS = 'httpStatus';
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
    
    this.toString = function()
    {
        return '[IOErrorEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
            ' text=' + this.text + ']';
    };
});
IOErrorEvent.IO_ERROR = 'ioError';
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
var MouseEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
    {
        Event.call(this, type, bubbles, cancelable);
        this.altKey = (altKey) ? true : false;
        this.ctrlKey = (ctrlKey) ? true : false;
        this.shiftKey = (shiftKey) ? true : false;
        this.buttonDown = (buttonDown) ? true : false;//when does this become true?
        this.delta = delta | 0;
        this.__localX = (localX !== undefined) ? localX : null;
        this.__localY = (localY !== undefined) ? localY : null;
        this.relatedObject = relatedObject || null;
    };
    this.clone = function()
    {
        return new MouseEvent(this.type, this.bubbles, this.cancelable,
            this.__localX, this.__localY, this.relatedObject, this.ctrlKey, this.altKey, this.shiftKey, this.buttonDown, this.delta);
    };
    this.updateAfterEvent = function()
    {
        //todo
    };
    
    this.__get__localX = function()
    {
        if (this.__localX !== null) {
            return this.__localX;
        }
        return this.currentTarget.__get__mouseX();
    };
    this.__get__localY = function()
    {
        if (this.__localY !== null) {
            return this.__localY;
        }
        return this.currentTarget.__get__mouseY();
    };
    this.__get__stageX = function()
    {
        if (this.__localX !== null) {
            return this.currentTarget.localToGlobal(new Point(this.__localX, 0)).x;
        }
        return this.target.__stage.__mouseX;
    };
    this.__get__stageY = function()
    {
        if (this.__localY !== null) {
            return this.currentTarget.localToGlobal(new Point(this.__localY, 0)).y;
        }
        return this.currentTarget.__stage.__mouseY;
    };
    
    this.toString = function()
    {
        return '[MouseEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable + ']';
    };
});
MouseEvent.CLICK = 'click';
MouseEvent.DOUBLE_CLICK = 'doubleClick';
MouseEvent.MOUSE_DOWN = 'mouseDown';
MouseEvent.MOUSE_MOVE = 'mouseMove';
MouseEvent.MOUSE_OUT = 'mouseOut';
MouseEvent.MOUSE_OVER = 'mouseOver';
MouseEvent.MOUSE_UP = 'mouseUp';
MouseEvent.MOUSE_WHEEL = 'mouseWheel';
MouseEvent.ROLL_OUT = 'rollOut';
MouseEvent.ROLL_OVER = 'rollOver';
var ProgressEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, bytesLoaded, bytesTotal)
    {
        Event.call(this, type, bubbles, cancelable);
        this.bytesLoaded = bytesLoaded | 0;
        this.bytesTotal = bytesTotal | 0;
    };
    this.clone = function()
    {
        return new ProgressEvent(this.type, this.bubbles, this.cancelable, this.bytesLoaded, this.bytesTotal);
    };
    
    this.toString = function()
    {
        return '[ProgressEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
            ' bytesLoaded=' + this.bytesLoaded + ' bytesTotal=' + this.bytesTotal + ']';
    };
});
ProgressEvent.PROGRESS = 'progress';
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
        return '[TimerEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable + ']';
    };
});
TimerEvent.TIMER = 'timer';
TimerEvent.TIMER_COMPLETE = 'timerComplete';
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
        return new TweenEvent(this.type, this.time, this.position,
                        this.bubbles, this.cancelable);
    };
    
    this.toString = function()
    {
        return '[TweenEvent' +
                ' type='       + this.type +
                ' time='       + this.time +
                ' position='   + this.position +
                ' bubbles='    + this.bubbles +
                ' cancelable=' + this.cancelable + ']';
    };
});
TweenEvent.MOTION_CHANGE = 'motionChange';
TweenEvent.MOTION_FINISH = 'motionFinish';
TweenEvent.MOTION_LOOP = 'motionLoop';
TweenEvent.MOTION_RESUME = 'motionResume';
TweenEvent.MOTION_START = 'motionStart';
TweenEvent.MOTION_STOP = 'motionStop';
var EventDispatcher = new Class(Object, function()
{
    var sortByPriority = function(a, b)
    {
        var p = 'priority';
        if (a[p] < b[p]) { return 1; }
        else if (a[p] > b[p]){ return -1; }
        else { return 0; }
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
        
        if (listener instanceof Function) {
            listener = new EventListener(this, listener, useCapture, priority);
        }
        else if (listener instanceof Array) {
            listener = new EventListener(listener[0], listener[1], useCapture, priority);
        }
        
        if (events[type] === undefined) {
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
    
    /**
     * obj.removeEventListener(type, listener, useCapture);
     * obj.removeEventListener(type, [scope, listener], useCapture);
     * obj.removeEventListener(type, new EventListener(scope, listener, useCapture));
     */
    this.removeEventListener = function(type, listener, useCapture)
    {
        //TODO useCapture
        var listeners = this.__events[type];
        if (listeners === undefined) { return; }
        
        if (listener instanceof Function) {
            listener = new EventListener(this, listener, useCapture);
        }
        else if (listener instanceof Array) {
            listener = new EventListener(listener[0], listener[1], useCapture);
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
    
    this.toString = function()
    {
        return '[object EventDispatcher]';
    };
});
var EventListener = new Class(Object, function()
{
    this.__init__ = function(scope, callback, useCapture, priority)
    {
        this.scope = scope;
        this.callback = callback;
        this.useCapture = (useCapture) ? true : false;
        this.priority = priority | 0;
    };
    this.call = function()
    {
        this.callback.apply(this.scope, arguments);
    };
    this.equals = function(toCompare)
    {
        return (toCompare.scope      === this.scope &&
                toCompare.callback   === this.callback &&
                toCompare.useCapture === this.useCapture) ? true : false;
    };
    
    this.toString = function()
    {
        return '[object EventListener]';
    };
});
CapsStyle = {
    NONE: 'butt',
    ROUND: 'round',
    SQUARE: 'square'
};
JointStyle = {
    BEVEL: 'bevel',
    ROUND: 'round',
    MITER: 'miter'
};
var DisplayObject = new Class(EventDispatcher, function()
{
    this.__init__ = function()
    {
        EventDispatcher.call(this);
        this.__name = null;
        this.__id = cs3.core.nextInstanceId();
        this.__transform = new Transform();
        this.__transform.__target = this;
        this.__visible = true;
        this.__alpha = 1;
        this.__modified = false;
        this.__parent = null;
        this.__stage = null;
        this.__root = null;
        this.__globalBounds = null;
        //this.blendMode = 'normal';
        //this.cacheAsBitmap = false;
        this.__filters = [];
        //this.loaderInfo = new LoaderInfo();
        this.__mask = null;
        this.__maskee = null;
        this.__bitmap = null;//used for cacheAsBitmap, mask, maskee, filters
        this.__cache = null;//cached result for mask and filters
        //this.opaqueBackground = null;
    };
    
    this.__getAsBitmap = function()
    {
        var bounds = this.__getBounds();
        if (bounds.isEmpty()) {
            //if bounds is empty we can't create a BitmapData.
            return null;
        }
        
        var bitmap = this.__bitmap;
        var bitmapData;
        if (bitmap === null) {
            bitmap = new Bitmap(new BitmapData(bounds.width, bounds.height, true, 0));
            bitmap.__set__x(bounds.x);
            bitmap.__set__y(bounds.y);
        }
        
        //TODO: check if the bitmap needs to be rendered
        //always true for now
        var render = false;
        if (true) {
            render = true;
        }
        
        if (render) {
            //update the position
            bitmap.__set__x(bounds.x);
            bitmap.__set__y(bounds.y);
            
            //update the size(this also clears the contents)
            bitmap.__bitmapData.__resize(bounds.width, bounds.height);
            
            var context = bitmap.__bitmapData.__context;
            //__clearContext(context);
            
            //create a matrix that makes the bounds to fit the context
            var matrix = new Matrix(1, 0, 0, 1, -bounds.x, -bounds.y);
            
            //render the entire list to the bitmapdata context
            context.save();
            context.setTransform(
                matrix.a,
                matrix.b,
                matrix.c,
                matrix.d,
                matrix.tx,
                matrix.ty);
            this.__render(context, matrix, new ColorTransform());
            context.restore();
        }
        
        this.__bitmap = bitmap;
        return bitmap;
    };
    
    /**
     * Bounds of the DisplayObject
     */
    this.__getBounds = function()
    {
        return this.__getContentBounds();
    };
    
    /**
     * Bounds of the inner content
     */
    this.__getContentBounds = function()
    {
        return new Rectangle();
    };
    
    this.__getRect = function()
    {
        return this.__getContentRect();
    };
    
    this.__getContentRect = function()
    {
        return this.__getContentBounds();
    };
    
    this.__getObjectUnderPoint = function(context, matrix, point)
    {
        context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        if (this.__hitTestPoint(context, matrix, point)) {
            return this;
        }
        return null;
    };
    
    this.__hitTestPoint = function(context, matrix, point)
    {
        return false;
    };
    
    this.__getModified = function()
    {
    };
    
    this.__setModified = function(v)
    {
    };
    
    this.__applyContextFilters = function(context, matrix, colorTransform)
    {
        var filters = this.__filters;
        for (var i = 0, l = filters.length; i < l; ++i)
        {
            if (filters[i] instanceof ContextFilter) {
                filters[i].__filter(context, this);
            }
        }
    };
    
    this.__applyMask = function(context, matrix, colorTransform)
    {
        /*** experimental ***/
        var selfBitmap = this.__getAsBitmap();
        if (!selfBitmap) {
            //child content is empty so we don't need to apply a mask
            return;
        }
        var mask = this.__mask;
        var maskBitmap = mask.__getAsBitmap();
        if (!maskBitmap) {
            //mask content is empty so we don't need to render the child
            return;
        }
        
        var selfBitmapData = selfBitmap.__bitmapData;
        var maskBitmapData = maskBitmap.__bitmapData;
        
        //create another bitmap to apply the mask
        if (this.__cache) {
            //if it already exists, reuse it
            this.__cache.__bitmapData.__resize(selfBitmapData.__width, selfBitmapData.__height);
            this.__cache.__bitmapData.__context.drawImage(selfBitmapData.__canvas, 0, 0);
        }
        else {
            //create a new bitmap
            this.__cache = new Bitmap(selfBitmapData.clone());
        }
        this.__cache.setX(selfBitmap.getX());
        this.__cache.setY(selfBitmap.getY());
        
        
        var bitmap = this.__cache;
        var bitmapData = bitmap.__bitmapData;
        var bitmapDataContext = bitmapData.__context;
        
        //create the mask's matrix
        var maskMatrix = mask.__transform.__get__concatenatedMatrix();
        var deltaMatrix = matrix.clone();
        deltaMatrix.invert();
        maskMatrix.concat(deltaMatrix);
        
        //adjust the position to draw
        maskMatrix.tx += maskBitmap.getX();
        maskMatrix.ty += maskBitmap.getY();
        
        //apply the mask
        bitmapDataContext.save();
        bitmapDataContext.globalCompositeOperation = 'destination-in';
        bitmapDataContext.setTransform(
            maskMatrix.a,
            maskMatrix.b,
            maskMatrix.c,
            maskMatrix.d,
            maskMatrix.tx,
            maskMatrix.ty);
        maskBitmapData.__render(bitmapDataContext, maskMatrix, null);
        bitmapDataContext.restore();
    };
    
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__filters.length) {
            this.__applyContextFilters(context, matrix, colorTransform);
        }
        if (this.__mask) {
            this.__applyMask(context, matrix, colorTransform);
        }
        
        if (this.__cache) {
            this.__cache.__render(context, matrix, colorTransform);
        }
        else {
            this.__render(context, matrix, colorTransform);
        }
    };
    
    this.__update = function(matrix, forceUpdate)
    {
        if (forceUpdate || this.__getModified()) {
            var stage = this.__stage;
            var globalBounds = matrix.transformRect(this.__getContentBounds());
            var lastGlobalBounds = this.__globalBounds;
            
            // collect redraw regions
            if (!lastGlobalBounds) {
                stage.__addRedrawRegion(globalBounds);
            }
            else {
                if (globalBounds.intersects(lastGlobalBounds)) {
                    stage.__addRedrawRegion(globalBounds.union(lastGlobalBounds));
                }
                else {
                    stage.__addRedrawRegion(globalBounds);
                    stage.__addRedrawRegion(lastGlobalBounds);
                }
            }
            
            // save the global bounds for the next update
            this.__globalBounds = globalBounds;
            
            // reset modification
            this.__setModified(false);
        }
    };
    
    this.getBounds = function(targetCoordinateSpace)
    {
        var bounds = this.__getBounds();
        targetCoordinateSpace = targetCoordinateSpace || this.__root || this;
        if (targetCoordinateSpace === this) {
            return bounds;
        }
        if (targetCoordinateSpace === this.__parent) {
            return this.__transform.__matrix.transformRect(bounds);
        }
        
        var globalBounds = this.__transform.__get__concatenatedMatrix().transformRect(bounds);
        if (targetCoordinateSpace === this.__root) {
            //if the target is your root, global coords is wat you want
            return globalBounds;
        }
        
        //tansform your global bounds to targets local bounds
        var targetMatrix = targetCoordinateSpace.__transform.__get__concatenatedMatrix();
        targetMatrix.invert();
        return targetMatrix.transformRect(globalBounds);
    };
    
    this.getRect = function(targetCoordinateSpace)
    {
        return this.getBounds(targetCoordinateSpace);
    };
    
    this.globalToLocal = function(point)
    {
        var matrix = this.__transform.__get__concatenatedMatrix();
        matrix.invert();
        return matrix.transformPoint(point);
    };
    
    this.hitTestObject = function(obj)
    {
        var globalBounds = this.__transform.__get__concatenatedMatrix().transformRect(this.__getBounds());
        var targetGlobalBounds = obj.__transform.__get__concatenatedMatrix().transformRect(obj.__getBounds());
        return globalBounds.intersects(targetGlobalBounds);
    };
    
    this.hitTestPoint = function(x, y, shapeFlag)
    {
        if (shapeFlag === false) {
            var globalBounds = this.__transform.__get__concatenatedMatrix().transformRect(this.__getBounds());
            return globalBounds.contains(x, y);
        }
        else {
            if (!this.__stage) {
                //if shape flag is true and object is not addet to the stage
                //always return false;
                return false;
            }
            
            var context = this.__stage.__hiddenContext;
            var matrix = this.__transform.__get__concatenatedMatrix();
            var point = new Point(x, y);
            
            context.clearRect(x, y, 1, 1);
            context.save();
            context.beginPath();
            context.rect(x, y, 1, 1);
            context.clip();
            var result = (this.__getObjectUnderPoint(context, matrix, point)) ? true : false;
            context.restore();
            return result;
        }
    };
    
    this.localToGlobal = function(point)
    {
        return this.__transform.__get__concatenatedMatrix().transformPoint(point);
    };
    
    /* getters and setters */
    this.__get__name = function()
    {
        if (this.__name === null) {
            return "instance" + this.__id;
        }
        return this.__name;
    };
    
    this.__set__name = function(name)
    {
        this.__name = name;
    };
    
    this.__get__stage = function()
    {
        return this.__stage;
    };
    
    this.__get__root = function()
    {
        return this.__root;
    };
    
    this.__get__parent = function()
    {
        return this.__parent;
    };
    
    this.__get__width = function()
    {
        return this.__transform.__matrix.transformRect(this.__getBounds()).width;
    };
    
    this.__get__height = function()
    {
        return this.__transform.__matrix.transformRect(this.__getBounds()).height;
    };
    
    this.__get__x = function()
    {
        return this.__transform.__getX();
    };
    
    this.__set__x = function(v)
    {
        this.__transform.__setX(v);
    };
    
    this.__get__y = function()
    {
        return this.__transform.__getY();
    };
    
    this.__set__y = function(v)
    {
        this.__transform.__setY(v);
    };
    
    this.__get__rotation = function()
    {
        return this.__transform.__getRotation();
    };
    
    this.__set__rotation = function(v)
    {
        this.__transform.__setRotation(v);
    };
    
    this.__get__scaleX = function()
    {
        return this.__transform.__getScaleX();
    };
    
    this.__set__scaleX = function(v)
    {
        this.__transform.__setScaleX(v);
    };
    
    this.__get__scaleY = function()
    {
        return this.__transform.__getScaleY();
    };
    
    this.__set__scaleY = function(v)
    {
        this.__transform.__setScaleY(v);
    };
    
    this.__get__alpha = function()
    {
        return this.__alpha;
    };
    
    this.__set__alpha = function(v)
    {
        this.__alpha = v;
        this.__modified = true;
    };
    
    this.__get__visible = function()
    {
        return this.__visible;
    };
    
    this.__set__visible = function(v)
    {
        this.__visible = (v) ? true : false;
        this.__modified = true;
    };
    
    this.__get__mouseX = function()
    {
        return this.globalToLocal(new Point(this.__stage.__mouseX, this.__stage.__mouseY)).x;
    };
    
    this.__get__mouseY = function()
    {
        return this.globalToLocal(new Point(this.__stage.__mouseX, this.__stage.__mouseY)).y;
    };
    
    this.__get__mask = function()
    {
        return this.__mask;
    };
    
    this.__set__mask = function(v)
    {
        //if the mask object is allready a mask of a different object remove it
        if (v.__maskee) {
            v.__maskee.__mask = null;
        }
        //if this allready has a mask remove it
        if (this.__mask) {
            this.__mask.__maskee = null;
        }
        this.__mask = v;
        v.__maskee = this;
    };
    
    this.__get__filters = function()
    {
        return this.__filters.slice(0);
    };
    
    this.__set__filters = function(v)
    {
        this.__cache = null;
        for (var i = 0, l = v.length; i < l; ++i)
        {
            //only apply bitmapFilters
            if (v[i] instanceof BitmapFilter) {
                v[i].__apply(this);
            }
        }
        this.__filters = v.slice(0);
        this.__modified = true;
    };
    
    this.__get__transform = function()
    {
        return this.__transform;
    };
    
    this.__set__transform = function(v)
    {
        this.__transform = v;
        this.__transform.__modified = true;
    };
    
    this.toString = function()
    {
        return '[object DisplayObject]';
    };
});
var InteractiveObject = new Class(DisplayObject, function()
{
    this.__init__ = function()
    {
        DisplayObject.call(this);
        //this.doubleClickEnabled = true;
        this.mouseEnabled = true;
        //this.tabEnabled = true;
        //this.tabIndex = 0;
        //this.focusRect = null;
    };
    
    this.toString = function()
    {
        return '[object InteractiveObject]';
    };
});
var DisplayObjectContainer = new Class(InteractiveObject, function()
{
    this.__init__ = function()
    {
        InteractiveObject.call(this);
        this.__children = [];
        this.mouseChildren = true;
        //this.tabChildren = true;
    };
    
    /* @override DisplayObject.__getBounds */
    this.__getBounds = function()
    {
        var bounds = this.__getContentBounds();
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            var childBounds = child.__getBounds();
            bounds = bounds.union(child.__transform.__matrix.transformRect(childBounds));
        }
        return bounds;
    };
    
    /* @override DisplayObject.__getRect */
    this.__getRect = function()
    {
        var rect = this.__getContentRect();
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            var childRect = child.__getRect();
            rect = rect.union(child.__transform.__matrix.transformRect(childRect));
        }
        return rect;
    };
    
    /* @override DisplayObject.__getObjectUnderPoint */
    this.__getObjectUnderPoint = function(context, matrix, point)
    {
        var children = this.__children;
        for (var i = children.length - 1; i >= 0; --i)
        {
            var child = children[i];
            if (child.__visible) {
                var childMatrix = child.__transform.__matrix.clone();
                childMatrix.concat(matrix);
                var result = child.__getObjectUnderPoint(context, childMatrix, point);
                if (result) {
                    return result;
                }
            }
        }
        
        context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        if (this.__hitTestPoint(context, matrix, point)) {
            return this;
        }
        return null;
    };
    
    /* @override DisplayObject.__update */
    this.__update = function(matrix, forceUpdate)
    {
        var update = forceUpdate || this.__getModified();
        
        // update children first
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            var childMatrix = child.__transform.__matrix.clone();
            childMatrix.concat(matrix);
            child.__update(childMatrix, update);
        }
        
        // update your self
        if (update) {
            var stage = this.__stage;
            var globalBounds = matrix.transformRect(this.__getContentBounds());
            var lastGlobalBounds = this.__globalBounds;
            
            // collect redraw regions
            if (!lastGlobalBounds) {
                stage.__addRedrawRegion(globalBounds);
            }
            else {
                if (globalBounds.intersects(lastGlobalBounds)) {
                    stage.__addRedrawRegion(globalBounds.union(lastGlobalBounds));
                }
                else {
                    stage.__addRedrawRegion(globalBounds);
                    stage.__addRedrawRegion(lastGlobalBounds);
                }
            }
            
            // save the global bounds for the next update
            this.__globalBounds = globalBounds;
            
            // reset modification
            this.__setModified(false);
        }
    };
    
    this.__renderChildren = function(context, matrix, colorTransform)
    {
        var alpha = context.globalAlpha;
        var children = this.__children;
        var render = DisplayObject.prototype.__render;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            
            if (child.__visible === false) { continue; }
            if (child.__maskee !== null) { continue; }
            
            var childMatrix = child.__transform.__matrix.clone();
            childMatrix.concat(matrix);
            
            var childColor = child.__transform.__colorTransform.clone();
            childColor.concat(colorTransform);
            
            context.globalAlpha = alpha * child.__alpha;
            context.setTransform(childMatrix.a, childMatrix.b, childMatrix.c, childMatrix.d, childMatrix.tx, childMatrix.ty);
            
            render.call(child, context, childMatrix, childColor);
        }
    };
    
    this.__addChildAt = function(child, index)
    {
        if (!(child instanceof DisplayObject)) {
            throw new ArgumentError("child is not a DisplayObject");
        }
        if (child.__parent === this) {
            return;
        }
        if (child.__parent !== null) {
            child.__parent.removeChild(child);
        }
        
        this.__children.splice(index, 0, child);
        child.dispatchEvent(new Event(Event.ADDED, true, false));
        child.__parent = this;
        if (this.__stage) {
            __applyDown(child, function(stage, event)
            {
                this.__stage = this.__root = stage;
                this.dispatchEvent(event);
            }, [this.__stage, new Event(Event.ADDED_TO_STAGE, false, false)]);
        }
        
        child.__setModified(true);
    };
    
    this.__removeChildAt = function(index)
    {
        var child = this.__children[index];
        
        // add redraw regions
        child.__update(child.__transform.__get__concatenatedMatrix(), true);
        
        this.__children.splice(index, 1);
        child.__parent = null;
        child.dispatchEvent(new Event(Event.REMOVED, true, false));
        if (this.__stage) {
            __applyDown(child, function(stage, event)
            {
                this.__stage = this.__root = null;
                this.dispatchEvent(event);
            }, [this.__stage, new Event(Event.REMOVED_FROM_STAGE, false, false)]);
        }
        
        return child;
    };
    this.contains = function(object)
    {
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            if (child === object) {
                return true;
            }
            if (child instanceof DisplayObjectContainer && child.contains(object)) {
                return true;
            }
        }
        return false;
    };
    
    this.addChild = function(child)
    {
        this.__addChildAt(child, this.__children.length);
    };
    
    this.addChildAt = function(child, index)
    {
        if (index < 0 || index > this.__children.length) {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        this.__addChildAt(child, index);
    };
    
    this.getChildAt = function(index)
    {
        if (index < 0 || index >= this.__children.length) {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        return this.__children[index];
    };
    
    this.getChildByName = function(name)
    {
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i) {
            if (children[i].name == name) {
                return children[i];
            }
        }
        return null;
    };
    
    this.getChildIndex = function(child)
    {
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i) {
            if (children[i] == child) {
                return i;
            }
        }
        
        throw new ArgumentError('The supplied DisplayObject must be a child of the caller.');
    };
    
    this.removeChild = function(child)
    {
        var index;
        try {
            index = this.getChildIndex(child);
        }
        catch (e) {
            throw e;//ArgumentError
        }
        return this.__removeChildAt(index);
    };
    
    this.removeChildAt = function(index)
    {
        if (index < 0 || index >= this.__children.length) {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        return this.__removeChildAt(index);
    };
    
    this.setChildIndex = function(child, index)
    {
        if (index < 0 || index >= this.__children.length) {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        var oldIndex;
        try {
            oldIndex = this.getChildIndex(child);
        }
        catch (e) {
            throw e;//ArgumentError
        }
        
        this.__children.splice(oldIndex, 1);
        this.__children.splice(index, 0, child);
        this.__modified = true;
    };
    
    this.swapChildren = function(child1, child2)
    {
        var index1, index2;
        try {
            index1 = this.getChildIndex(child1);
            index2 = this.getChildIndex(child2);
        }
        catch (e) {
            throw e;//ArgumentError
        }
        
        this.__children[index2] = child1;
        this.__children[index1] = child2;
        this.__modified = true;
    };
    
    this.swapChildrenAt = function(index1, index2)
    {
        var children = this.__children;
        var length = children.length;
        if (index1 < 0 || index1 >= length ||
            index2 < 0 || index2 >= length) {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        var temp = children[index1];
        children[index1] = children[index2];
        children[index2] = temp;
        this.__modified = true;
    };
    
    this.getObjectsUnderPoint = function(point)
    {
        //TODO
    };
    
    /* getters and setters */
    this.__get__numChildren = function()
    {
        return this.__children.length;
    };
    
    this.toString = function()
    {
        return '[object DisplayObjectContainer]';
    };
});
var Bitmap = new Class(DisplayObject, function()
{
    this.__init__ = function(bitmapData)
    {
        DisplayObject.call(this);
        
        this.__bitmapData = null;
        
        if (bitmapData) {
            this.__set__bitmapData(bitmapData);
        }
    };
    
    //override
    this.__getContentBounds = function()
    {
        if (this.__bitmapData) {
            return this.__bitmapData.__rect.clone();
        }
        return new Rectangle();
    };
    
    //override
    this.__getAsBitmap = function()
    {
        if (this.__bitmapData) {
            return this;
        }
        return null;
    };
    
    //override
    this.__getModified = function()
    {
        return (this.__modified ||
                this.__transform.__modified ||
                (this.__bitmapData && this.__bitmapData.__modified));
    };
    
    //override
    this.__setModified = function(v)
    {
        this.__modified = v;
        this.__transform.__modified = v;
        if (this.__bitmapData) {
            this.__bitmapData.__modified = v;
        }
    };
    
    //override
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__bitmapData) {
            this.__bitmapData.__render(context, matrix, colorTransform);
        }
    };
    
    //override
    this.__hitTestPoint = function(context, matrix, point)
    {
        if (this.__bitmapData) {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (bounds.containsPoint(localPoint)) {
                //fix the points back to ints
                localPoint.x = localPoint.x | 0;
                localPoint.y = localPoint.y | 0;
                try {
                    return (this.__bitmapData.getImageData(localPoint.x, localPoint.y, 1, 1).data[3] !== 0);
                }
                catch (e) {
                    // if the bitmap source is on a different domain and we cant call getImageData
                    // return true as if it was a hitTest with shapeflag=false
                    return true;
                }
            }
        }
        return false;
    };
    
    /* getters and setters */
    this.__get__bitmapData = function()
    {
        return this.__bitmapData;
    };
    
    this.__set__bitmapData = function(v)
    {
        this.__bitmapData = v;
        this.__modified = true;
    };
    
    this.__get__pixelSnapping = function()
    {
        //not supported
        return false;
    };
    
    this.__set__pixelSnapping = function(v)
    {
        //not supported
    };
    
    this.__get__smoothing = function()
    {
        //not supported
        return false;
    };
    
    this.__set__smoothing = function(v)
    {
        //not supported
    };
    
    this.toString = function()
    {
        return '[object Bitmap]';
    };
});
var BitmapData = new Class(Object, function()
{
    var invalidBitmapData = function()
    {
        throw new ArgumentError("Invalid BitmapData.");
    };
    
    var floodFillScanlineStack = function(data, x, y, width, height, targetColor, replacementColor)
    {
        var T0 = targetColor[0];
        var T1 = targetColor[1];
        var T2 = targetColor[2];
        var T3 = targetColor[3];
        var R0 = replacementColor[0];
        var R1 = replacementColor[1];
        var R2 = replacementColor[2];
        var R3 = replacementColor[3];
        
        var LINESIZE = width * 4;
        var WIDTH_M1 = width - 1;
        
        var stack = [];
        var stackLength;
        var pop = [x, y];
        var spanLeft, spanRight, p;
        while (pop)
        {
            x = pop[0];
            y = pop[1];
            p = (y * LINESIZE) + (x * 4);
            stackLength = stack.length;
            
            while (y >= 0 && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3))
            {
                --y;
                p -= LINESIZE;
            }
            ++y;
            p += LINESIZE;
            spanLeft = spanRight = 0;
            
            while (y < height && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3))
            {
                //replace node color
                data[p]   = R0;
                data[p+1] = R1;
                data[p+2] = R2;
                data[p+3] = R3;
                
                p -= 4;//x - 1
                if (!spanLeft && x > 0 && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3)) {
                    stack[stackLength++] = [x - 1, y];
                    spanLeft = 1;
                }
                else if (spanLeft && x > 0 && (data[p] !== T0 || data[p+1] !== T1 || data[p+2] !== T2 || data[p+3] !== T3)) {
                    spanLeft = 0;
                }
                
                p += 8;//x + 1
                if (!spanRight && x < WIDTH_M1 && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3)) {
                    stack[stackLength++] = [x + 1, y];
                    spanRight = 1;
                }
                else if (spanRight && x < WIDTH_M1 && (data[p] !== T0 || data[p+1] !== T1 || data[p+2] !== T2 || data[p+3] !== T3)) {
                    spanRight = 0;
                }
                p -= 4;
                
                ++y;
                p += LINESIZE;
            }
            
            pop = stack.pop();
        }
    };
    
    this.__init__ = function(width, height, transparent, fillColor)
    {
        //transparent=false doesn't work
        width  = width  | 0;
        height = height | 0;
        if (!width || !height || width > 2880 || height > 2880) {
            throw new ArgumentError("Invalid BitmapData.");
        }
        
        this.__width = width;
        this.__height = height;
        //this.__transparent = (transparent) ? true : false;
        
        this.__canvas = cs3.utils.createCanvas(width, height);
        this.__context = cs3.utils.getContext2d(this.__canvas);
        this.__rect = new Rectangle(0, 0, width, height);
        this.__pixel = this.__context.createImageData(1, 1);
        this.__modified = false;
        this.__disposed = false;
        
        if (fillColor === null) { fillColor = 0xFFFFFFFF; }
        if (fillColor) { this.fillRect(this.__rect, fillColor); }
    };
    
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__canvas) {
            context.drawImage(this.__canvas, 0, 0);
        }
    };
    
    this.__resize = function(width, height)
    {
        this.__width = width;
        this.__height = height;
        this.__rect.width = width;
        this.__rect.height = height;
        this.__canvas.width = width;
        this.__canvas.height = height;
    };
    
    this.applyFilter = function(sourceBitmapData, sourceRect, destPoint, filter)
    {
        filter.__filterBitmapData(sourceBitmapData, sourceRect, this, destPoint);
        this.__modified = true;
    };
    
    this.clone = function()
    {
        var clone = new BitmapData(this.__width, this.__height, true, 0);
        clone.__context.drawImage(this.__canvas, 0, 0);
        clone.__rect = this.__rect.clone();
        return clone;
    };
    
    this.colorTransform = function(rect, colorTransform)
    {
        var rm = colorTransform.redMultiplier;
        var gm = colorTransform.greenMultiplier;
        var bm = colorTransform.blueMultiplier;
        var am = colorTransform.alphaMultiplier;
        var ro = colorTransform.redOffset;
        var go = colorTransform.greenOffset;
        var bo = colorTransform.blueOffset;
        var ao = colorTransform.alphaOffset;
        
        var imageData = this.__context.getImageData(rect.x, rect.y, rect.width, rect.height);
        var data = imageData.data;
        var length = data.length;
        var i;
        
        if (cs3.core.isOpera) {
            //I think opera does something like (color & 0xFF)
            for (i = 0; i < length;)
            {
                var r = data[i]   * rm + ro;
                var g = data[i+1] * gm + go;
                var b = data[i+2] * bm + bo;
                var a = data[i+3] * am + ao;
                data[i++] = (r < 255) ? r : 255;
                data[i++] = (g < 255) ? g : 255;
                data[i++] = (b < 255) ? b : 255;
                data[i++] = (a < 255) ? a : 255;
            }
        }
        else {
            for (i = 0; i < length;)
            {
                data[i] = data[i++] * rm + ro;
                data[i] = data[i++] * gm + go;
                data[i] = data[i++] * bm + bo;
                data[i] = data[i++] * am + ao;
            }
        }
        
        this.__context.putImageData(imageData, rect.x, rect.y);
        this.__modified = true;
    };
    
    this.compare = function(otherBitmapData)
    {
        //TODO not tested
        var width = this.__width;
        var height = this.__height;
        var otherWidth = otherBitmapData.__width;
        var otherHeight = otherBitmapData.__height;
        
        if (width !== otherWidth) {
            return -3;
        }
        if (height !== otherHeight) {
            return -4;
        }
        
        var sourceData   = sourceBitmapData.__context.getImageData(0, 0, width, height).data;
        var otherData    = otherBitmapData.__context.getImageData(0, 0, width, height).data;
        var newImageData = sourceBitmapData.__context.createImageData(width, height);
        var newData      = newImageData.data;
        var length       = newData.length;
        var isDifferent  = false;
        
        for (var i = 0; i < length;)
        {
            var sr = sourceData[i];
            var sg = sourceData[i+1];
            var sb = sourceData[i+2];
            var sa = sourceData[i+3];
            var or = otherData[i];
            var og = otherData[i+1];
            var ob = otherData[i+2];
            var oa = otherData[i+3];
            
            if ((sr !== or) || (sg !== og) || (sb !== ob)) {
                newData[i++] = sr - or;
                newData[i++] = sg - og;
                newData[i++] = sb - ob;
                newData[i++] = 0xFF;
                isDifferent = true;
            }
            else if (sa !== oa) {
                newData[i++] = 0xFF;
                newData[i++] = 0xFF;
                newData[i++] = 0xFF;
                newData[i++] = sa - oa;
                isDifferent = true;
            }
        }
        
        if (isDifferent === false) {
            return 0;
        }
        
        var newBitmapData = new BitmapData(width, height, true, 0x00000000);
        newBitmapData.__context.putImageData(newImageData, 0, 0);
        return newBitmapData;
    };
    
    this.copyChannel = function(sourceBitmapData, sourceRect, destPoint, sourceChannel, destChannel)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var destData = destImageData.data;
        var sourceData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height).data;
        var length = sourceData.length;
        
        var sourceChannelIndex, destChannelIndex;
        if (sourceChannel == BitmapDataChannel.RED) { sourceChannelIndex = 0; }
        else if (sourceChannel == BitmapDataChannel.GREEN) { sourceChannelIndex = 1; }
        else if (sourceChannel == BitmapDataChannel.BLUE) { sourceChannelIndex = 2; }
        else if (sourceChannel == BitmapDataChannel.ALPHA) { sourceChannelIndex = 3; }
        else { return; }
        if (destChannel == BitmapDataChannel.RED) { destChannelIndex = 0; }
        else if (destChannel == BitmapDataChannel.GREEN) { destChannelIndex = 1; }
        else if (destChannel == BitmapDataChannel.BLUE) { destChannelIndex = 2; }
        else if (destChannel == BitmapDataChannel.ALPHA) { destChannelIndex = 3; }
        else { return; }
        
        for (var i = 0; i < length; i += 4)
        {
            destData[i + destChannelIndex] = sourceData[i + sourceChannelIndex];
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.copyPixels = function(sourceBitmapData, sourceRect, destPoint)
    {
        /*
        var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
        this.__context.putImageData(sourceImageData, destPoint.x, destPoint.y);
        this.__modified = true;
        */
        //about 4 - 30 times faster
        this.__context.clearRect(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height);
        this.__context.drawImage(sourceBitmapData.__canvas, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
                        destPoint.x, destPoint.y, sourceRect.width, sourceRect.height);
        this.__modified = true;
    };
    
    this.createImageData = function()
    {
        return this.__context.createImageData.apply(this.__context, arguments);
    };
    
    this.dispose = function()
    {
        this.__width = 0;
        this.__height = 0;
        this.__canvas.width = 0;
        this.__canvas.height = 0;
        this.__canvas = null;
        this.__context = null;
        this.__rect.setEmpty();
        this.__pixel = null;
        
        //disable all public methods
        //excluding toString
        for (var p in this)
        {
            if (p !== 'toString' && p.charAt(0) !== '_' && typeof(this[p]) === 'function') {
                this[p] = invalidBitmapData;
            }
        }
        
        //disable getters
        this.__defineGetter__("width", invalidBitmapData);
        this.__defineGetter__("height", invalidBitmapData);
        this.__defineGetter__("rect", invalidBitmapData);
        
        this.__modified = true;
        this.__disposed = true;
    };
    
    this.draw = function(source, matrix)
    {
        //TODO a lot to fix..
        matrix = matrix || new Matrix();
        
        var context = this.__context;
        context.save();
        context.setTransform(
            matrix.a,
            matrix.b,
            matrix.c,
            matrix.d,
            matrix.tx,
            matrix.ty);
        source.__render(context, matrix, new ColorTransform());
        context.restore();
        this.__modified = true;
    };
    
    this.fillRect = function(rect, color)
    {
        var context = this.__context;
        context.save();
        context.clearRect(rect.x, rect.y, rect.width, rect.height);
        context.fillStyle = __toRGBA(color);
        context.beginPath();
        context.rect(rect.x, rect.y, rect.width, rect.height);
        context.fill();
        context.restore();
        this.__modified = true;
    };
    
    this.floodFill = function(x, y, color)
    {
        var width = this.__width;
        var height = this.__height;
        var imageData = this.__context.getImageData(0, 0, width, height);
        var data = imageData.data;
        
        //get the array index
        var p = ((y * width) + x) * 4;
        
        //get the target color to overwrite(rgba array)
        var targetColor = [data[p], data[p+1], data[p+2], data[p+3]];
        
        //replacement color to rgba array
        var replacementColor = [color >> 16 & 0xFF, color >> 8  & 0xFF, color & 0xFF, color >> 24 & 0xFF];
        
        if (targetColor[0] === replacementColor[0] && targetColor[1] === replacementColor[1] &&
            targetColor[2] === replacementColor[2] && targetColor[3] === replacementColor[3]) {
                //already the same color
                return;
        }
        
        //start the search
        floodFillScanlineStack(data, x, y, width, height, targetColor, replacementColor);
        
        this.__context.putImageData(imageData, 0, 0);
        this.__modified = true;
    };
    
    this.generateFilterRect = function(sourceRect, filter)
    {
        return filter.__generateRect(sourceRect);
    };
    
    this.getColorBoundsRect = function(mask, color, findColor)
    {
        if (mask === undefined || color === undefined) { return null; }
        findColor = (findColor) ? true : false;
        
        var width  = this.__width;
        var height = this.__height;
        var data   = this.__context.getImageData(0, 0, width, height).data;
        
        var minX = width;
        var minY = height;
        var maxX = 0;
        var maxY = 0;
        var x, y, p, value;
        
        color = color & mask;
        
        if (findColor === true) {
            for (x = 0; x < width; ++x)
            {
                for (y = 0; y < height; ++y)
                {
                    p = ((y * width) + x) * 4;
                    value = (data[p+3] << 24) | (data[p] << 16) | (data[p+1] << 8) | data[p+2];
                    if ((value & mask) === color) {
                        if (x < minX) { minX = x; }
                        if (x > maxX) { maxX = x; }
                        if (y < minY) { minY = y; }
                        if (y > maxY) { maxY = y; }
                    }
                }
            }
        }
        else {
            for (x = 0; x < width; ++x)
            {
                for (y = 0; y < height; ++y)
                {
                    p = ((y * width) + x) * 4;
                    value = (data[p+3] << 24) | (data[p] << 16) | (data[p+1] << 8) | data[p+2];
                    if ((value & mask) !== color) {
                        if (x < minX) { minX = x; }
                        if (x > maxX) { maxX = x; }
                        if (y < minY) { minY = y; }
                        if (y > maxY) { maxY = y; }
                    }
                }
            }
        }
        
        var rect = new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
        if (rect.isEmpty()) {
            rect.setEmpty();
        }
        return rect;
    };
    
    this.getImageData = function()
    {
        return this.__context.getImageData.apply(this.__context, arguments);
    };
    
    this.getPixel = function(x, y)
    {
        if (!this.__rect.contains(x, y)) { return 0; }
        
        var data = this.__context.getImageData(x, y, 1, 1).data;
        return (data[0] << 16) | (data[1] << 8) | data[2];
    };
    
    this.getPixel32 = function(x, y)
    {
        if (!this.__rect.contains(x, y)) { return 0; }
        
        var data = this.__context.getImageData(x, y, 1, 1).data;
        return ((data[3] << 24) | (data[0] << 16) | (data[1] << 8) | data[2]) >>> 0;
    };
    
    this.getPixels = function(rect)
    {
        return this.__context.getImageData(rect.x, rect.y, rect.width, rect.height).data;
    };
    
    this.hitTest = function(firstPoint, firstAlphaThreshold, secondObject, secondBitmapDataPoint, secondAlphaThreshold)
    {
        secondAlphaThreshold = secondAlphaThreshold || 1;
        //TODO
        return false;
    };
    
    this.lock = function()
    {
        //use getImageData and putImageData
        __noImp('BitmapData.lock()');
    };
    
    this.unlock = function()
    {
        //use getImageData and putImageData
        __noImp('BitmapData.unlock()');
    };
    
    this.merge = function(sourceBitmapData, sourceRect, destPoint, redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var destData = destImageData.data;
        var sourceData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height).data;
        var length = sourceData.length;
        
        for (var i = 0; i < length;)
        {
            destData[i]   = (sourceData[i] * redMultiplier   + destData[i] * (256 - redMultiplier))   / 256;
            destData[++i] = (sourceData[i] * greenMultiplier + destData[i] * (256 - greenMultiplier)) / 256;
            destData[++i] = (sourceData[i] * blueMultiplier  + destData[i] * (256 - blueMultiplier))  / 256;
            destData[++i] = (sourceData[i] * alphaMultiplier + destData[i] * (256 - alphaMultiplier)) / 256;
            ++i;
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    
    this.noise = function()
    {
        //alert("HELP!");
    };
    
    this.paletteMap = function(sourceBitmapData, sourceRect, destPoint, redArray, greenArray, blueArray, alphaArray)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        //var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        //var destImageData = this.__context.createImageData(destRect.width, destRect.height);
        var sourceData = sourceImageData.data;
        //var destData = destImageData.data;
        var length = sourceData.length;
        
        if (!(redArray   instanceof Array)) { redArray   = []; }
        if (!(greenArray instanceof Array)) { greenArray = []; }
        if (!(blueArray  instanceof Array)) { blueArray  = []; }
        if (!(alphaArray instanceof Array)) { alphaArray = []; }
        
        for (var i = 0; i < 256; ++i)
        {
            if (redArray[i]   === undefined) { redArray[i]   = i << 16; }
            if (greenArray[i] === undefined) { greenArray[i] = i << 8; }
            if (blueArray[i]  === undefined) { blueArray[i]  = i; }
            if (alphaArray[i] === undefined) { alphaArray[i] = i << 24; }
        }
        
        var newColor, newRed, newGreen, newBlue, newAlpha;
        for (i = 0; i < length;)
        {
            
            newColor = redArray[sourceData[i]] | greenArray[sourceData[i+1]] | blueArray[sourceData[i+2]] | alphaArray[sourceData[i+3]];
            newAlpha = newColor >> 24 & 0xFF;
            newRed   = newColor >> 16 & 0xFF;
            newGreen = newColor >>  8 & 0xFF;
            newBlue  = newColor       & 0xFF;
            
            sourceData[i++] = newRed;
            sourceData[i++] = newGreen;
            sourceData[i++] = newBlue;
            sourceData[i++] = newAlpha;
        }
        
        this.__context.putImageData(sourceImageData, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    
    this.perlinNoise = function(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsets)
    {
        //alert("HELP!");
    };
    
    this.pixelDissolve = function(sourceBitmapData, sourceRect, destPoint, randomSeed, numPixels, fillColor)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var destData = destImageData.data;
        var width = destImageData.width;
        var height = destImageData.height;
        var size = width * height;
        var i, p, c;
        
        if (!numPixels) { numPixels = (size / 30) | 0; }
        else if (numPixels > size) { numPixels = size; }
        
        if (randomSeed < 1) { randomSeed = (randomSeed * 0xFFFFFFFF) | 0; }
        
        //extract the real seed and index from randomSeed
        var seed  = randomSeed & 0xFF;//only 256 patterns
        var index = randomSeed >> 8 & 0xFFFFFF;//max is 16,777,215
        
        var coordinateShuffler = new CoordinateShuffler(width, height, seed, 3, 256);
        var coords = coordinateShuffler.getCoordinates(numPixels, index);
        
        if (sourceBitmapData === this) {
            fillColor = fillColor | 0;
            var fillAlpha = fillColor >> 24 & 0xFF;
            var fillRed   = fillColor >> 16 & 0xFF;
            var fillGreen = fillColor >> 8  & 0xFF;
            var fillBlue  = fillColor & 0xFF;
            
            for (i = 0; i < numPixels; ++i)
            {
                c = coords[i];
                p = (c[1] * width + c[0]) * 4;
                destData[p]   = fillRed;
                destData[++p] = fillGreen;
                destData[++p] = fillBlue;
                destData[++p] = fillAlpha;
            }
        }
        else {
            //TODO: make sure the sourceRect and destRect are the same size
            var sourceData = sourceBitmapData.__context.getImageData(
                                sourceRect.x,sourceRect.y, width, height).data;
            for (i = 0; i < numPixels; ++i)
            {
                c = coords[i];
                p = (c[1] * width + c[0]) * 4;
                destData[p]   = sourceData[p];
                destData[++p] = sourceData[p];
                destData[++p] = sourceData[p];
                destData[++p] = sourceData[p];
            }
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
        
        //return the new seed
        return ((coordinateShuffler.getIndex() << 8) | seed) >>> 0;
    };
    
    this.putImageData = function()
    {
        this.__context.putImageData.apply(this.__context, arguments);
    };
    
    this.scroll = function(x, y)
    {
        var sourceX, sourceY, sourceWidth, sourceHeight;
        if (x < 0) {
            sourceX = -x;
            sourceWidth = this.__width + x;
        }
        else {
            sourceX = 0;
            sourceWidth = this.__width - x;
        }
        if (y < 0) {
            sourceY = -y;
            sourceHeight = this.__height + y;
        }
        else {
            sourceY = 0;
            sourceHeight = this.__height + y;
        }
        var imageData = this.__context.getImageData(sourceX, sourceY, sourceWidth, sourceHeight);
        this.__context.putImageData(imageData, x, y);
        this.__modified = true;
    };
    
    this.setPixel = function(x, y, color)
    {
        var a = 255;
        var r = color >> 16 & 0xFF;
        var g = color >> 8  & 0xFF;
        var b = color & 0xFF;
        
        var pixel = this.__pixel;
        var data = pixel.data;
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a;
        this.__context.putImageData(pixel, x, y);
        this.__modified = true;
    };
    
    this.setPixel32 = function(x, y, color)
    {
        var a = color >> 24 & 0xFF;
        var r = color >> 16 & 0xFF;
        var g = color >> 8  & 0xFF;
        var b = color & 0xFF;
        
        var pixel = this.__pixel;
        var data = pixel.data;
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a;
        this.__context.putImageData(pixel, x, y);
        this.__modified = true;
    };
    
    this.setPixels = function(rect, inputArray)
    {
        var rectLength = rect.width * rect.height * 4;
        var arrayLength = inputArray.length;
        var length = (rectLength > arrayLength) ? arrayLength : rectLength;
        
        var imageData = this.__context.createImageData(rect.width, rect.height);
        var data = imageData.data;
        for (var i = 0; i < length; ++i)
        {
            data[i] = inputArray[i];
        }
        this.__context.putImageData(imageData, rect.x, rect.y);
        this.__modified = true;
    };
    
    this.threshold = function(sourceBitmapData, sourceRect, destPoint, operation, threshold, color, mask, copySource)
    {
        if (color === undefined) { color = 0x00000000; }
        if (mask === undefined) { mask = 0xFFFFFFFF; }
        if (copySource === undefined) { copySource = false; }
        
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var destData = destImageData.data;
        var sourceData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height).data;
        var length = sourceData.length;
        
        threshold = threshold & mask;
        var colors = [color >> 16 & 0xFF, color >> 8 & 0xFF, color & 0xFF, color >> 24 & 0xFF];
        
        var destColor;
        var i;
        var cnt = 0;
        
        if (operation == '<') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourceData[i+3] << 24) | (sourceData[i] << 16) | (sourceData[i+1] << 8) | sourceData[i+2];
                if ((testColor & mask) < threshold) {
                    destData[i] = colors[0]; destData[i+1] = colors[1]; destData[i+2] = colors[2]; destData[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destData[i] = sourceData[i]; destData[i+1] = sourceData[i+1]; destData[i+2] = sourceData[i+2]; destData[i+3] = sourceData[i+3];
                }
            }
        }
        else if (operation == '<=') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourceData[i+3] << 24) | (sourceData[i] << 16) | (sourceData[i+1] << 8) | sourceData[i+2];
                if ((testColor & mask) <= threshold) {
                    destData[i] = colors[0]; destData[i+1] = colors[1]; destData[i+2] = colors[2]; destData[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destData[i] = sourceData[i]; destData[i+1] = sourceData[i+1]; destData[i+2] = sourceData[i+2]; destData[i+3] = sourceData[i+3];
                }
            }
        }
        else if (operation == '>') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourceData[i+3] << 24) | (sourceData[i] << 16) | (sourceData[i+1] << 8) | sourceData[i+2];
                if ((testColor & mask) > threshold) {
                    destData[i] = colors[0]; destData[i+1] = colors[1]; destData[i+2] = colors[2]; destData[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destData[i] = sourceData[i]; destData[i+1] = sourceData[i+1]; destData[i+2] = sourceData[i+2]; destData[i+3] = sourceData[i+3];
                }
            }
        }
        else if (operation == '>=') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourceData[i+3] << 24) | (sourceData[i] << 16) | (sourceData[i+1] << 8) | sourceData[i+2];
                if ((testColor & mask) >= threshold) {
                    destData[i] = colors[0]; destData[i+1] = colors[1]; destData[i+2] = colors[2]; destData[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destData[i] = sourceData[i]; destData[i+1] = sourceData[i+1]; destData[i+2] = sourceData[i+2]; destData[i+3] = sourceData[i+3];
                }
            }
        }
        else if (operation == '==') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourceData[i+3] << 24) | (sourceData[i] << 16) | (sourceData[i+1] << 8) | sourceData[i+2];
                if ((testColor & mask) == threshold) {
                    destData[i] = colors[0]; destData[i+1] = colors[1]; destData[i+2] = colors[2]; destData[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destData[i] = sourceData[i]; destData[i+1] = sourceData[i+1]; destData[i+2] = sourceData[i+2]; destData[i+3] = sourceData[i+3];
                }
            }
        }
        else if (operation == '!=') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourceData[i+3] << 24) | (sourceData[i] << 16) | (sourceData[i+1] << 8) | sourceData[i+2];
                if ((testColor & mask) != threshold) {
                    destData[i] = colors[0]; destData[i+1] = colors[1]; destData[i+2] = colors[2]; destData[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destData[i] = sourceData[i]; destData[i+1] = sourceData[i+1]; destData[i+2] = sourceData[i+2]; destData[i+3] = sourceData[i+3];
                }
            }
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
        return cnt;
    };
    
    /* getters and setters */
    this.__get__width = function()
    {
        return this.__width;
    };
    
    this.__get__height = function()
    {
        return this.__height;
    };
    
    this.__get__rect = function()
    {
        return this.__rect.clone();
    };
    
    this.__get__transparent = function()
    {
        //return this.__transparent;
        return true;
    };
    
    this.toString = function()
    {
        return '[object BitmapData]';
    };
});
var BitmapDataChannel = {
    RED: 1,
    GREEN: 2,
    BLUE: 4,
    ALPHA: 8
};
var Graphics = new Class(Object, function()
{
    var BEGIN_BITMAP_FILL = 0;
    var BEGIN_FILL = 1;
    var BIGIN_GRADIENT_FILL = 2;
    var CLEAR = 3;
    var CURVE_TO = 4;
    var DRAW_CIRCLE = 5;
    var DRAW_ELLIPSE = 6;
    var DRAW_RECT = 7;
    var DRAW_ROUND_RECT = 8;
    var END_FILL = 9;
    var LINE_GRADIENT_STYLE = 10;
    var LINE_STYLE = 11;
    var LINE_TO = 12;
    var MOVE_TO = 13;
    
    this.__init__ = function()
    {
        this.__lineWidth = 0;
        this.__x = 0;
        this.__y = 0;
        this.__rect = new Rectangle();
        this.__commands = [];
        this.__modified = false;
    };
    
    this.__updateRect = function(x, y, width, height)
    {
        var rect = new Rectangle(x, y, width, height);
        rect.repair();
        //TODO: consider line caps
        rect.inflate(this.__lineWidth * 0.5, this.__lineWidth * 0.5);
        this.__rect = this.__rect.union(rect);
    };
    
    this.beginBitmapFill = function(bitmap, matrix, repeat, smooth)
    {
        //TODO:
    };
    
    this.beginFill = function(color, alpha)
    {
        if (alpha === undefined) { alpha = 1; }
        this.__commands.push([BEGIN_FILL, color, alpha]);
    };
    
    this.beginGradientFill = function(type, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio)
    {
        //TODO:
    };
    
    this.curveTo = function(controlX, controlY, anchorX, anchorY)
    {
        //TODO: calculate rect
        this.__updateRect(this.__x, this.__y, Math.max(controlX, anchorX) - this.__x, Math.max(controlY, anchorY) - this.__y);
        this.__x = anchorX;
        this.__y = anchorY;
        this.__commands.push([CURVE_TO, controlX, controlY, anchorX, anchorY]);
        this.__modified = true;
    };
    
    this.drawEllipse = function(x, y, width, height)
    {
        this.__updateRect(x, y, width, height);
        this.__x = x + width;
        this.__y = y + height / 2;
        this.__commands.push([DRAW_ELLIPSE, x, y, width, height]);
        this.__modified = true;
    };
    
    this.drawCircle = function(x, y, radius)
    {
        this.__updateRect(x - radius, y - radius, radius * 2, radius * 2);
        this.__x = x + radius;
        this.__y = y;
        this.__commands.push([DRAW_CIRCLE, x, y, radius]);
        this.__modified = true;
    };
    
    this.drawRect = function(x, y, width, height)
    {
        this.__updateRect(x, y, width, height);
        this.__x = x;
        this.__y = y;
        this.__commands.push([DRAW_RECT, x, y, width, height]);
        this.__modified = true;
    };
    
    this.drawRoundRect = function(x, y, width, height, ellipseWidth, ellipseHeight)
    {
        if (ellipseHeight === undefined) { ellipseHeight = ellipseWidth; }
        this.__updateRect(x, y, width, height);
        this.__x = x + width;
        this.__y = y + height - ellipseHeight / 2;
        this.__commands.push([DRAW_ROUND_RECT, x, y, width, height, ellipseWidth, ellipseHeight]);
        this.__modified = true;
    };
    
    this.endFill = function()
    {
        this.__commands.push([END_FILL]);
        this.__modified = true;
    };
    
    this.lineGradientStyle = function(type, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio)
    {
        
    };
    
    this.lineStyle = function(thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit)
    {
        if (color === undefined) { color = 0; }
        if (alpha === undefined) { alpha = 1; }
        if (pixelHinting == undefined) { pixelHinting = true; }
        if (scaleMode === undefined) { scaleMode = 'normal'; }
        if (caps === undefined) { caps = CapsStyle.ROUND; }
        if (joints === undefined) { joints = JointStyle.ROUND; }
        if (miterLimit === undefined) { miterLimit = 3; }
        this.__lineWidth = thickness;
        this.__commands.push([LINE_STYLE, thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit]);
    };
    
    this.moveTo = function(x, y)
    {
        this.__x = x;
        this.__y = y;
        this.__commands.push([MOVE_TO, x, y]);
    };
    
    this.lineTo = function(x, y)
    {
        this.__updateRect(this.__x, this.__y, x - this.__x, y - this.__y);
        this.__x = x;
        this.__y = y;
        this.__commands.push([LINE_TO, x, y]);
        this.__modified = true;
    };
    
    this.clear = function()
    {
        this.__rect.setEmpty();
        this.__commands = [];
        this.__modified = true;
    };
    
    this.__fill = function(context, fillAlpha)
    {
        context.closePath();

        if (fillAlpha === 1) {
            context.fill();
        }
        else if (fillAlpha !== 0) {
            var alpha = context.globalAlpha;
            context.globalAlpha *= fillAlpha;
            context.fill();
            context.globalAlpha = alpha;
        }
    };
    
    this.__stroke = function(context, strokeAlpha)
    {
        if (strokeAlpha === 1) {
            context.stroke();
        }
        else if (strokeAlpha !== 0) {
            var alpha = context.globalAlpha;
            context.globalAlpha *= strokeAlpha;
            context.stroke();
            context.globalAlpha = alpha;
        }
    };
    
    this.__closeStroke = function(context, sx, sy, ax, ay)
    {
        if (sx !== ax || sy !== ay) {
            context.lineTo(sx, sy);
        }
    };
    
    this.__render = function(context, matrix, colorTransform)
    {
        //TODO: optimize
        var doFill = false;
        var fillAlpha = 1;
        var doStroke = false;
        var strokeAlpha = 1;
        //this is the position where the last graphics.beginFill was called
        //it is used to close stroke path.
        var sx = 0, sy = 0;
        //current anchor position.
        //used for moveTo after any context.beginPath
        var ax = 0, ay = 0;
        
        var commands = this.__commands;
        var commandLength = commands.length;
        
        //a lot of declarations to avoid redeclarations
        var cmd, type, i, ii;
        var thickness, pixelHinting, scaleMode;
        var x, y, radius;
        var widht, height;
        var ellipseWidth, ellipseHeight;
        var xRadius, yRadius, centerX, centerY, angleDelta, xCtrlDist, yCtrlDist, rx, ry, angle;
        var right, bottom;
        
        //fill phase
        context.beginPath();
        context.moveTo(0, 0);
        for (i = 0, l = commandLength; i < l; ++i)
        {
            cmd = commands[i];
            type = cmd[0];
            switch (type)
            {
                case LINE_TO:
                    ax = cmd[1];
                    ay = cmd[2];
                    context.lineTo(ax, ay);
                    break;
                case MOVE_TO:
                    ax = cmd[1];
                    ay = cmd[2];
                    context.moveTo(ax, ay);
                    break;
                case BEGIN_FILL:
                    if (doFill) { this.__fill(context, fillAlpha); }
                    doFill = true;
                    fillAlpha = cmd[2];
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.fillStyle = (colorTransform) ?
                            __toRGB(colorTransform.transformColor(cmd[1])) :
                            __toRGB(cmd[1]);
                    break;
                case LINE_STYLE:
                    break;
                case CURVE_TO:
                    ax = cmd[3];
                    ay = cmd[4];
                    context.quadraticCurveTo(cmd[1], cmd[2], ax, ay);
                    break;
                case END_FILL:
                    if (doFill) { this.__fill(context, fillAlpha); }
                    doFill = false;
                    break;
                case DRAW_RECT:
                    //anchor at the top left
                    ax = cmd[1];
                    ay = cmd[2];
                    context.rect(ax, ay, cmd[3], cmd[4]);
                    context.moveTo(ax, ay);
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    radius = cmd[3];
                    ax = x + radius;
                    ay = cmd[2];
                    context.moveTo(ax, ay);
                    context.arc(x, ay, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
                    break;
                case DRAW_ROUND_RECT:
                    //anchor at the right bottom corner
                    x = cmd[1];
                    y = cmd[2];
                    width  = cmd[3];
                    height = cmd[4];
                    ellipseWidth  = cmd[5];
                    ellipseHeight = cmd[6];
                    right = x + width;
                    bottom = y + height;
                    ellipseWidth  /= 2;
                    ellipseHeight /= 2;
                    ax = right;
                    ay = bottom - ellipseHeight;
                    context.moveTo(ax, ay);
                    context.quadraticCurveTo(right, bottom, right - ellipseWidth, bottom);
                    context.lineTo(x + ellipseWidth, bottom);
                    context.quadraticCurveTo(x, bottom, x, bottom - ellipseHeight);
                    context.lineTo(x, y + ellipseHeight);
                    context.quadraticCurveTo(x, y, x + ellipseWidth, y);
                    context.lineTo(right - ellipseWidth, y);
                    context.quadraticCurveTo(right, y, right, y + ellipseHeight);
                    context.lineTo(ax, ay);
                    break;
                case DRAW_ELLIPSE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    xRadius = width / 2;
                    yRadius = height / 2;
                    centerX = x + xRadius;
                    centerY = y + yRadius;
                    angleDelta = 0.7853981633974483;/*Math.PI / 4*/
                    xCtrlDist = xRadius / 0.9238795325112867;/*Math.cos(angleDelta/2)*/
                    yCtrlDist = yRadius / 0.9238795325112867;
                    angle = 0;
                    context.moveTo(x + width, y + yRadius);
                    for (ii = 0; ii < 8; ii++)
                    {
                        angle += angleDelta;
                        rx = centerX + Math.cos(angle - 0.39269908169872414) * xCtrlDist;
                        ry = centerY + Math.sin(angle - 0.39269908169872414) * yCtrlDist;
                        ax = centerX + Math.cos(angle) * xRadius;
                        ay = centerY + Math.sin(angle) * yRadius;
                        context.quadraticCurveTo(rx, ry, ax, ay);
                    }
                    break;
                default:
                    break;
            }
        }
        if (doFill) { this.__fill(context, fillAlpha); }
        
        //stroke phase
        sx = sy = ax = ay = 0;
        context.beginPath();
        context.moveTo(0, 0);
        for (i = 0, l = commandLength; i < l; ++i)
        {
            cmd = commands[i];
            type = cmd[0];
            switch (type)
            {
                case LINE_TO:
                    ax = cmd[1];
                    ay = cmd[2];
                    context.lineTo(ax, ay);
                    break;
                case MOVE_TO:
                    sx = ax = cmd[1];
                    sy = ay = cmd[2];
                    context.moveTo(ax, ay);
                    break;
                case BEGIN_FILL:
                    if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
                    ax = sx;
                    ay = sy;
                    doFill = true;
                    break;
                case LINE_STYLE:
                    if (doStroke) { this.__stroke(context, strokeAlpha); }
                    thickness    = cmd[1];
                    //pixelHinting = cmd[4];
                    //scaleMode    = cmd[5];
                    doStroke = (thickness) ? true : false;
                    strokeAlpha = cmd[3];
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.lineWidth = thickness;
                    context.strokeStyle = (colorTransform) ?
                            __toRGB(colorTransform.transformColor(cmd[2])) :
                            __toRGB(cmd[2]);
                    context.lineCap = cmd[6];
                    context.lineJoin = cmd[7];
                    context.miterLimit = cmd[8];
                    break;
                case CURVE_TO:
                    ax = cmd[3];
                    ay = cmd[4];
                    context.quadraticCurveTo(cmd[1], cmd[2], ax, ay);
                    break;
                case END_FILL:
                    if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
                    ax = sx;
                    ay = sy;
                    doFill = false;
                    break;
                case DRAW_RECT:
                    //anchor at the top left
                    sx = ax = cmd[1];
                    sy = ay = cmd[2];
                    context.rect(ax, ay, cmd[3], cmd[4]);
                    context.moveTo(ax, ay);
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    radius = cmd[3];
                    sx = ax = x + radius;
                    sy = ay = cmd[2];
                    context.moveTo(ax, ay);
                    context.arc(x, ay, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
                    break;
                case DRAW_ROUND_RECT:
                    //anchor at the right bottom corner
                    x = cmd[1];
                    y = cmd[2];
                    width  = cmd[3];
                    height = cmd[4];
                    ellipseWidth  = cmd[5];
                    ellipseHeight = cmd[6];
                    right = x + width;
                    bottom = y + height;
                    ellipseWidth  /= 2;
                    ellipseHeight /= 2;
                    ax = right;
                    ay = bottom - ellipseHeight;
                    context.moveTo(ax, ay);
                    context.quadraticCurveTo(right, bottom, right - ellipseWidth, bottom);
                    context.lineTo(x + ellipseWidth, bottom);
                    context.quadraticCurveTo(x, bottom, x, bottom - ellipseHeight);
                    context.lineTo(x, y + ellipseHeight);
                    context.quadraticCurveTo(x, y, x + ellipseWidth, y);
                    context.lineTo(right - ellipseWidth, y);
                    context.quadraticCurveTo(right, y, right, y + ellipseHeight);
                    context.lineTo(ax, ay);
                    sx = ax;
                    sy = ay;
                    break;
                case DRAW_ELLIPSE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    xRadius = width / 2;
                    yRadius = height / 2;
                    centerX = x + xRadius;
                    centerY = y + yRadius;
                    angleDelta = 0.7853981633974483;/*Math.PI / 4*/
                    xCtrlDist = xRadius / 0.9238795325112867;/*Math.cos(angleDelta/2)*/
                    yCtrlDist = yRadius / 0.9238795325112867;
                    angle = 0;
                    context.moveTo(x + width, y + yRadius);
                    for (ii = 0; ii < 8; ii++)
                    {
                        angle += angleDelta;
                        rx = centerX + Math.cos(angle - 0.39269908169872414) * xCtrlDist;
                        ry = centerY + Math.sin(angle - 0.39269908169872414) * yCtrlDist;
                        ax = centerX + Math.cos(angle) * xRadius;
                        ay = centerY + Math.sin(angle) * yRadius;
                        context.quadraticCurveTo(rx, ry, ax, ay);
                    }
                    sx = ax;
                    sy = ay;
                    break;
                default:
                    break;
            }
        }
        if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
        if (doStroke) { this.__stroke(context, strokeAlpha); }
    };
    
    this.toString = function()
    {
        return '[object Graphics]';
    };
});
var Loader = new Class(DisplayObjectContainer, function()
{
    var noImplement = function()
    {
        throw new Error("The Loader class does not implement this method.");
    };
    
    /* @constructor */
    this.__init__ = function()
    {
        DisplayObjectContainer.call(this);
        this.__content = null;
        this.__contentLoaderInfo = new LoaderInfo(this);
        this.__img = null;
    };
    
    /* @override DisplayObject */
    this.__getAsBitmap = function()
    {
        if (this.__content) {
            return this.__content.__getAsBitmap();
        }
    };
    
    /* @override DisplayObject */
    this.__getModified = function()
    {
        return this.__transform.__modified || this.__modified;
    };
    
    /* @override DisplayObject */
    this.__setModified = function(v)
    {
        this.__transform.__modified = this.__modified = v;
    };
    
    /* @override DisplayObject */
    this.__render = function(context, matrix, colorTransform)
    {
        if (!this.__content) {
            return;
        }
        
        this.__renderChildren(context, matrix, colorTransform);
    };
    
    this.load = function(request)
    {
        if (typeof request == 'string') {
            request = new URLRequest(request);
        }
        
        if (this.__content) {
            this.unload();
        }
        
        var img = new Image();
        var self = this;
        img.onload = function(e)
        {
            //convert HTMLImageElement to BitmapData(HTMLCanvasElement)
            var bitmapData = new BitmapData(this.width, this.height, false, 0x00000000);
            bitmapData.__context.drawImage(this, 0, 0);
            self.__content = new Bitmap(bitmapData);
            
            //add content as a child
            self.__addChildAt(self.__content, 0);
            
            var contentLoaderInfo = self.__contentLoaderInfo;
            contentLoaderInfo.__content = self.__content;
            contentLoaderInfo.__width = bitmapData.__width;
            contentLoaderInfo.__height = bitmapData.__height;
            contentLoaderInfo.dispatchEvent(new Event(Event.INIT, false, false));
            contentLoaderInfo.dispatchEvent(new Event(Event.COMPLETE, false, false));
            self.close();
        };
        img.onerror = function(e)
        {
            self.__contentLoaderInfo.dispatchEvent(new IOErrorEvent(IOErrorEvent.IO_ERROR, false, false));
            self.close();
        };
        img.onabort = function(e)
        {
            self.close();
        };
        img.src = request.__url;
        this.__img = img;
    };
    
    this.unload = function()
    {
        if (this.__content) {
            this.__removeChildAt(0);
            this.__content = null;
            var contentLoaderInfo = this.__contentLoaderInfo;
            contentLoaderInfo.__content = null;
            contentLoaderInfo.__width = 0;
            contentLoaderInfo.__height = 0;
            contentLoaderInfo.dispatchEvent(new Event(Event.UNLOAD, false, false));
        }
    };
    
    this.close = function()
    {
        this.__img.src = null;
        this.__img.onload = null;
        this.__img.onerror = null;
        this.__img.onabort = null;
        this.__img = null;
    };
    
    this.addChild = noImplement;
    this.addChildAt = noImplement;
    this.removeChild = noImplement;
    this.removeChildAt = noImplement;
    this.setChildIndex = noImplement;
    
    /* getters and setters */
    this.__get__content = function()
    {
        return this.__content;
    };
    
    this.__get__contentLoaderInfo = function()
    {
        return this.__contentLoaderInfo;
    };
    
    this.toString = function()
    {
        return '[object Loader]';
    };
});
var LoaderInfo = new Class(EventDispatcher, function()
{
    this.__init__ = function()
    {
        EventDispatcher.call(this);
        this.__content = null;
        this.__width = 0;
        this.__height = 0;
    };
    
    /* getters and setters */
    this.__get__content = function()
    {
        return this.__content;
    };
    this.__get__width = function()
    {
        return this.__width;
    };
    this.__get__height = function()
    {
        return this.__height;
    };
    
    this.toString = function()
    {
        return '[object LoaderInfo]';
    };
});
var Shape = new Class(DisplayObject, function()
{
    this.__init__ = function()
    {
        DisplayObject.call(this);
        this.__graphics = null;
    };
    
    //override
    this.__getContentBounds = function()
    {
        if (this.__graphics) {
            return this.__graphics.__rect.clone();
        }
        return new Rectangle();
    };
    
    //override
    this.__getModified = function()
    {
        return (this.__modified ||
                this.__transform.__modified ||
                (this.__graphics && this.__graphics.__modified));
    };
    
    //override
    this.__setModified = function(v)
    {
        this.__modified = v;
        this.__transform.__modified = v;
        if (this.__graphics) {
            this.__graphics.__modified = v;
        }
    };
    
    //override
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__graphics) {
            this.__graphics.__render(context, matrix, colorTransform);
        }
    };
    
    //override
    this.__hitTestPoint = function(context, matrix, point)
    {
        if (this.__graphics) {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (bounds.containsPoint(localPoint)) {
                this.__graphics.__render(context, matrix, null);
                return (context.getImageData(point.x, point.y, 1, 1).data[3] !== 0);
            }
        }
        return false;
    };
    
    /* getters and setters */
    this.__get__graphics = function()
    {
        if (this.__graphics === null) {
            this.__graphics = new Graphics();
        }
        return this.__graphics;
    };
    
    this.toString = function()
    {
        return '[object Shape]';
    };
});
var Sprite = new Class(DisplayObjectContainer, function()
{
    this.__init__ = function()
    {
        DisplayObjectContainer.call(this);
        this.__graphics = null;
        //this.__dropTarget = null;
        this.buttonMode = false;
        //this.hitArea = null;
        //this.soundTransform = null;
        this.useHandCursor = true;
    };
    
    /* @override DisplayObject */
    this.__getContentBounds = Shape.prototype.__getContentBounds;
    
    /* @override DisplayObject */
    this.__getModified = Shape.prototype.__getModified;
    
    /* @override DisplayObject */
    this.__setModified = Shape.prototype.__setModified;
    
    /* @override DisplayObject */
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__graphics) {
            this.__graphics.__render(context, matrix, colorTransform);
        }
        
        this.__renderChildren(context, matrix, colorTransform);
    };
    
    /* @override DisplayObject.__hitTestPoint */
    this.__hitTestPoint = Shape.prototype.__hitTestPoint;
    
    this.startDrag = function(lockCenter, bounds)
    {
        this.__stage.startDrag(this, lockCenter, bounds);
    };
    
    this.stopDrag = function()
    {
        this.__stage.stopDrag();
    };
    
    /* getters and setters */
    this.__get__graphics = Shape.prototype.__get__graphics;
    
    this.toString = function()
    {
        return '[object Sprite]';
    };
});
var Stage = new Class(DisplayObjectContainer, function()
{
    this.__init__ = function(canvas, width, height, frameRate)
    {
        DisplayObjectContainer.call(this);
        
        canvas    = canvas || null;
        width     = width || 640;
        height    = height || 480;
        frameRate = frameRate || 30;
        
        this.__initialized = false;
        this.__rect = new Rectangle(0, 0, width, height);
        this.__stageWidth  = width;
        this.__stageHeight = height;
        this.__offsetX = 0;
        this.__offsetY = 0;
        this.__frameRate = frameRate;
        this.__timer = null;
        this.__align = StageAlign.TOP_LEFT;
        this.__scaleMode = StageScaleMode.NO_SCALE;
        this.__renderMode = StageRenderMode.AUTO;
        this.__mouseX = 0;
        this.__mouseY = 0;
        //wether the mouse is over the stage rect
        this.__mouseOverStage = false;
        //the current object under the mouse point.
        this.__objectUnderMouse = null;
        //the object that the mouse was pressed.
        //if this is NULL the mouse is not pressed.
        this.__mouseDownObject = null;
        //the last object that received a CLICK event.
        //if this object gets clicked again in 500ms DOUBLE_CLICK will be called.
        this.__mouseClickObject = null;
        this.__dragOffsetX = 0;
        this.__dragOffsetY = 0;
        this.__dragTarget = null;
        this.__dragBounds = null;
        this.__renderAll = true;
        this.__redrawRegions = [];
        this.__keyPressTimer = null;
        this.__isKeyDown = false;
        this.__preventMouseWheel = false;
        this.__preventTabKey = false;
        this.__canvasWidth = null;
        this.__canvasHeight = null;
        this.__stage = null;
        this.__root = null;
        this.stageFocusRect = false;
        this.showRedrawRegions = false;
        
        //TODO start preloading
        
        //setup
        if (!window.document.body) {
            var stage = this;
            cs3.utils.addOnload(function()
            {
                stage.__setup(canvas, width, height, frameRate);
            });
        }
        else {
            this.__setup(canvas, width, height, frameRate);
        }
    };
    
    this.__setup = function(canvas, width, height, frameRate)
    {
        // document.body should now be loaded
        // setup stage
        if (canvas instanceof HTMLCanvasElement) {
            this.canvas = canvas;
        }
        else if (typeof canvas == 'string') {
            this.canvas = document.getElementById(canvas);
        }
        
        if (!this.canvas) {
            this.canvas = cs3.utils.createCanvas(0, 0);
            document.body.appendChild(this.canvas);
        }
        
        this.__context = cs3.utils.getContext2d(this.canvas);
        this.__hiddenCanvas = cs3.utils.createCanvas(0, 0);
        this.__hiddenContext = cs3.utils.getContext2d(this.__hiddenCanvas);
        
        this.canvas.style.cursor = 'default';
        this.canvas.tabIndex = 1;// enable focus events
        this.canvas.style.outline = "none";// remove focus rects
        
        //register stage for document events
        cs3.core.registerStage(this);
        
        //adjust stage size
        this.__resize();
        
        //call children ADDED_TO_STAGE events
        __applyDown(this, function(stage, event)
        {
            this.__stage = this.__root = stage;
            this.dispatchEvent(event);
        }, [this, new Event(Event.ADDED_TO_STAGE, false, false)]);
        
        //start frame loops
        this.__initialized = true;
        this.__enterFrame();
    };
    
    this.__addRedrawRegion = function(rect)
    {
        rect = rect.clone();
        
        //only add parts inside of the stage rect
        if (!this.__rect.containsRect(rect)) {
            if (!this.__rect.intersects(rect)) {
                return;
            }
            rect = this.__rect.intersection(rect);
        }
        //rect = this.__rect.intersection(rect);
        //if (rect.isEmpty()) { return; }
        
        //convert float's to int's
        __ceilRect(rect);
        
        var redrawRegions = this.__redrawRegions;
        var i = redrawRegions.length;
        while (i--)
        {
            var region = redrawRegions[i];
            if (region.intersects(rect)) {
                //var intersection = region.intersection(rect);
                //if (intersection.width * intersection.height > rect.width * rect.height / 5) {
                    redrawRegions[i] = region.union(rect);
                    return;
                //}
            }
        }
        
        redrawRegions.push(rect);
    };
    
    this.__focusHandler = function(e)
    {
    };
    
    this.__blurHandler = function(e)
    {
    };
    
    this.__keyDownHandler = function(e)
    {
        clearTimeout(this.__keyPressTimer);
        this.__isKeyDown = true;
        
        if (cs3.core.isOpera) {
            this.__keyPressTimer = setTimeout(function(){ this.__keyPressHandler(e); }, 500);
        }
        
        var keyCode = e.keyCode;
        var charCode = e.charCode;//todo
        var keyLocation = 0;//not supported
        this.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_DOWN, true, false, charCode, keyCode, keyLocation, e.ctrlKey, e.altKey, e.shiftKey));
        
        if (this.__preventTabKey && keyCode === 9) {
            //disable tab focusing
            if (e.preventDefault) { e.preventDefault(); }
            e.returnValue = false;
        }
    };
    
    this.__keyPressHandler = function(e)
    {
        clearTimeout(this.__keyPressTimer);
        if (!this.__isKeyDown) { return; }
        
        this.__keyDownHandler(e);
        
        if (cs3.core.isOpera) {
            this.__keyPressTimer = setTimeout(function(){ this.__keyPressHandler(e); }, 33);
        }
    };
    
    this.__keyUpHandler = function(e)
    {
        this.__isKeyDown = false;
        clearTimeout(this.__keyPressTimer);
        
        var keyCode = e.keyCode;
        var charCode = e.charCode;//todo
        var keyLocation = 0;//not supported
        this.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_UP, true, false, charCode, keyCode, keyLocation, e.ctrlKey, e.altKey, e.shiftKey));
    };
    
    this.__mouseMoveHandler = function(e)
    {
        var canvas = this.canvas;
        var x = e.pageX - canvas.offsetLeft;
        var y = e.pageY - canvas.offsetTop;
        
        /*
        if (this.__scaleX || this.__scaleY) {
            x = Math.round(x / this.__scaleX);
            y = Math.round(y / this.__scaleY);
        }
        */
        
        if (x === this.__mouseX && y === this.__mouseY) {
            return;
        }
        
        // mouse move events
        this.__mouseOverStage = false;
        if (this.__rect.contains(x, y) === true) {
            this.__mouseX = x;
            this.__mouseY = y;
            
            this.__mouseOverStage = true;
            this.__updateObjectUnderMouse();
            
            if (this.__objectUnderMouse) {
                this.__objectUnderMouse.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, true, false));
            }
            else {
                //if there is no abject under the mouse point,
                //stage's mousemove event gets called
                this.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, true, false));
            }
        }
        else if (this.__mouseDownObject) {
            //if the mouse is out of the stage but the mouse is down
            //stage's mousemove event gets called
            this.__mouseX = x;
            this.__mouseY = y;
            this.__objectUnderMouse = null;
            this.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, true, false));
        }
        else {
            //mouse is out of the stage and mouse is not down
            this.__objectUnderMouse = null;
            return;
        }
        
        
        //handle startDrag
        var target = this.__dragTarget;
        if (target) {
            var newX = x - this.__dragOffsetX;
            var newY = y - this.__dragOffsetY;
            var bounds = this.__dragBounds;
            
            if (bounds) {
                if (newX < bounds.x) {
                    newX = bounds.x;
                }
                if (newY < bounds.y) {
                    newY = bounds.y;
                }
                if (newX > bounds.x + bounds.width) {
                    newX = bounds.x + bounds.width;
                }
                if (newY > bounds.y + bounds.height) {
                    newY = bounds.y + bounds.height;
                }
            }
            
            target.__set__x(newX);
            target.__set__y(newY);
        }
    };
    
    this.__mouseDownHandler = function(e)
    {
        //FIXED in opera and chrome we can't capture mousemove events while the contextmenu is open.
        //so without the code bellow if you right click then left click, the mouse position will not be updated.
        this.__mouseMoveHandler(e);
        
        var target = this.__objectUnderMouse;
        if (!target) { return; }
        
        if (e.which === 1) {
            //left click
            //function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
            target.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_DOWN, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
            this.__mouseDownObject = target;
        }
        else if (e.which === 2) {
            //middle click
            return;
        }
        else if (e.which === 3) {
            //right click
            return;
        }
    };
    
    this.__mouseUpHandler = function(e)
    {
        this.__mouseMoveHandler(e);
        var stage = this;
        var target = this.__objectUnderMouse;
        if (!target) {
            if (this.__mouseDownObject) {
                target = stage;
            }
            else {
                return;
            }
        }
        
        if (e.which === 1) {
            //function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
            target.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_UP, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
            if (this.__mouseDownObject === target) {
                target.dispatchEvent(new MouseEvent(MouseEvent.CLICK, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
                
                //double click
                clearTimeout(this.__doubleClickTimer);
                if (this.__mouseClickObject === target) {
                    target.dispatchEvent(new MouseEvent(MouseEvent.DOUBLE_CLICK, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
                    this.__mouseClickObject = null;
                }
                else {
                    this.__mouseClickObject = target;
                    this.__doubleClickTimer = setTimeout(function(){ stage.__mouseClickObject = null; }, 500);
                }
            }
            this.__mouseDownObject = null;
        }
        else if (e.which === 2) {
            //middle click
            return;
        }
        else if (e.which === 3) {
            //right click
            return;
        }
    };
    
    this.__mouseWheelHandler = function(e)
    {
        var target = this.__objectUnderMouse;
        
        var delta = 0;
        if (e.wheelDelta) { /* IE/Opera. */
                delta = e.wheelDelta/120;
                //if (cs3.core.isOpera) { delta = -delta; }
        }
        else if (e.detail) { /** Mozilla case. */
                delta = -e.detail/3;
        }
        
        if (delta) {
            target.dispatchEvent(new MouseEvent(
                MouseEvent.MOUSE_WHEEL, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, delta));
        }
        if (this.__preventMouseWheel) {
            //disable browser scrolling
            if (e.preventDefault) { e.preventDefault(); }
            e.returnValue = false;
        }
    };
    
    this.__getObjectUnderPoint = function(point)
    {
        if (this.__rect.containsPoint(point) === false) { return null; }
        if (this.mouseChildren === false) { return this; }
        
        var context = this.__hiddenContext;
        context.clearRect(point.x, point.y, 1, 1);
        context.save();
        context.beginPath();
        context.rect(point.x, point.y, 1, 1);
        context.clip();
        var result = DisplayObjectContainer.prototype.__getObjectUnderPoint.call(this, context, new Matrix(), point);
        context.restore();
        return result || this;
    };
    
    this.__enterFrame = function()
    {
        //reserve next frame
        var self = this;
        clearTimeout(this.__timer);
        this.__timer = setTimeout(function(){ self.__enterFrame(); }, 1000 / this.__frameRate);
        
        //run user ENTER_FRAME event code
        __applyDown(this, this.dispatchEvent, [new Event(Event.ENTER_FRAME, false, false)]);
        
        this.__updateStage();
    };
    
    /* @override DisplayObject */
    this.__render = function(context)
    {
        this.__renderChildren(context);
    };
    
    /* @override DisplayObjectContainer */
    this.__renderChildren = function(context)
    {
        // render children
        var children = this.__children;
        var render = DisplayObject.prototype.__render;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            
            if (child.__visible === false) { continue; }
            if (child.__maskee !== null) { continue; }
            
            var childMatrix = child.__transform.__matrix;
            var childColor = child.__transform.__colorTransform;
            
            context.globalAlpha = child.__alpha;
            context.setTransform(childMatrix.a, childMatrix.b, childMatrix.c, childMatrix.d, childMatrix.tx, childMatrix.ty);
            
            render.call(child, context, childMatrix, childColor);
        }
    };
    
    this.__updateStage = function()
    {
        if (!this.__initialized) { return; }
        var context = this.__context;
        var stageRect = this.__rect;
        
        // update the display list
        var redrawRegions;
        if (this.__renderMode == 'all') {
            // force to render the entire stage
            redrawRegions = [stageRect];
        }
        else {
            // update modified objects and collect redraw regions
            this.__update(new Matrix(), false);
            redrawRegions = this.__redrawRegions;
            
            if (this.__renderAll || (this.__renderMode == 'auto' && redrawRegions.length > 50)) {
                redrawRegions = [stageRect];
            }
        }
        
        if (redrawRegions.length) {
            // begin rendering
            context.save();
            
            // clear the redraw regions and clip for rendering
            context.beginPath();
            for (i = 0, l = redrawRegions.length; i < l; ++i)
            {
                var rect = redrawRegions[i];
                context.clearRect(rect.x, rect.y, rect.width, rect.height);
                context.rect(rect.x, rect.y, rect.width, rect.height);
            }
            context.clip();
            
            this.__render(context);
            context.restore();
            
            // catch mouse events
            this.__updateObjectUnderMouse();
            
            // debug
            if (this.showRedrawRegions) {
                context.save();
                context.strokeStyle = "#FF0000";
                context.lineWidth = 1;
                context.beginPath();
                for (i = 0, l = redrawRegions.length; i < l; ++i)
                {
                    rect = redrawRegions[i];
                    context.rect(rect.x, rect.y, rect.width, rect.height);
                }
                context.stroke();
                context.restore();
            }
        }
        
        // clean up
        this.__renderAll = false;
        this.__redrawRegions = [];
    };
    
    this.__updateObjectUnderMouse = function()
    {
        //NOTE: do not call these events against the stage.
        //TODO: Add mouse event arguments
        if (this.__mouseOverStage === false) { return; }
        
        var stage = this;
        var last = (this.__objectUnderMouse !== stage) ? this.__objectUnderMouse : null;
        
        this.__objectUnderMouse = this.__getObjectUnderPoint(new Point(this.__mouseX, this.__mouseY));
        var current = (this.__objectUnderMouse !== stage) ? this.__objectUnderMouse : null;
        
        if (current !== last) {
            if (last) {
                //mouse out
                last.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_OUT, true, false));
                
                //roll out
                var rollOutEvent = new MouseEvent(MouseEvent.ROLL_OUT, false, false);
                if (current) {
                    //parents of "current" don't fire event
                    __applyUp(last, function(current, event)
                    {
                        if (this === current) { return; }
                        if (!(this instanceof DisplayObjectContainer) || !this.contains(current)) {
                            this.dispatchEvent(event);
                        }
                    }, [current, rollOutEvent]);
                }
                else {
                    last.dispatchEvent(rollOutEvent);
                }
            }
            if (current) {
                //mouse over
                current.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_OVER, true, false));
                
                //roll over
                var rollOverEvent = new MouseEvent(MouseEvent.ROLL_OVER, false, false);
                if (last) {
                    //parents of "last" don't fire event
                    __applyUp(current, function(last, event)
                    {
                        if (this === last) { return; }
                        if (!(this instanceof DisplayObjectContainer) || !this.contains(last)) {
                            this.dispatchEvent(event);
                        }
                    }, [last, rollOverEvent]);
                }
                else {
                    current.dispatchEvent(rollOverEvent);
                }
            }
        }
        
        //button mode
        //TODO buttonMode should effect children to
        var target = this.__objectUnderMouse;
        if (target && target.buttonMode && target.useHandCursor) {
            this.canvas.style.cursor = 'pointer';
        }
        else {
            this.canvas.style.cursor = 'default';
        }
    };
    
    this.__resize = function()
    {
        var canvas = this.canvas;
        var clientWidth = canvas.clientWidth;
        var clientHeight = canvas.clientHeight;
        
        if (this.__canvasWidth === clientWidth &&
            this.__canvasHeight === clientHeight) {
            return;
        }
        
        this.__canvasWidth = clientWidth;
        this.__canvasHeight = clientHeight;
        
        if (this.__scaleMode === StageScaleMode.NO_SCALE) {
            this.canvas.width = this.__canvasWidth;
            this.canvas.height = this.__canvasHeight;
            this.__hiddenCanvas.width = this.__canvasWidth;
            this.__hiddenCanvas.height = this.__canvasHeight;
            
            //force top left for now
            this.__rect = new Rectangle(0, 0, this.__canvasWidth, this.__canvasHeight);
            this.dispatchEvent(new Event(Event.RESIZE, false, false));
        }
        else if (this.__scaleMode === StageScaleMode.EXACT_FIT) {
            this.canvas.width = this.__stageWidth;
            this.canvas.height = this.__stageHeight;
            this.__hiddenCanvas.width = this.__stageWidth;
            this.__hiddenCanvas.height = this.__stageHeight;
            this.__scaleX = this.__canvasWidth / this.__stageWidth;
            this.__scaleY = this.__canvasHeight / this.__stageHeight;
            
            this.__rect = new Rectangle(0, 0, this.__stageWidth, this.__stageHeight);
        }
        
        //modifying the canvas size resets the context
        //so we have to redraw the entire stage
        this.__renderAll = true;
    };
    
    this.renderAll = function()
    {
        this.__renderAll = true;
    };
    
    this.startDrag = function(target, lockCenter, bounds)
    {
        if (lockCenter) {
            var localPoint = target.globalToLocal(new Point(this.__mouseX, this.__mouseY));
            target.setX(target.getX() + localPoint.x);
            target.setY(target.getY() + localPoint.y);
        }
        this.__dragOffsetX = this.__mouseX - target.getX();
        this.__dragOffsetY = this.__mouseY - target.getY();
        this.__dragTarget = target;
        this.__dragBounds = bounds;
    };
    
    this.stopDrag = function()
    {
        this.__dragOffsetX = 0;
        this.__dragOffsetY = 0;
        this.__dragTarget = null;
        this.__dragBounds = null;
    };
    
    /* getters and setters */
    
    /* @override DisplayObject */
    this.__get__mouseX = function()
    {
        return this.__mouseX;
    };
    
    /* @override DisplayObject */
    this.__get__mouseY = function()
    {
        return this.__mouseY;
    };
    
    this.__get__stageWidth = function()
    {
        return this.__rect.width;
    };
    
    this.__get__stageHeight = function()
    {
        return this.__rect.height;
    };
    
    this.__get__frameRate = function()
    {
        return this.__frameRate;
    };
    
    this.__set__frameRate = function(v)
    {
        this.__frameRate = +v || 1;
    };
    
    this.__get__renderMode = function()
    {
        return this.__renderMode;
    };
    
    this.__set__renderMode = function(v)
    {
        this.__renderMode = v;
        this.__renderAll = true;
    };
    
    this.toString = function()
    {
        return '[object Stage]';
    };
});
var StageAlign = {
    BOTTOM: 'B',
    BOTTOM_LEFT: 'BL',
    BOTTOM_RIGHT: 'BR',
    LEFT: 'L',
    RIGHT: 'R',
    TOP: 'T',
    TOP_LEFT: 'TL',
    TOP_RIGHT: 'TR'
};
var StageScaleMode = {
    EXACT_FIT: 'exactFit',
    NO_BORDER: 'noBorder',
    NO_SCALE: 'noScale',
    SHOW_ALL: 'showAll'
};
var StageRenderMode = {
    ALL: 'all',
    DIRTY: 'dirty',
    AUTO: 'auto'
};
var BitmapFilter = new Class(Object, function()
{
    this.__filter = function(displayObject)
    {
    };
    this.__filterBitmapData = function(sourceBitmapData, sourceRect, distBitmapData, distPoint)
    {
    };
    this.__generateRect = function(sourceRect)
    {
    };
    this.clone = function()
    {
        return new BitmapFilter();
    };
    
    this.toString = function()
    {
        return '[object BitmapFilter]';
    };
});
var ContextFilter = new Class(Object, function()
{
    this.__filter = function(context, target)
    {
    };
    this.__generateRect = function(sourceRect)
    {
    };
    this.clone = function()
    {
        return new ContextFilter();
    };
    
    this.toString = function()
    {
        return '[object ContextFilter]';
    };
});
var BlurFilter = new Class(BitmapFilter, function()
{
    this.__init__ = function(blurX, blurY, quality)
    {
        this.blurX   = blurX   || 4;
        this.blurY   = blurY   || 4;
        this.quality = quality || 1;
    };
    //override
    this.__filter = function(displayObject)
    {
        /*
        var target = (displayObject.__cache) ? displayObject.__cache : displayObject;
        var exWidth = this.blurX * this.quality;
        var exHeight = this.blurY * this.quality;
        var newWidth = target.width + exWidth;
        var newHeight = target.height + exHeight;
        var bitmapData = new BitmapData(newWidth, newHeight, true, 0);
        
        var matrix = new Matrix(1, 0, 0, 1, exWidth/2, exHeight/2);
        bitmapData.draw(target, matrix);
        //this.__applyBitmap(bitmapData);
        
        bitmapData.__rect.offset(-exWidth/2, -exHeight/2);
        displayObject.__cache = bitmapData;
        */
    };
    //override
    this.__filterBitmapData = function(sourceBitmapData, sourceRect, distBitmapData, distPoint)
    {
        var width = sourceRect.width;
        var height = sourceRect.height;
        var srcImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
        var dstImageData = sourceBitmapData.__context.createImageData(sourceRect.width, sourceRect.height);
        
        for (var i = 0; i < this.quality; ++i)
        {
            this.__blur( srcImageData.data, dstImageData.data, width, height, this.blurX / 2 );
            this.__blur( dstImageData.data, srcImageData.data, height, width, this.blurY / 2 );
        }
        
        distBitmapData.__context.putImageData(srcImageData, distPoint.x, distPoint.y);
    };
    //override
    this.__generateRect = function(sourceRect)
    {
        var inflateX = this.blurX * this.quality / 2;
        var inflateY = this.blurY * this.quality / 2;
        var newRect = sourceRect.clone();
        newRect.inflate(inflateX, inflateY);
        return newRect;
    };
    this.__blur = function(src, dst, width, height, radius)
    {
        var length = src.length;
        var widthMinus1 = width - 1;
        var tableSize = 2 * radius + 1;
        var srcIndex = 0;
        var dstIndex;
        var divide = [];
        var clamp = this.__clamp;
        var i, l, p, p2;
        
        for (i = 0, l = 256 * tableSize; i < l; ++i)
        {
            divide[i] = i / tableSize;
        }
        
        for (var y = 0; y < height; ++y)
        {
            dstIndex = y;
            var ta = 0, tr = 0, tg = 0, tb = 0;

            for (i = -radius; i <= radius; ++i)
            {
                p = (srcIndex + clamp(i, 0, widthMinus1)) * 4;
                tr += src[p];
                tg += src[p+1];
                tb += src[p+2];
                ta += src[p+3];
            }

            for (var x = 0; x < width; ++x)
            {
                p = dstIndex * 4;
                //Firefox doesn't accept floats
                dst[p]   = Math.floor(divide[tr]);
                dst[p+1] = Math.floor(divide[tg]);
                dst[p+2] = Math.floor(divide[tb]);
                dst[p+3] = Math.floor(divide[ta]);

                var i1 = x + radius + 1;
                if (i1 > widthMinus1) {
                    i1 = widthMinus1;
                }
                var i2 = x - radius;
                if (i2 < 0) {
                    i2 = 0;
                }
                
                p = (srcIndex + i1) * 4;
                p2 = (srcIndex + i2) * 4;
                
                tr += src[p]   - src[p2];
                tg += src[p+1] - src[p2+1];
                tb += src[p+2] - src[p2+2];
                ta += src[p+3] - src[p2+3];
                
                dstIndex += height;
            }
            srcIndex += width;
        }
    };
    this.__clamp = function(x, a, b)
    {
        return (x < a) ? a : (x > b) ? b : x;
    };
    //override
    this.clone = function()
    {
        return new BlurFilter(this.blurX, this.blurY, this.quality);
    };
    
    this.toString = function()
    {
        return '[object BlurFilter]';
    };
});
var ColorMatrixFilter = new Class(BitmapFilter, function()
{
    this.__init__ = function(matrix)
    {
        this.matrix = matrix;
    };
    //override
    this.__filter = function(displayObject)
    {
    };
    //override
    this.__filterBitmapData = function(sourceBitmapData, sourceRect, distBitmapData, distPoint)
    {
        var width = sourceRect.width;
        var height = sourceRect.height;
        var srcImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
        var dstImageData = sourceBitmapData.__context.createImageData(sourceRect.width, sourceRect.height);
        var sourcePixels = sourceImageData.data;
        var destPixels = destImageData.data;
        var length = sourcePixels.length;
        
        var m = this.matrix;
        
        for (var i = 0; i < length; i += 4)
        {
            var srcR = sourcePixels[i];
            var srcG = sourcePixels[i+1];
            var srcB = sourcePixels[i+2];
            var srcA = sourcePixels[i+3];
            destPixels[i++] = (m[0]  * srcR) + (m[1]  * srcG) + (m[2]  * srcB) + (m[3]  * srcA) + m[4];
            destPixels[i++] = (m[5]  * srcR) + (m[6]  * srcG) + (m[7]  * srcB) + (m[8]  * srcA) + m[9];
            destPixels[i++] = (m[10] * srcR) + (m[11] * srcG) + (m[12] * srcB) + (m[13] * srcA) + m[14];
            destPixels[i++] = (m[15] * srcR) + (m[16] * srcG) + (m[17] * srcB) + (m[18] * srcA) + m[19];
        }
        
        distBitmapData.__context.putImageData(dstImageData, distPoint.x, distPoint.y);
    };
    //override
    this.__generateRect = function(sourceRect)
    {
        return sourceRect.clone();
    };
    //override
    this.clone = function()
    {
        return new ColorMatrixFilter(this.matrix);
    };
});
ColorMatrixFilter.prototype.toString = function()
{
    return '[object ColorMatrixFilter]';
};
var DropShadowFilter = new Class(ContextFilter, function()
{
    this.__init__ = function(distance, angle, color, alpha, blur)
    {
        this.alpha    = alpha    || 1;
        this.blur     = blur     || 4;
        this.color    = color     | 0;
        this.distance = distance || 4;
        this.angle    = angle    || 45;
    };
    //override
    this.__filter = function(context, target)
    {
        var radian = this.angle * 0.017453292519943295;
        context.shadowBlur = this.blur;
        context.shadowColor = __toRGBA(((this.alpha * 255) << 24) + this.color);
        context.shadowOffsetX = this.distance * Math.cos(radian);
        context.shadowOffsetY = this.distance * Math.sin(radian);
    };
    //override
    this.__generateRect = function(sourceRect)
    {
        //TODO figure out how blur effects the size
        var newRect = sourceRect.clone();
        var point = Point.polar(this.distance, this.angle * 0.017453292519943295);
        if (point.x > 0) {
            newRect.width += point.x;
        }
        else if (point.x < 0) {
            newRect.x += point.x;
            newRect.width -= point.x;
        }
        if (point.y > 0) {
            newRect.height += point.y;
        }
        else if (point.y < 0) {
            newRect.y += point.y;
            newRect.height -= point.y;
        }
        return newRect;
    };
    //override
    this.clone = function()
    {
        return new DropShadowFilter(this.distance, this.angle, this.color, this.alpha, this.blur);
    };
    
    this.toString = function()
    {
        return '[object DropShadowFilter]';
    };
});
var ColorTransform = new Class(Object, function()
{
    this.__init__ = function(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset)
    {
        this.redMultiplier   = (redMultiplier   !== undefined) ? redMultiplier   : 1;
        this.greenMultiplier = (greenMultiplier !== undefined) ? greenMultiplier : 1;
        this.blueMultiplier  = (blueMultiplier  !== undefined) ? blueMultiplier  : 1;
        this.alphaMultiplier = (alphaMultiplier !== undefined) ? alphaMultiplier : 1;
        this.redOffset       = (redOffset)   ? redOffset   : 0;
        this.greenOffset     = (greenOffset) ? greenOffset : 0;
        this.blueOffset      = (blueOffset)  ? blueOffset  : 0;
        this.alphaOffset     = (alphaOffset) ? alphaOffset : 0;
    };
    this.clone = function()
    {
        return new ColorTransform(this.redMultiplier, this.greenMultiplier, this.blueMultiplier, this.alphaMultiplier, this.redOffset, this.greenOffset, this.blueOffset, this.alphaOffset);
    };
    this.concat = function(second)
    {
        this.redOffset   += second.redOffset   * this.redMultiplier;
        this.greenOffset += second.greenOffset * this.greenMultiplier;
        this.blueOffset  += second.blueOffset  * this.blueMultiplier;
        this.alphaOffset += second.alphaOffset * this.alphaMultiplier;
        this.redMultiplier   *= second.redMultiplier;
        this.greenMultiplier *= second.greenMultiplier;
        this.blueMultiplier  *= second.blueMultiplier;
        this.alphaMultiplier *= second.alphaMultiplier;
    };
    this.transformColor = function(color)
    {
        var a = (color >> 24 & 0xFF) * this.alphaMultiplier + this.alphaOffset;
        var r = (color >> 16 & 0xFF) * this.redMultiplier + this.redOffset;
        var g = (color >>  8 & 0xFF) * this.greenMultiplier + this.greenOffset;
        var b = (color       & 0xFF) * this.blueMultiplier + this.blueOffset;
        if (a > 255) { a = 255; }
        if (r > 255) { r = 255; }
        if (g > 255) { g = 255; }
        if (b > 255) { b = 255; }
        return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    };
    this.__get__color = function()
    {
        return ((this.alphaOffset << 24) | (this.redOffset << 16) | (this.greenOffset << 8) | this.blueOffset) >>> 0;
    };
    this.__set__color = function(v)
    {
        this.alphaMultiplier = 0;
        this.redMultiplier   = 0;
        this.greenMultiplier = 0;
        this.blueMultiplier  = 0;
        this.alphaOffset = v >> 24 & 0xFF;
        this.redOffset   = v >> 16 & 0xFF;
        this.greenOffset = v >> 8  & 0xFF;
        this.blueOffset  = v & 0xFF;
    };
    
    this.toString = function()
    {
        return '(redMultiplier=' + this.redMultiplier + ', greenMultiplier=' + this.greenMultiplier +
            ', blueMultiplier=' + this.blueMultiplier + ', alphaMultiplier=' + this.alphaMultiplier +
            ', redOffset=' + this.redOffset + ', greenOffset=' + this.greenOffset +
            ', blueOffset=' + this.blueOffset + ', alphaOffset=' + this.alphaOffset + ')';
    };
});
var Matrix = new Class(Object, function()
{
    this.__init__ = function(a, b, c, d, tx, ty)
    {
        this.a  = (a !== undefined) ? a : 1;
        this.b  = (b) ? b : 0;
        this.c  = (c) ? c : 0;
        this.d  = (d !== undefined) ? d : 1;
        this.tx = (tx) ? tx : 0;
        this.ty = (ty) ? ty : 0;
    };
    this.concat = function(m)
    {
        var a1  = this.a;
        var b1  = this.b;
        var c1  = this.c;
        var d1  = this.d;
        var tx1 = this.tx;
        var ty1 = this.ty;
        var a2  = m.a;
        var b2  = m.b;
        var c2  = m.c;
        var d2  = m.d;
        var tx2 = m.tx;
        var ty2 = m.ty;
        
        this.a  = a1  * a2 + b1  * c2;
        this.b  = a1  * b2 + b1  * d2;
        this.c  = c1  * a2 + d1  * c2;
        this.d  = c1  * b2 + d1  * d2;
        this.tx = tx1 * a2 + ty1 * c2 + tx2;
        this.ty = tx1 * b2 + ty1 * d2 + ty2;
    };
    this.clone = function()
    {
        return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
    };
    this.identity = function()
    {
        this.a  = 1;
        this.b  = 0;
        this.c  = 0;
        this.d  = 1;
        this.tx = 0;
        this.ty = 0;
    };
    this.invert = function()
    {
        var a  = this.a;
        var b  = this.b;
        var c  = this.c;
        var d  = this.d;
        var tx = this.tx;
        var ty = this.ty;
        var det  = a * d - b * c;
        
        this.a  =  d / det;
        this.b  = -b / det;
        this.c  = -c / det;
        this.d  =  a / det;
        this.tx =  (c * ty - d * tx) / det;
        this.ty = -(a * ty - b * tx) / det;
    };
    this.rotate = function(angle)
    {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var a  = this.a;
        var b  = this.b;
        var c  = this.c;
        var d  = this.d;
        var tx = this.tx;
        var ty = this.ty;

        this.a  =  a  * cos - b  * sin;
        this.b  =  b  * cos + a  * sin;
        this.c  =  c  * cos - d  * sin;
        this.d  =  d  * cos + c  * sin;
        this.tx =  tx * cos - ty * sin;
        this.ty =  ty * cos + tx * sin;
    };
    this.scale = function(sx, sy)
    {
        this.a  *= sx;
        this.b  *= sy;
        this.c  *= sx;
        this.d  *= sy;
        this.tx *= sx;
        this.ty *= sy;
    };
    this.deltaTransformPoint = function(point)
    {
        var x = point.x;
        var y = point.y;
        return new Point(
            x * this.a + y * this.c,
            x * this.b + y * this.d);
    };
    this.transformPoint = function(point)
    {
        var x = point.x;
        var y = point.y;
        return new Point(
            x * this.a + y * this.c + this.tx,
            x * this.b + y * this.d + this.ty);
    };
    this.transformRect = function(rect)
    {
        var a  = this.a;
        var b  = this.b;
        var c  = this.c;
        var d  = this.d;
        var tx = this.tx;
        var ty = this.ty;
        
        var rx = rect.x;
        var ry = rect.y;
        var rr = rx + rect.width;
        var rb = ry + rect.height;
        
        var nx1 = rx * a + ry * c + tx;
        var ny1 = rx * b + ry * d + ty;
        var nx2 = rr * a + ry * c + tx;
        var ny2 = rr * b + ry * d + ty;
        var nx3 = rr * a + rb * c + tx;
        var ny3 = rr * b + rb * d + ty;
        var nx4 = rx * a + rb * c + tx;
        var ny4 = rx * b + rb * d + ty;
        
        var left = nx1;
        if (left > nx2) { left = nx2; }
        if (left > nx3) { left = nx3; }
        if (left > nx4) { left = nx4; }
        
        var top = ny1;
        if (top > ny2) { top = ny2; }
        if (top > ny3) { top = ny3; }
        if (top > ny4) { top = ny4; }
        
        var right = nx1;
        if (right < nx2) { right = nx2; }
        if (right < nx3) { right = nx3; }
        if (right < nx4) { right = nx4; }
        
        var bottom = ny1;
        if (bottom < ny2) { bottom = ny2; }
        if (bottom < ny3) { bottom = ny3; }
        if (bottom < ny4) { bottom = ny4; }
        
        return new Rectangle(left, top, right - left, bottom - top);
    };
    this.translate = function(dx, dy)
    {
        this.tx += dx;
        this.ty += dy;
    };
    
    this.toString = function()
    {
        return '(a=' + this.a + ', b=' + this.b + ', c=' + this.c + ', d=' + this.d + ', tx=' + this.tx + ', ty=' + this.ty + ')';
    };
});
var MatrixTransformer = new Class(Object, function()
{
    this.toString = function()
    {
        return '[object MatrixTransformer]';
    };
});
MatrixTransformer.getScaleX = function(m)
{
    return Math.sqrt(m.a * m.a + m.b * m.b);
};
MatrixTransformer.setScaleX = function(m, scaleX)
{
    var a = m.a;
    var b = m.b;
    var old = Math.sqrt(a * a + b * b);
    if (old) {
        var ratio = scaleX / old;
        m.a *= ratio;
        m.b *= ratio;
    }
    else {
        var skewY = Math.atan2(b, a);
        m.a = Math.cos(skewY) * scaleX;
        m.b = Math.sin(skewY) * scaleX;
    }
};
MatrixTransformer.getScaleY = function(m)
{
    return Math.sqrt(m.c * m.c + m.d * m.d);
};
MatrixTransformer.setScaleY = function(m, scaleY)
{
    var c = m.c;
    var d = m.d;
    var old = Math.sqrt(c * c + d * d);
    if (old) {
        var ratio = scaleY / old;
        m.c *= ratio;
        m.d *= ratio;
    }
    else {
        var skewX = Math.atan2(-c, d);
        m.c = -Math.sin(skewX) * scaleY;
        m.d =  Math.cos(skewX) * scaleY;
    }
};
MatrixTransformer.getSkewXRadians = function(m)
{
    return Math.atan2(-m.c, m.d);
};
MatrixTransformer.setSkewXRadians = function(m, skewX)
{
    var scaleY = Math.sqrt(m.c * m.c + m.d * m.d);
    m.c = -scaleY * Math.sin(skewX);
    m.d =  scaleY * Math.cos(skewX);
};
MatrixTransformer.getSkewYRadians = function(m)
{
    return Math.atan2(m.b, m.a);
};
MatrixTransformer.setSkewYRadians = function(m, skewY)
{
    var scaleX = Math.sqrt(m.a * m.a + m.b * m.b);
    m.a = scaleX * Math.cos(skewY);
    m.b = scaleX * Math.sin(skewY);
};
MatrixTransformer.getSkewX = function(m)
{
    return Math.atan2(-m.c, m.d) * 57.29577951308232;
};
MatrixTransformer.setSkewX = function(m, skewX)
{
    MatrixTransformer.setSkewXRadians(m, skewX * 0.017453292519943295);
};
MatrixTransformer.getSkewY = function(m)
{
    return Math.atan2(m.b, m.a) * 57.29577951308232;
};
MatrixTransformer.setSkewY = function(m, skewY)
{
    MatrixTransformer.setSkewYRadians(m, skewY * 0.017453292519943295);
};
MatrixTransformer.getRotationRadians = function(m)
{
    return Math.atan2(m.b, m.a);
};
MatrixTransformer.setRotationRadians = function(m, rotation)
{
    var a = m.a;
    var b = m.b;
    var c = m.c;
    var d = m.d;
    var oldRotation = Math.atan2(b, a);
    var oldSkewX = Math.atan2(-c, d);
    var skewX = oldSkewX + rotation - oldRotation;
    var skewY = rotation;
    var scaleY = Math.sqrt(c * c + d * d);
    var scaleX = Math.sqrt(a * a + b * b);
    m.c = -scaleY * Math.sin(skewX);
    m.d =  scaleY * Math.cos(skewX);
    m.a =  scaleX * Math.cos(skewY);
    m.b =  scaleX * Math.sin(skewY);
};
MatrixTransformer.getRotation = function(m)
{
    return Math.atan2(m.b, m.a) * 57.29577951308232;
};
MatrixTransformer.setRotation = function(m, rotation)
{
    MatrixTransformer.setRotationRadians(m, rotation * 0.017453292519943295);
};
MatrixTransformer.rotateAroundInternalPoint = function(m, x, y, angleDegrees)
{
    var point = new Point(x, y);
    point = m.transformPoint(point);
    m.tx -= point.x;
    m.ty -= point.y;
    m.rotate(angleDegrees * 0.017453292519943295);
    m.tx += point.x;
    m.ty += point.y;
};
MatrixTransformer.rotateAroundExternalPoint = function(m, x, y, angleDegrees)
{
    m.tx -= x;
    m.ty -= y;
    m.rotate(angleDegrees * 0.017453292519943295);
    m.tx += x;
    m.ty += y;
};
MatrixTransformer.matchInternalPointWithExternal = function(m, internalPoint, externalPoint)
{
    var point = m.transformPoint(internalPoint);
    m.tx += externalPoint.x - point.x;
    m.ty += externalPoint.y - point.y;
};
var Point = new Class(Object, function()
{
    this.__init__ = function(x, y)
    {
        this.x = (x) ? x : 0;
        this.y = (y) ? y : 0;
    };
    this.add = function(v)
    {
        return new Point(this.x + v.x, this.y + v.y);
    };
    this.clone = function()
    {
        return new Point(this.x, this.y);
    };
    this.equals = function(toCompare)
    {
        return (toCompare.x === this.x && toCompare.y === this.y) ? true : false;
    };
    this.normalize = function(thickness)
    {
        var x = this.x;
        var y = this.y;
        var l = this.length;
        if (l > 0) {
            var f = length / l;
            x *= f;
            y *= f;
        }
        return new Point(x, y);
    };
    this.offset = function(dx, dy)
    {
        return new Point(this.x + dx, this.y + dy);
    };
    this.subtract = function(v)
    {
        return new Point(this.x - v.x, this.y - v.y);
    };
    
    /* getters and setters */
    this.__get__length = function()
    {
        return Math.sqrt(this._x * this._x + this._y * this._y);
    };
    
    this.toString = function()
    {
        return '(x=' + this.x + ', y=' + this.y + ')';
    };
});
Point.distance = function(pt1, pt2)
{
    var dx = pt2.x - pt1.x;
    var dy = pt2.y - pt1.y;
    return Math.sqrt(dx * dx + dy * dy);
};
Point.interpolate = function(pt1, pt2, f)
{
    return new Point(f * pt1.x + (1 - f) * pt2.x, f * pt1.y + (1 - f) * pt2.y);
};
Point.polar = function(len, angle)
{
    return new Point(len * Math.cos(angle), len * Math.sin(angle));
};
var Rectangle = new Class(Object, function()
{
    this.__init__ = function(x, y, width, height)
    {
        this.x = (x) ? x : 0;
        this.y = (y) ? y : 0;
        this.width  = (width)  ? width  : 0;
        this.height = (height) ? height : 0;
    };
    this.clone = function()
    {
        return new Rectangle(this.x, this.y, this.width, this.height);
    };
    this.contains = function(x, y)
    {
        return (
            this.x <= x &&
            this.y <= y &&
            this.x + this.width > x &&
            this.y + this.height > y) ? true : false;
    };
    this.containsPoint = function(point)
    {
        return this.contains(point.x, point.y);
    };
    this.containsRect = function(rect)
    {
        return (
            this.x <= rect.x &&
            this.y <= rect.y &&
            this.x + this.width >= rect.x + rect.width &&
            this.y + this.height >= rect.y + rect.height) ? true : false;
    };
    this.equals = function(toCompare)
    {
        return (
            toCompare.x === this.x &&
            toCompare.y === this.y &&
            toCompare.width === this.width &&
            toCompare.height === this.height) ? true : false;
    };
    this.inflate = function(dx, dy)
    {
        this.x -= dx;
        this.width += 2 * dx;
        this.y -= dy;
        this.height += 2 * dy;
    };
    this.inflatePoint = function(point)
    {
        return this.inflate(point.x, point.y);
    };
    this.intersection = function(toIntersect)
    {
        var x1 = this.x;
        var y1 = this.y;
        var w1 = this.width;
        var h1 = this.height;
        var x2 = toIntersect.x;
        var y2 = toIntersect.y;
        var w2 = toIntersect.width;
        var h2 = toIntersect.height;
        
        if (w1 <= 0 || h1 <= 0 || w2 <= 0 || h2 <= 0) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        var l = (x1 > x2) ? x1 : x2;
        var r = (x1 + w1 < x2 + w2) ? x1 + w1 : x2 + w2;
        
        if (l >= r) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        var t = (y1 > y2) ? y1 : y2;
        var b = (y1 + h1 < y2 + h2) ? y1 + h1 : y2 + h2;
        
        if (t >= b) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        return new Rectangle(l, t, r - l, b - t);
    };
    this.intersects = function(toIntersect)
    {
        var x1 = this.x;
        var y1 = this.y;
        var w1 = this.width;
        var h1 = this.height;
        var x2 = toIntersect.x;
        var y2 = toIntersect.y;
        var w2 = toIntersect.width;
        var h2 = toIntersect.height;
        
        if (w1 <= 0 || h1 <= 0 || w2 <= 0 || h2 <= 0) {
            return false;
        }
        
        return (x1 <= x2 + w2 &&
                x2 <= x1 + w1 &&
                y1 <= y2 + h2 &&
                y2 <= y1 + h1) ? true : false;
    };
    this.isEmpty = function()
    {
        return (this.width <= 0 || this.height <= 0) ? true : false;
    };
    this.offset = function(dx, dy)
    {
        this.x += dx;
        this.y += dy;
    };
    this.offsetPoint = function(point)
    {
        this.x += point.x;
        this.y += point.y;
    };
    this.repair = function()
    {
        if (this.width < 0) {
            this.width = -this.width;
            this.x -= this.width;
        }
        if (this.height < 0) {
            this.height = -this.height;
            this.y -= this.height;
        }
    };
    this.setEmpty = function()
    {
        this.x = this.y = this.width = this.height = 0;
    };
    this.union = function(toUnion)
    {
        var x1 = this.x;
        var y1 = this.y;
        var w1 = this.width;
        var h1 = this.height;
        var x2 = toUnion.x;
        var y2 = toUnion.y;
        var w2 = toUnion.width;
        var h2 = toUnion.height;
        
        if (w1 <= 0 || h1 <= 0) {
            return toUnion.clone();
        }
        
        if (w2 <= 0 || h2 <= 0) {
            return this.clone();
        }
        
        var l = (x1 < x2) ? x1 : x2;
        var r = (x1 + w1 > x2 + w2) ? x1 + w1 : x2 + w2;
        var t = (y1 < y2) ? y1 : y2;
        var b = (y1 + h1 > y2 + h2) ? y1 + h1 : y2 + h2;
        
        return new Rectangle(l, t, r - l, b - t);
    };
    
    /* getters and setters */
    this.__get__top = function()
    {
        return this.y;
    };
    this.__get__right = function()
    {
        return this.x + this.width;
    };
    this.__get__bottom = function()
    {
        return this.y + this.height;
    };
    this.__get__left = function()
    {
        return this.x;
    };
    this.__get__topLeft = function()
    {
        return new Point(this.x, this.y);
    };
    this.__set__topLeft = function(v)
    {
        this.x = v.x;
        this.y = v.y;
    };
    this.__get__bottomRight = function()
    {
        return new Point(this.x + this.width, this.y + this.height);
    };
    this.__set__bottomRight = function(v)
    {
        this.width = v.x - this.x;
        this.height = v.y - this.y;
    };
    this.__get__size = function()
    {
        return new Point(this.width, this.height);
    };
    this.__set__size = function(v)
    {
        this.width = v.x;
        this.height = v.y;
    };
    
    this.toString = function()
    {
        return '(x=' + this.x + ', y=' + this.y + ', w=' + this.width + ', h=' + this.height + ')';
    };
});
var Transform = new Class(Object, function()
{
    var getRotation = MatrixTransformer.getRotation;
    var setRotation = MatrixTransformer.setRotation;
    var getScaleX = MatrixTransformer.getScaleX;
    var setScaleX = MatrixTransformer.setScaleX;
    var getScaleY = MatrixTransformer.getScaleY;
    var setScaleY = MatrixTransformer.setScaleY;
    
    this.__init__ = function()
    {
        this.__target = null;
        this.__colorTransform = new ColorTransform();
        this.__matrix = new Matrix();
        this.__modified = false;
    };
    this.__getX = function()
    {
        return this.__matrix.tx;
    };
    this.__setX = function(v)
    {
        this.__matrix.tx = v;
        this.__modified = true;
    };
    this.__getY = function()
    {
        return this.__matrix.ty;
    };
    this.__setY = function(v)
    {
        this.__matrix.ty = v;
        this.__modified = true;
    };
    this.__getRotation = function(v)
    {
        return getRotation(this.__matrix);
    };
    this.__setRotation = function(v)
    {
        setRotation(this.__matrix, v);
        this.__modified = true;
    };
    this.__getScaleX = function()
    {
        return getScaleX(this.__matrix);
    };
    this.__setScaleX = function(v)
    {
        setScaleX(this.__matrix, v);
        this.__modified = true;
    };
    this.__getScaleY = function()
    {
        return getScaleY(this.__matrix);
    };
    this.__setScaleY = function(v)
    {
        setScaleY(this.__matrix, v);
        this.__modified = true;
    };
    
    /* getters and setters */
    this.__get__concatenatedColorTransform = function()
    {
        var target = this.__target;
        if (target && target.__parent) {
            var concatenated = this.__colorTransform.clone();
            concatenated.concat(target.__parent.__transform.__get__concatenatedColorTransform());
            return concatenated;
        }
        else {
            return this.__colorTransform.clone();
        }
    };
    this.__get__colorTransform = function()
    {
        return this.__colorTransform.clone();
    };
    this.__set__colorTransform = function(v)
    {
        this.__colorTransform = v.clone();
        this.__modified = true;
    };
    this.__get__concatenatedMatrix = function()
    {
        var target = this.__target;
        if (target && target.__parent) {
            var concatenated = this.__matrix.clone();
            concatenated.concat(target.__parent.__transform.__get__concatenatedMatrix());
            return concatenated;
        }
        else {
            return this.__matrix.clone();
        }
    };
    this.__get__matrix = function()
    {
        return this.__matrix.clone();
    };
    this.__set__matrix = function(v)
    {
        this.__matrix = v.clone();
        this.__modified = true;
    };
    this.__get__pixelBounds = function()
    {
        var target = this.__target;
        if (target) {
            return target.__getBounds();
        }
        return new Rectangle();
    };
    
    this.toString = function()
    {
        return '[object Transform]';
    };
});
var Sound = new Class(EventDispatcher, function()
{
    this.__init__ = function(/* source1, source2.. */)
    {
        EventDispatcher.call(this);
        this.__media = null;
        this.__url = null;
        this.__canPlay = false;
        this.__isPlaying = false;
        this.__startTime = 0;
        this.__loops = 0;
        this.__loopCount = 0;
        this.__volume = 1;
        if (arguments.length !== 0) {
            this.load.apply(this, arguments);
        }
    };
    
    this.__onCanPlay = function()
    {
        this.__canPlay = true;
        if (this.__isPlaying) {
            this.__media.currentTime = this.__startTime;
            this.__media.play();
        }
    };
    
    this.__onEnded = function()
    {
        if (this.__loops === -1 || this.__loops > this.__loopCount) {
            this.__loopCount++;
            this.__media.currentTime = this.__startTime;
            this.__media.play();
        }
    };
    
    this.close = function()
    {
        this.__url = null;
        this.__canPlay = false;
        this.__isPlaying = false;
        this.__startTime = 0;
        this.__loops = 0;
        this.__loopCount = 0;
        document.body.removeChild(this.__media);
        cs3.utils.removeAllEventListeners(this.__media);
        this.__media = null;
    };
    
    this.load = function(/* source1, source2.. */)
    {
        if (arguments.length === 0) {
            throw new ArgumentError("load requires at least one url");
        }
        
        var self = this;
        var media = document.createElement('AUDIO');
        media.autoplay = false;
        media.loop = false;
        media.volume = this.__volume;
        
        for (var i = 0, l = arguments.length; i < l; ++i)
        {
            var request = arguments[i];
            if (typeof request == 'string') {
                request = new URLRequest(request);
            }
            var source = document.createElement('SOURCE');
            source.src = request.__url;
            media.appendChild(source);
        }
        
        cs3.utils.addEventListener(media, 'canplay', function(e)
        {
            self.__onCanPlay();
            cs3.utils.removeEventListener(media, 'canplay', arguments.callee);
        });
        cs3.utils.addEventListener(media, 'ended', function(e)
        {
            self.__onEnded();
        });
        
        media.style.display = "none";
        document.body.appendChild(media);
        
        this.__media = media;
        this.__url = media.currentSrc;
    };
    
    this.play = function(startTime, loops)
    {
        if (this.__media === null) {
            throw new ArgumentError("Invalid Sound.");
        }
        
        var self = this;
        var media = this.__media;
        this.__isPlaying = true;
        this.__startTime = Number(startTime) || 0;
        this.__loops = loops | 0;
        this.__loopCount = 0;
        
        if (this.__canPlay) {
            media.currentTime = this.__startTime;
            media.play();
        }
    };
    
    this.pause = function()
    {
        if (this.__media === null) {
            throw new ArgumentError("Invalid Sound.");
        }
        this.__media.pause();
        this.__isPlaying = false;
    };
    
    /* getters and setters */
    this.__get__length = function()
    {
        if (this.__media) {
            return this.__media.duration;
        }
        return 0;
    };
    
    this.__get__position = function()
    {
        if (this.__media) {
            return this.__media.currentTime;
        }
        return 0;
    };
    
    this.__get__url = function()
    {
        return this.__url;
    };
    
    this.__get__volume = function()
    {
        return this.__volume;
    };
    
    this.__set__volume = function(v)
    {
        this.__volume = v;
        if (this.__media) {
            this.__media.volume = v;
        }
    };
    
    this.toString = function()
    {
        return '[object Sound]';
    };
});
var Video = new Class(DisplayObject, function()
{
    this.__init__ = function()
    {
        DisplayObject.call(this);
        this.__media = null;
        this.__url = null;
        this.__canPlay = false;
        this.__isPlaying = false;
        this.__startTime = 0;
        this.__loops = 0;
        this.__loopCount = 0;
        this.__volume = 1;
        if (arguments.length !== 0) {
            this.load.apply(this, arguments);
        }
    };
    
    //override
    this.__getContentBounds = function()
    {
        //TODO
        if (this.__media) {
            return new Rectangle(0, 0, this.__media.videoWidth, this.__media.videoHeight);
        }
        return new Rectangle();
    };
    
    //override
    this.__getModified = function()
    {
        //return this.__modified;
        if (this.__media && this.__media.paused === false) {
            return true;
        }
        return this.__transform.__modified || this.__modified;
    };
    
    //override
    this.__setModified = function(v)
    {
        this.__transform.__modified = this.__modified = v;
    };
    
    //override
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__media) {
            context.drawImage(this.__media, 0, 0);
        }
    };
    
    //override
    this.__hitTestPoint = function(context, matrix, point)
    {
        if (this.__media) {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (bounds.containsPoint(localPoint)) {
                return true;
            }
        }
        return false;
    };
    
    this.__onCanPlay = function()
    {
        this.__canPlay = true;
        if (this.__isPlaying) {
            this.__media.currentTime = this.__startTime;
            this.__media.play();
        }
    };
    
    this.__onEnded = function()
    {
        if (this.__loops === -1 || this.__loops > this.__loopCount) {
            this.__loopCount++;
            this.__media.currentTime = this.__startTime;
            this.__media.play();
        }
    };
    
    this.close = function()
    {
        this.__url = null;
        this.__canPlay = false;
        this.__isPlaying = false;
        this.__startTime = 0;
        this.__loops = 0;
        this.__loopCount = 0;
        document.body.removeChild(this.__media);
        cs3.utils.removeAllEventListeners(this.__media);
        this.__media = null;
    };
    
    this.load = function(/* source1, source2.. */)
    {
        if (arguments.length === 0) {
            throw new ArgumentError("load requires at least one url");
        }
        
        var self = this;
        var media = document.createElement('VIDEO');
        media.autoplay = false;
        media.loop = false;
        media.volume = this.__volume;
        
        for (var i = 0, l = arguments.length; i < l; ++i)
        {
            var request = arguments[i];
            if (typeof request == 'string') {
                request = new URLRequest(request);
            }
            var source = document.createElement('SOURCE');
            source.src = request.__url;
            media.appendChild(source);
        }
        
        cs3.utils.addEventListener(media, 'canplay', function(e)
        {
            self.__onCanPlay();
            cs3.utils.removeEventListener(media, 'canplay', arguments.callee);
        });
        cs3.utils.addEventListener(media, 'ended', function(e)
        {
            self.__onEnded();
        });
        
        media.style.display = "none";
        document.body.appendChild(media);
        
        this.__media = media;
        this.__url = media.currentSrc;
    };
    
    this.play = function(startTime, loops)
    {
        if (this.__media === null) {
            throw new ArgumentError("Invalid Video.");
        }
        
        var self = this;
        var media = this.__media;
        this.__isPlaying = true;
        this.__startTime = Number(startTime) || 0;
        this.__loops = loops | 0;
        this.__loopCount = 0;
        
        if (this.__canPlay) {
            media.currentTime = this.__startTime;
            media.play();
        }
    };
    
    this.pause = function()
    {
        if (this.__media === null) {
            throw new ArgumentError("Invalid Video.");
        }
        this.__media.pause();
        this.__isPlaying = false;
    };
    
    /* getters and setters */
    this.__get__length = function()
    {
        if (this.__media) {
            return this.__media.duration;
        }
        return 0;
    };
    
    this.__get__position = function()
    {
        if (this.__media) {
            return this.__media.currentTime;
        }
        return 0;
    };
    
    this.__get__url = function()
    {
        return this.__url;
    };
    
    this.__get__volume = function()
    {
        return this.__volume;
    };
    
    this.__set__volume = function(v)
    {
        this.__volume = v;
        if (this.__media) {
            this.__media.volume = v;
        }
    };
    
    this.toString = function()
    {
        return '[object Video]';
    };
});
var URLLoader = new Class(EventDispatcher, function()
{
    this.__init__ = function()
    {
        EventDispatcher.call(this);
        this.__request = null;
        this.bytesLoaded = 0;
        this.bytesTotal = 0;
        this.data = null;
        this.dataFormat = URLLoaderDataFormat.TEXT;
    };
    this.close = function()
    {
        this.__request.abort();
    };
    this.load = function(request)
    {
        var self = this;
        var hasStatus = false;
        this.__request = new cs3.utils.createXMLHttpRequest();
        
        if (typeof request == 'string') {
            request = new URLRequest(request);
        }
        
        if (this.dataFormat == URLLoaderDataFormat.BINARY) {
            throw new Error("URLLoaderDataFormat.BINARY is not supported");
        }
        
        this.__request.open(request.__method, request.__url, true);
        this.__request.onreadystatechange = function() {
            if (!hasStatus) {
                try {
                    self.dispatchEvent(new HTTPStatusEvent(HTTPStatusEvent.HTTP_STATUS, false, false, this.status));
                    hasStatus = true;
                } catch (e) {}
            }
            if (this.readyState == 1) {
                self.dispatchEvent(new Event(Event.OPEN, false, false));
            }
            //else if (this.readyState == 2) {
            //}
            else if (this.readyState == 3) {
                var loaded = this.responseText.length;
                var total = this.getResponseHeader('Content-Length') || loaded + 1;
                self.dispatchEvent(new ProgressEvent(ProgressEvent.PROGRESS, false, false, loaded, total));
            }
            else if (this.readyState == 4) {
                if (this.status == 200) {
                    if (self.dataFormat === URLLoaderDataFormat.VARIABLES) {
                        self.data = new URLVariables(this.responseText);
                    }
                    else if (self.dataFormat == URLLoaderDataFormat.XML) {
                        self.data = this.responseXML;
                        if (self.data === null) {
                            throw new TypeError("Could not parse the XML file.");
                        }
                    }
                    else if (self.dataFormat == URLLoaderDataFormat.JSON) {
                        self.data = eval('(' + this.responseText + ')');
                    }
                    else {
                        self.data = this.responseText;
                    }
                    self.dispatchEvent(new Event(Event.COMPLETE, false, false));
                }
                else {
                    self.dispatchEvent(new IOErrorEvent(IOErrorEvent.IO_ERROR, false, false, this.statusText));
                }
                
                this.onreadystatechange = null;
            }
        };
        this.__request.send(null);
    };
    
    this.toString = function()
    {
        return '[object URLLoader]';
    };
});
var URLLoaderDataFormat = {
    BINARY: 'binary',
    TEXT: 'text',
    XML: 'xml',
    JSON: 'json',
    VARIABLES: 'variables'
};
var URLRequest = new Class(Object, function()
{
    this.__init__ = function(url)
    {
        this.__contentType = null;
        this.__data = null;
        this.__method = URLRequestMethod.GET;
        this.__requestHeaders = [];
        this.__url = (url !== undefined) ? url : null;
    };
    
    /* getters and setters */
    this.__get__contentType = function()
    {
        return this.__contentType;
    };
    this.__set__contentType = function(v)
    {
        this.__contentType = v;
    };
    this.__get__data = function()
    {
        return this.__data;
    };
    this.__set__data = function(v)
    {
        this.__data = v;
    };
    this.__get__method = function()
    {
        return this.__method;
    };
    this.__set__method = function(v)
    {
        this.__method = v;
    };
    this.__get__requestHeaders = function()
    {
        return this.__requestHeaders.slice(0);
    };
    this.__set__requestHeaders = function(v)
    {
        this.__requestHeaders = v.slice(0);
    };
    this.__get__url = function()
    {
        return this.__url;
    };
    this.__set__url = function(v)
    {
        this.__url = v;
    };
    
    this.toString = function()
    {
        return '[object URLRequest]';
    };
});
var URLRequestMethod = {
   GET: 'GET',
   POST: 'POST'
};
var URLVariables = new Class(Object, function()
{
    this.__init__ = function(src)
    {
        this.decode(src);
    };
    this.decode = function(src)
    {
        if (!src) { return; }
        var pairs = src.split('&');
        for (var i = 0, l = pairs.length; i < l; ++i)
        {
            var s = pairs[i];
            if (s.indexOf('=') === -1) {
                throw new Error('The String passed to URLVariables.decode () must be a URL-encoded query strings.');
            }
            
            var p = s.split('=', 2);
            
            if (this.hasOwnProperty(p[0])) {
                throw new ReferenceError('Cannot assign to a method ' + p[0] + ' on URLVariables');
            }
            
            this[p[0]] = decodeURIComponent(p[1]);
        }
    };
    
    this.toString = function()
    {
        var pairs = [];
        for (var p in this)
        {
            if (p != 'constructor' && p != 'decode' && p != 'toString') {
                pairs.push(p + '=' + encodeURIComponent(this[p]));
            }
        }
        return pairs.join('&');
    };
});
var TextField;
(function()
{
    TextField = new Class(InteractiveObject, function()
    {
        //context used for measureing text width
        var textCanvas = cs3.utils.createCanvas(0, 0);
        var textContext = cs3.utils.getContext2d(textCanvas);
        
        var formatToFont = function(format)
        {
            var font = (format.italic) ? "italic " : "";
            font += (format.bold) ? "bold " : "";
            font += format.size + "px '" + format.font + "'";
            return font;
        };
        
        this.__init__ = function()
        {
            InteractiveObject.call(this);
            this.__buffer = [];
            this.__lines = [];
            this.__formats = [];
            this.__textWidth = 0;
            this.__textHeight = 0;
            this.__defaultTextFormat = new TextFormat();
            
            this.__autoSize = true;//allways true for now
            
            this.background = false;
            this.backgroundColor = 0xFFFFFF;
            this.border = false;
            this.borderColor = 0;
        };
        //override
        this.__getContentBounds = function()
        {
            if (this.border) {
                //border changes the rect size
                return new Rectangle(0, 0, this.__textWidth + 2, this.__textHeight + 2);
            }
            return new Rectangle(0, 0, this.__textWidth, this.__textHeight);
        };
        //override
        this.__getModified = function()
        {
            return this.__modified || this.__transform.__modified;
        };
        //override
        this.__setModified = function(v)
        {
            this.__modified = v;
            this.__transform.__modified = v;
        };
        
        
        
        
        
        this.__getBlocks = function()
        {
            //TODO: add word wrap
            var buffer = this.__buffer;
            var blocks = [];
            var cursor = 0;
            var index;
            var block;
            
            while (1)
            {
                index = buffer.indexOf("\n");
                if (index !== -1) {
                    blocks.push(buffer.slice(cursor, index));
                    cursor = index + 1;
                }
                else {
                    blocks.push(buffer.slice(cursor));
                    break;
                }
            }
            
            return blocks;
        };

        
        
        //override
        this.__render = function(context, matrix, colorTransform)
        {
            var bounds = this.__getContentBounds();
            var buffer = this.__buffer;
            var lines  = this.__lines;
            var defaultFormat = this.__defaultTextFormat;
            var lineHeight = defaultFormat.size + defaultFormat.leading;
            var lineWidth = this.__textWidth;
            
            //add 1px margin on each side
            var offsetX = 1;
            var offsetY = 1;
            if (this.border) {
                var borderColor = (colorTransform) ?
                        colorTransform.transformColor(this.borderColor) :
                        this.borderColor;
                
                //shift the margin 1px more
                offsetX = 2;
                offsetY = 2;
                
                //border changes the rect size
                context.fillStyle = __toRGB(borderColor);
                context.beginPath();
                context.rect(0, 0, bounds.width, bounds.height);
                context.stroke();
                
                context.beginPath();
                context.rect(1, 1, bounds.width - 2, bounds.height - 2);
            }
            else {
                context.beginPath();
                context.rect(0, 0, bounds.width, bounds.height);
            }
            
            if (this.background) {
                var backgroundColor = (colorTransform) ?
                        colorTransform.transformColor(this.backgroundColor) :
                        this.backgroundColor;
                context.fillStyle = __toRGB(backgroundColor);
                context.fill();
            }
            
            context.save();
            context.clip();
            context.beginPath();
            
            var align = defaultFormat.align;
            if (align == TextFormatAlign.RIGHT) {
                context.textAlign = 'right';
                //with no border offsetX = lineWidth - 1 to add a 1px right margin
                //with border it gets shifted 1px to the right and offsetX = lineWidth - 1 + 1
                offsetX = lineWidth - 2 + offsetX;
            }
            else if (align == TextFormatAlign.CENTER) {
                context.textAlign = 'center';
                //with no border offsetX = lineWidth / 2
                //with border offsetX = lineWidth / 2 + 1
                offsetX = lineWidth / 2 - 1 + offsetX;
            }
            else {
                //case LEFT or JUSTIFY
                context.textAlign = 'left';
            }
            
            context.textBaseline = 'top';
            
            if (align == TextFormatAlign.JUSTIFY) {
                //TODO
                return;
            }
            else {
                for (i = 0, l = lines.length; i < l; ++i)
                {
                    var line = lines[i];
                    var blocks = line.blocks;
                    for (var ii = 0, ll = blocks.length; ii < ll; ++ii)
                    {
                        var block = blocks[ii];
                        var str = buffer.slice(block.start, block.end + 1).join("");
                        var format = block.format;
                        context.font = formatToFont(format);
                        context.fillStyle = (colorTransform) ?
                                __toRGB(colorTransform.transformColor(format.color)) :
                                __toRGB(format.color);
                        context.fillText(str, offsetX + block.x, offsetY + block.y + (line.height - block.height));
                    }
                }
            }
            
            context.restore();
        };
        //override
        this.__hitTestPoint = function(context, matrix, point)
        {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (bounds.containsPoint(localPoint)) {
                return true;
            }
            
            return false;
        };
        
        
        this.__setTextFormat = function(format, beginIndex, endIndex)
        {
            var formats = this.__formats;
            for (var i = beginIndex; i < endIndex; ++i)
            {
                formats[i] = format;
            }
        };
        /**
         * update the visual lines and blocks.
         * TODO: add word wrap
         */
        this.__updateBlocks = function()
        {
            var context = textContext;
            var buffer = this.__buffer;
            var defaultFormat = this.__defaultTextFormat;
            var formats = this.__formats;
            var lines = [];
            
            //calculate the width and height of each line(block)
            var temp = [];
            var format = defaultFormat;
            var width = 0;
            var height = 0;
            
            //start the first line
            var line = new Line(0, 0, 0, 0, 0, format.size);
            //start the first block
            var block = new Block(format, 0, 0, 0, 0, 0, format.size);
            context.font = formatToFont(format);
            
            for (var i = 0, l = buffer.length; i < l; ++i)
            {
                var chr = buffer[i];
                
                if (formats[i] !== format) {
                    //textFormat has changed
                    if (temp.length) {
                        //update the block width
                        block.width = context.measureText(temp.join("")).width;
                        //update the line width
                        line.width += block.width;
                    }
                    
                    //close the block
                    block.end = i - 1;
                    line.blocks.push(block);
                    
                    //start the new format
                    format = formats[i];
                    context.font = formatToFont(format);
                    
                    //start a new block
                    block = new Block(format, i, 0, line.width, line.y, 0, format.size);
                    
                    //update the line height
                    line.height = Math.max(line.height, block.height);
                    
                    temp = [];
                }
                
                if (chr === "\n" || i == (l - 1)) {
                    //EOL or EOF
                    if (temp.length) {
                        //update the block width
                        block.width = context.measureText(temp.join("")).width;
                        //update the line width
                        line.width += block.width;
                    }
                    
                    //close the block
                    block.end = i - 1;
                    line.blocks.push(block);
                    
                    //close the line
                    line.end = i;
                    lines.push(line);
                    
                    //update the total width and height
                    width  = (line.width > width) ? line.width : width;
                    height = line.y + line.height;
                    
                    //start a new line
                    line = new Line(i + 1, 0, 0, height + format.leading, 0, format.size);
                    
                    //start a new block
                    block = new Block(format, i + 1, 0, 0, line.y, 0, format.size);
                    
                    temp = [];
                }
                else {
                    temp.push(chr);
                }
            }
            
            this.__lines  = lines;
            this.__textWidth = width + 2;//add 1px margin on each side
            this.__textHeight = height + 2;
            this.__modified = true;
        };
        
        this.appendText = function(newText)
        {
            var buffer = this.__buffer;
            this.replaceText(buffer.length, buffer.length, newText);
        };
        this.replaceText = function(beginIndex, endIndex, newText)
        {
            newText = newText.replace(/\r\n/gim, "\n");
            newText = newText.replace(/\r/gim, "\n");
            
            var buffer = this.__buffer;
            Array.prototype.splice.apply(buffer, [beginIndex, endIndex - beginIndex].concat(newText.split("")));
            
            this.__setTextFormat(this.__defaultTextFormat, beginIndex, beginIndex + newText.length);
            this.__updateBlocks();
        };
        this.setTextFormat = function(format, beginIndex, endIndex)
        {
            this.__setTextFormat(format, beginIndex, endIndex);
            this.__updateBlocks();
        };
        
        /* getters and setters */
        this.__get__length = function()
        {
            return this.__buffer.length;
        };
        this.__get__numLines = function()
        {
            return this.__lines.length;
        };
        this.__get__text = function()
        {
            return this.__buffer.join("");
        };
        this.__set__text = function(v)
        {
            this.__buffer = [];
            this.__formats = [];
            this.appendText(v);
        };
        this.__get__defaultTextFormat = function()
        {
            //TODO clone it
            return this.__defaultTextFormat;
        };
        this.__set__defaultTextFormat = function(v)
        {
            this.__defaultTextFormat = v;
            this.__updateBlocks();
        };
        
        this.toString = function()
        {
            return '[object TextField]';
        };
    });
    
    var Line = new Class(Object, function()
    {
        this.__init__ = function(start, end, x, y, width, height)
        {
            this.start = start;
            this.end = end;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
            this.blocks = [];
        };
    });
    
    var Block = new Class(Object, function()
    {
        this.__init__ = function(format, start, end, x, y, width, height)
        {
            this.format = format;
            this.start = start;
            this.end = end;
            this.x = x;
            this.y = y;
            this.width = width;
            this.height = height;
        };
    });
})();
var TextFormat = new Class(Object, function()
{
    this.__init__ = function(font, size, color, bold, italic, underline, url, target, align, leftMargin, rightMargin, indent, leading)
    {
        this.align = (align) ? align : TextFormatAlign.LEFT;
        this.blockIndent = 0;
        this.bold = (bold) ? true : false;
        this.bullet = false;
        this.color = color | 0;
        this.font = (font) ? font : "Times New Roman";//TODO MacOS should be 'Times'
        this.indent = (indent) ? indent : 0;
        this.italic = (italic) ? true : false;
        this.kerning = false;
        this.leading = (leading) ? leading : 0;
        this.leftMargin = (leftMargin) ? leftMargin : 0;
        this.rightMargin = (rightMargin) ? rightMargin : 0;
        this.size = (size) ? size : 12;
        this.tabStops = [];
        this.target = (target) ? target : "";
        this.underline = (underline) ? true : false;
        this.url = (url) ? url : "";
    };
    
    this.toString = function()
    {
        return '[object TextFormat]';
    };
});
var TextFormatAlign = {
    CENTER: 'center',
    JUSTIFY: 'justify',
    LEFT: 'left',
    RIGHT: 'right'
};
var Tween;
(function(){

var DH  = 1 / 22;
var D1  = 1 / 11;
var D2  = 2 / 11;
var D3  = 3 / 11;
var D4  = 4 / 11;
var D5  = 5 / 11;
var D7  = 7 / 11;
var IH  = 1 / DH;
var I1  = 1 / D1;
var I2  = 1 / D2;
var I4D = 1 / D4 / D4;

Tween = new Class(EventDispatcher, function()
{
    this.__init__ = function(obj, prop, func, begin, finish, duration, useSeconds)
    {
        EventDispatcher.call(this);
        this.__duration = duration;
        this.__range = finish - begin;
        this.__FPS = undefined;
        this.__position = 0;
        this.__startTime = 0;
        this.__time = 0;
        this.__timer = null;
        this.begin = begin;
        this.func = func;
        this.isPlaying = false;
        this.looping = false;
        this.obj = obj;
        this.prop = prop;
        this.useSeconds = (useSeconds) ? true : false;
        
        this.start();
    };
    this.__start = function()
    {
        this.__stop();
        
        var frameRate;
        if (this.__FPS) {
            //use user specified FPS
            frameRate = this.__FPS;
        }
        else if (this.obj.__stage) {
            //use the objects stage.frameRate
            frameRate = this.obj.__stage.__frameRate;
        }
        else if (cs3.core.stages.length) {
            //use the last created stage.frameRate
            frameRate = cs3.core.stages[cs3.core.stages.length-1].__frameRate;
        }
        else {
            //use the system's default frameRate
            frameRate = cs3.config.DEFAULT_FRAMERATE;
        }
        
        this.__timer = setInterval(cs3.utils.closure(this, this.__enterFrame), 1000 / frameRate);
        this.isPlaying = true;
    };
    this.__stop = function()
    {
        clearInterval(this.__timer);
        this.isPlaying = false;
    };
    this.__dispatchEvent = function(type)
    {
        this.dispatchEvent(new TweenEvent(type, this.__time, this.__position));
    };
    this.__enterFrame = function()
    {
        this.nextFrame();
    };
    this.__restart = function()
    {
        this.__startTime = (new Date()).getTime();
    };
    this.__update = function()
    {
        var durationRatio = this.__time / this.__duration;
        var positionRatio = this.func(durationRatio);
        var newPosition   = this.begin + this.__range * positionRatio;
        this.__set__position(newPosition);
    };
    this.continueTo = function(finish, duration)
    {
        this.begin = this.__position;
        this.__range = finish - this.begin;
        if (duration !== undefined) {
            this.__duration = duration;
        }
        this.start();
    };
    this.fforward = function()
    {
        this.__set__time(this.__duration);
        this.__restart();
    };
    this.nextFrame = function()
    {
        if (this.useSeconds) {
            //update the time
            var elapseTime = (new Date()).getTime() - this.__startTime;
            this.__set__time(elapseTime / 1000);
        }
        else {
            //increase the frame
            this.__set__time(this.__time + 1);
        }
    };
    this.prevFrame = function()
    {
        if (this.useSeconds === false) {
            //decrease the frame
            this.__set__time(this.__time - 1);
        }
    };
    this.resume = function()
    {
        this.__restart();
        this.__start();
        this.__dispatchEvent(TweenEvent.MOTION_RESUME);
    };
    this.rewind = function(t)
    {
        //set the time
        this.__time = t | 0;
        this.__restart();
        this.__update();
    };
    this.start = function()
    {
        this.rewind(0);
        this.__start();
        this.__dispatchEvent(TweenEvent.MOTION_START);
    };
    this.stop = function()
    {
        this.__stop();
        this.__dispatchEvent(TweenEvent.MOTION_STOP);
    };
    this.yoyo = function()
    {
        this.continueTo(this.begin, this.__time);
    };
    
    /* getters and setters */
    this.__get__duration = function()
    {
        return this.__duration;
    };
    this.__set__duration = function(v)
    {
        this.__duration = v;
    };
    this.__get__finish = function()
    {
        return this.begin + this.__range;
    };
    this.__set__finish = function(v)
    {
        this.__range = v - this.begin;
    };
    this.__get__FPS = function()
    {
        return this.__FPS;
    };
    this.__set__FPS = function(v)
    {
        var isPlaying = this.isPlaying;
        this.__stop();
        this.__FPS = v;
        if (isPlaying) {
            //resume with the new FPS
            this.__start();
        }
    };
    this.__get__position = function()
    {
        return this.__position;
    };
    this.__set__position = function(v)
    {
        this.__position = v;
        this.obj[this.prop] = this.__position;
        this.__dispatchEvent(TweenEvent.MOTION_CHANGE);
    };
    this.__get__time = function()
    {
        return this.__time;
    };
    this.__set__time = function(v)
    {
        if (v > this.__duration)
        {
            if (this.looping) {
                this.rewind(v - this.__duration);
                this.__update();
                this.__dispatchEvent(TweenEvent.MOTION_LOOP);
            }
            else {
                if (this.useSeconds) {
                    this.__time = this.__duration;
                    this.__update();
                }
                this.stop();
                this.__dispatchEvent(TweenEvent.MOTION_FINISH);
            }
        }
        else if (v < 0) {
            this.rewind(0);
            this.__update();
        }
        else {
            this.__time = v;
            this.__update();
        }
    };
    
    this.toString = function()
    {
        return '[object Tween]';
    };
});
Tween.Back = {
    easeIn: function(t) {
        return 3 * t * t * t - 2 * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Back.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Back.easeIn(t * 2.0) * 0.5 : 1 - Tween.Back.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Bounce = {
    easeIn: function(t) {
        var s;
        if (t < D1) {
            s = t - DH;
            s = DH - s * s * IH;
        }
        else if (t < D3) {
            s = t - D2;
            s = D1 - s * s * I1;
        }
        else if (t < D7) {
            s = t - D5;
            s = D2 - s * s * I2;
        }
        else {
            s = t - 1;
            s = 1 - s * s * I4D;
        }
        return s;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Bounce.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Bounce.easeIn(t * 2.0) * 0.5 : 1 - Tween.Bounce.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Circ = {
    easeIn: function(t) {
        return 1.0 - Math.sqrt(1.0 - t * t);
    },
    easeOut: function(t) {
        return 1.0 - Tween.Circ.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Circ.easeIn(t * 2.0) * 0.5 : 1 - Tween.Circ.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Cubic = {
    easeIn: function(t) {
        return t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Cubic.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Cubic.easeIn(t * 2.0) * 0.5 : 1 - Tween.Cubic.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Elastic = {
    easeIn: function(t) {
        return 1.0 - Tween.Elastic.easeOut(1.0 - t);
    },
    easeOut: function(t) {
        var s = 1 - t;
        return 1 - Math.pow(s, 8) + Math.sin(t * t * 6 * Math.PI) * s * s;
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Elastic.easeIn(t * 2.0) * 0.5 : 1 - Tween.Elastic.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Linear = {
    easeIn: function(t) {
        return t;
    },
    easeOut: function(t) {
        return t;
    },
    easeInOut: function(t) {
        return t;
    }
};
Tween.Quad = {
    easeIn: function(t) {
        return t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Quad.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Quad.easeIn(t * 2.0) * 0.5 : 1 - Tween.Quad.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Quart = {
    easeIn: function(t) {
        return t * t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Quart.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Quart.easeIn(t * 2.0) * 0.5 : 1 - Tween.Quart.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Quint = {
    easeIn: function(t) {
        return t * t * t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Quint.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Quint.easeIn(t * 2.0) * 0.5 : 1 - Tween.Quint.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Sine = {
    easeIn: function(t) {
        return 1.0 - Math.cos(t * (Math.PI / 2));
    },
    easeOut: function(t) {
        return 1.0 - Tween.Sine.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Sine.easeIn(t * 2.0) * 0.5 : 1 - Tween.Sine.easeIn(2.0 - t * 2.0) * 0.5;
    }
};

})();
var Endian = {
    BIG_ENDIAN: 'bigEndian',
    LITTLE_ENDIAN: 'littleEndian'
};
var ByteArray = new Class(Array, function()
{
    var float_pbias = Math.pow(2, 126);
    var float_psgnd = Math.pow(2, 23);
    var FLOAT_POSITIVE_INFINITY = (2 - Math.pow(2, -23)) * Math.pow(2, 127);
    var FLOAT_NEGATIVE_INFINITY = -FLOAT_POSITIVE_INFINITY;
    var double_pbias = Math.pow(2, 1022);
    var double_psgnd = Math.pow(2, 52);
    var DOUBLE_POSITIVE_INFINITY = Number.POSITIVE_INFINITY;
    var DOUBLE_NEGATIVE_INFINITY = Number.NEGATIVE_INFINITY;
    
    function floatToBytes(n)
    {
        if (isNaN(n)) {
            return [0xff, 0xff, 0xff, 0xff];
        }
        if (n >= FLOAT_POSITIVE_INFINITY) {
            return [0x7f, 0x80, 0x00, 0x00];
        }
        if (n <= FLOAT_NEGATIVE_INFINITY) {
            return [0xff, 0x80, 0x00, 0x00];
        }
        if (Math.abs(n) === 0) {
            return [0x00, 0x00, 0x00, 0x00];
        }
        
        var s = n < 0 ? 0x80 : 0;
        var t = Math.log(Math.abs(n)) / Math.LN2;
        var p = Math.floor(t);
        var e, m;

        if (p < -126) {
            e = 0;
            m = float_psgnd * n * float_pbias;
        }
        else {
            e = p + 127;
            m = float_psgnd * (Math.pow(2, t - p) - 1);
        }

        var result = [];
        for (var i = 0; i < 3; i++)
        {
            var x = Math.floor(m / 0x100);
            result.push(m - x * 0x100);
            m = x;
        }

        result[0] = Math.round(result[0]);
        result[result.length - 1] += (e & 0x01) << (8 - 1);
        result.push((e >> 1) + s);
        return result.reverse();
    }
    
    function doubleToBytes(n)
    {
        if (isNaN(n)) {
            return [0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff];
        }
        if (n >= DOUBLE_POSITIVE_INFINITY) {
            return [0x7f, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        }
        if (n <= DOUBLE_NEGATIVE_INFINITY) {
            return [0xff, 0xf0, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        }
        if (Math.abs(n) === 0) {
            return [0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00];
        }
        
        var s = n < 0 ? 0x80 : 0;
        var t = Math.log(Math.abs(n)) / Math.LN2;
        var p = Math.floor(t);
        var e, m;

        if (p < -1022) {
            e = 0;
            m = double_psgnd * n * double_pbias;
        }
        else {
            e = p + 1023;
            m = double_psgnd * (Math.pow(2, t - p) - 1);
        }

        var result = [];
        for (var i = 0; i < 7; i++)
        {
            var x = Math.floor(m / 0x100);
            result.push(m - x * 0x100);
            m = x;
        }

        result[0] = Math.round(result[0]);
        result[result.length - 1] += (e & 0x0f) << (8 - 4);
        result.push((e >> 4) + s);
        return result.reverse();
    }
    
    function bytesToNumber(bytes, bias, pbias, psgnd)
    {
        var n = bytes.length;
        var s = bytes[0] & 0x80;
        var e, m;
        if (n == 4) {
            e = ((bytes[0] & 0x7f) << 1) + (bytes[1] >> 7);
            m = bytes[1] & 0x7f;
        }
        else {
            e = ((bytes[0] & 0x7f) << 4) + (bytes[1] >> 4);
            m = bytes[1] & 0x0f;
        }

        for (var i = 2; i < n; i++)
        {
            m = m * 0x100 + bytes[i];
        }

        if (e == bias * 2 + 1) {
            if (m) { return 0 / 0; }
            return (s ? -1 : +1) / 0;
        }

        var result = e ?
            (m / psgnd + 1) * Math.pow(2, e - bias) :
            m / psgnd / pbias;

        return s ? -result : result;
    }
    
    function bytesToFloat(bytes)
    {
        return bytesToNumber(bytes, 127, float_pbias, float_psgnd);
    }
    
    function bytesToDouble(bytes)
    {
        return bytesToNumber(bytes, 1023, double_pbias, double_psgnd);
    }
    
    var EOFErrorMessage = 'Error #2030: End of file was encountered.';
    
    this.__init__ = function()
    {
        this.__bigEndian = true;
        this.__position = 0;
    };
    this.compress = function()
    {
    };
    this.uncompress = function()
    {
    };
    this.readBoolean = function()
    {
        var start = this.__position;
        var end = start + 1;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value = this[start];
        this.__position = end;
        return (value) ? true : false;
    };
    this.readByte = function()
    {
        var start = this.__position;
        var end = start + 1;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value = this[start];
        this.__position = end;
        return (value & 0x80) ? -((value ^ 0xFF) + 1) : value;
    };
    this.readUnsignedByte = function()
    {
        var start = this.__position;
        var end = start + 1;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var value = this[start];
        this.__position = end;
        return value;
    };
    this.__readShortB = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[start] << 8 | (this[start+1] & 0xFF);
        this.__position = end;
        return (value & 0x8000) ? -((value ^ 0xFFFF) + 1) : value;
    };
    this.__readShortL = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[end] << 8 | (this[end-1] & 0xFF);
        this.__position = end;
        return (value & 0x8000) ? -((value ^ 0xFFFF) + 1) : value;
    };
    this.readShort = this.__readShortB;
    this.__readUnsignedShortB = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[start] << 8 | (this[start+1] & 0xFF);
        this.__position = end;
        return value;
    };
    this.__readUnsignedShortL = function()
    {
        var start = this.__position;
        var end = start + 2;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = this[start] << 8 | (this[start+1] & 0xFF);
        this.__position = end;
        return value;
    };
    this.readUnsignedShort = this.__readUnsignedShortB;
    this.__readIntB = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[start] << 24 | (0xFF & this[start+1]) << 16 | (0xFF & this[start+2]) << 8 | (0xFF & this[start+3])) >>> 0;
        this.__position = end;
        return  (value & 0x80000000) ? -((value ^ 0xFFFFFFFF) + 1) : value;
    };
    this.__readIntL = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[end] << 24 | (0xFF & this[end-1]) << 16 | (0xFF & this[end-2]) << 8 | (0xFF & this[end-3])) >>> 0;
        this.__position = end;
        return  (value & 0x80000000) ? -((value ^ 0xFFFFFFFF) + 1) : value;
    };
    this.readInt = this.__readIntB;
    this.__readUnsignedIntB = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[start] << 24 | (0xFF & this[start+1]) << 16 | (0xFF & this[start+2]) << 8 | (0xFF & this[start+3])) >>> 0;
        this.__position = end;
        return value;
    };
    this.__readUnsignedIntL = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = (this[end] << 24 | (0xFF & this[end-1]) << 16 | (0xFF & this[end-2]) << 8 | (0xFF & this[end-3])) >>> 0;
        this.__position = end;
        return value;
    };
    this.readUnsignedInt = this.__readUnsignedIntB;
    this.__readFloatB = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToFloat(this.slice(start, end));
        this.__position = end;
        return value;
    };
    this.__readFloatL = function()
    {
        var start = this.__position;
        var end = start + 4;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToFloat(this.slice(start, end).reverse());
        this.__position = end;
        return value;
    };
    this.readFloat = this.__readFloatB;
    this.__readDoubleB = function()
    {
        var start = this.__position;
        var end = start + 8;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToDouble(this.slice(start, end));
        this.__position = end;
        return value;
    };
    this.__readDoubleL = function()
    {
        var start = this.__position;
        var end = start + 8;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        var value = bytesToDouble(this.slice(start, end).reverse());
        this.__position = end;
        return value;
    };
    this.readDouble = this.__readDoubleB;
    this.readMultiByte = function(length, charset)
    {
        //probably not going to support
        return this.readUTFBytes(length);
    };
    this.readObject = function()
    {
        //someday
    };
    this.readUTF = function()
    {
        var length = this.readShort();
        return this.readUTFBytes(length);
    };
    this.readUTFBytes = function(length)
    {
        var start = this.__position;
        var end = start + length;
        if (end > this.length) { throw new EOFError(EOFErrorMessage); }
        
        var chars = [];
        for (var i = start, c = 0; i < end;)
        {
            chars[c++] = String.fromCharCode(this[i++]);
        }
        this.__position = end;
        
        var s = chars.join("");
        return decodeURIComponent(escape(s));
    };
    this.writeByte = function(value)
    {
        var position = this.__position;
        this[position++] = value & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeBoolean = this.writeByte;
    this.writeBytes = function(bytes, offset, length)
    {
        offset = offset | 0;
        length = length | 0 || bytes.length - offset;
        
        var position = this.__position;
        for (var i = offset; i < length; ++i)
        {
            this[position++] = bytes[i];
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeShortB = function(value)
    {
        var position = this.__position;
        this[position++] = value >> 8 & 0xFF;
        this[position++] = value      & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeShortL = function(value)
    {
        var position = this.__position;
        this[position++] = value      & 0xFF;
        this[position++] = value >> 8 & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeShort = this.__writeShortB;
    this.__writeIntB = function(value)
    {
        var position = this.__position;
        this[position++] = value >> 24 & 0xFF;
        this[position++] = value >> 16 & 0xFF;
        this[position++] = value >> 8  & 0xFF;
        this[position++] = value       & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeIntL = function(value)
    {
        var position = this.__position;
        this[position++] = value       & 0xFF;
        this[position++] = value >> 8  & 0xFF;
        this[position++] = value >> 16 & 0xFF;
        this[position++] = value >> 24 & 0xFF;
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeInt = this.__writeIntB;
    this.writeUnsignedInt = function(value)
    {
        this.writeInt(value >>> 0);
    };
    this.__writeFloatB = function(value)
    {
        var bytes = floatToBytes(value);
        var position = this.__position;
        this[position++] = bytes[0];
        this[position++] = bytes[1];
        this[position++] = bytes[2];
        this[position++] = bytes[3];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeFloatL = function(value)
    {
        var bytes = floatToBytes(value);
        var position = this.__position;
        this[position++] = bytes[3];
        this[position++] = bytes[2];
        this[position++] = bytes[1];
        this[position++] = bytes[0];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeFloat = this.__writeFloatB;
    this.__writeDoubleB = function(value)
    {
        var bytes = doubleToBytes(value);
        var position = this.__position;
        this[position++] = bytes[0];
        this[position++] = bytes[1];
        this[position++] = bytes[2];
        this[position++] = bytes[3];
        this[position++] = bytes[4];
        this[position++] = bytes[5];
        this[position++] = bytes[6];
        this[position++] = bytes[7];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.__writeDoubleL = function(value)
    {
        var bytes = doubleToBytes(value);
        var position = this.__position;
        this[position++] = bytes[7];
        this[position++] = bytes[6];
        this[position++] = bytes[5];
        this[position++] = bytes[4];
        this[position++] = bytes[3];
        this[position++] = bytes[2];
        this[position++] = bytes[1];
        this[position++] = bytes[0];
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeDouble = this.__writeDoubleB;
    this.writeMultiByte = function(value, charSet)
    {
        //probably not going to support
        this.writeUTFBytes(value);
    };
    this.writeObject = function(value)
    {
        //someday
    };
    this.writeUTF = function(value)
    {
        var str = unescape(encodeURIComponent(value));
        var length = str.length;
        
        if (length > 0xFFFF) {
            throw new RangeError('Error #2006 : The supplied index is out of bounds.');
        }
        
        this.writeShort(length);
        
        var position = this.__position;
        for (var i = 0; i < length; ++i)
        {
            this[position++] = str.charCodeAt(i);
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    this.writeUTFBytes = function(value)
    {
        var str = unescape(encodeURIComponent(value));
        var length = str.length;
        
        var position = this.__position;
        for (var i = 0; i < length; ++i)
        {
            this[position++] = str.charCodeAt(i);
        }
        this.__position = position;
        if (position > this.length) { this.length = position; }
    };
    
    this.__get__bytesAvailable = function()
    {
        return this.length - this.__position;
    };
    this.__get__endian = function()
    {
        return (this.__bigEndian) ? Endian.BIG_ENDIAN : Endian.LITTLE_ENDIAN;
    };
    this.__set__endian = function(v)
    {
        this.__bigEndian = (v == Endian.BIG_ENDIAN);
        var suffix = (this.__bigEndian) ? 'B' : 'L';
        this.readShort = this['__readShort' + suffix];
        this.readUnsignedShort = this['__readUnsignedShort' + suffix];
        this.readInt = this['__readInt' + suffix];
        this.readUnsignedInt = this['__readUnsignedInt' + suffix];
        this.readFloat = this['__readFloat' + suffix];
        this.readDouble = this['__readDouble' + suffix];
        this.writeShort = this['__writeShort' + suffix];
        this.writeInt = this['__writeInt' + suffix];
        this.writeFloat = this['__writeFloat' + suffix];
        this.writeDouble = this['__writeDouble' + suffix];
    };
    this.__get__position = function()
    {
        return this.__position;
    };
    this.__set__position = function(v)
    {
        if (v > this.length) {
            //fill the array with zeros until length == position
            var len = v - this.length;
            for (var i = 0; i < len; ++i)
            {
                this.push(0);
            }
        }
        this.__position = v | 0;
    };
    
    this.toString = function()
    {
        return this.map(function(element, index, array)
        {
            return String.fromCharCode(element);
        }, this).join("");
    };
    
    this.toArray = function()
    {
        return this.splice(0);
    };
});
/**
* CoordinateShuffler by Mario Klingemann. Dec 14, 2008
* Visit www.quasimondo.com for documentation, updates and more free code.
*
*
* Copyright (c) 2008 Mario Klingemann
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
**/
var CoordinateShuffler = new Class(Object, function()
{
    this.__init__ = function(width, height, seed, shuffleDepth, lookupTableSize)
    {
        this.__width = width;
        this.__height = height;
        this.__maximumIndex = width * height;
        this.__currentIndex = 0;
        this.__shuffleDepth = shuffleDepth || 3;
        this.__lookupTableSize = lookupTableSize || 256;
        this.__hLookup = [];
        this.__vLookup = [];
        this.__seed0 = 0;
        this.__seed1 = 0;
        this.__seed2 = 0;
        this.setSeed(seed || 0xBADA55);
    };
    
    /**
    * Returns a unique coordinate within the given width and height
    * Valid values for index go from 0 to width * height, 
    * bigger values will be wrapped around  
    **/
    this.getCoordinate = function(index)
    {
        var __width = this.__width;
        var __height = this.__height;
        var __hLookup = this.__hLookup;
        var __vLookup = this.__vLookup;
        var __maximumIndex = this.__maximumIndex;
        var __shuffleDepth = this.__shuffleDepth;
        var __lookupTableSize = this.__lookupTableSize;
        
        index %= __maximumIndex;
        var x = index % __width;
        var y = index / __width | 0;
        
        for (var i = 0; i < __shuffleDepth; ++i)
        {
            y = ( y + __hLookup[ (i * __width  + x) % __lookupTableSize ] ) % __height;
            x = ( x + __vLookup[ (i * __height + y) % __lookupTableSize ] ) % __width;
        }
        this.__currentIndex = (index + 1) % __maximumIndex;
        return [x, y];
    };
    
    
    /**
    * Returns a unique coordinate within the given width and height
    * and increments the internal index
    **/
    this.getNextCoordinate = function()
    {
        return this.getCoordinate(this.__currentIndex + 1);
    };
    
    /**
    * Returns a list of unique coordinate within the given width and height
    * The maximum amount of returned coordinates is width * height which constitutes all pixels, 
    **/
    this.getCoordinates = function(count, index)
    {
        var __width = this.__width;
        var __height = this.__height;
        var __hLookup = this.__hLookup;
        var __vLookup = this.__vLookup;
        var __maximumIndex = this.__maximumIndex;
        var __shuffleDepth = this.__shuffleDepth;
        var __lookupTableSize = this.__lookupTableSize;
        var list = [];
        
        if (count < 1) { return []; }
        if (count > __maximumIndex) { count = __maximumIndex; }
        
        index %= __maximumIndex;
        var xx = index % __width;
        var yy = index / __width | 0;
        
        while (count > 0)
        {
            var x = xx;
            var y = yy;
            for (var i = 0; i < __shuffleDepth; ++i)
            {
                y = ( y + __hLookup[ (i * __width  + x) % __lookupTableSize ] ) % __height;
                x = ( x + __vLookup[ (i * __height + y) % __lookupTableSize ] ) % __width;
            }
            list.push([x, y]);
            
            index++;
            index %= __maximumIndex;
            
            xx = (xx + 1) % __width;
            if (xx === 0) {
                yy = (yy + 1) % __height;
            }
            
            count--;
        }
        
        this.__currentIndex = index + count % __maximumIndex;
        return list;
    };
    
    /**
    * Controls how often the coordinates get shuffled around
    * A higher should create a more random looking pattern
    * minimum value is 1 
    **/
    this.getShuffleDepth = function()
    {
        return this.__shuffleDepth;
    };
    this.setShuffleDepth = function(v)
    {
        this.__shuffleDepth = (v > 1) ? v : 1;
        this.setSeed(this.__seed);
    };
    
    
    /**
    * Sets the size of the internal coordinate shuffle tables
    * Smaller values create a more geometric looking pattern
    * Bigger values need a bit longer for the initial setup of the table 
    * minimum value is 1 
    **/
    this.getLookupTableSize = function()
    {
        return this.__lookupTableSize;
    };
    this.setLookupTableSize = function(v)
    {
        this.__lookupTableSize = (v > 1) ? v : 1;
        this.setSeed(this.__seed);
    };
    
    this.getMaximumIndex = function()
    {
        return this.__maximumIndex;
    };
    
    this.getWidth = function()
    {
        return this.__width;
    };
    this.setWidth = function(v)
    {
        this.__width = v;
        this.__maximumIndex = v * this.__height;
        this.setSeed(this.__seed);
    };
    
    this.getHeight = function()
    {
        return this.__height;
    };
    this.setHeight = function(v)
    {
        this.__height = v;
        this.__maximumIndex = this.__width * v;
        this.setSeed(this.__seed);
    };
    
    /**
    * Sets the next point index
    * used in conjuntion with getNextCoordinate
    **/
    this.getIndex = function(v)
    {
        return this.__currentIndex;
    };
    this.setIndex = function(v)
    {
        this.__currentIndex = v % this.__maximumIndex;
    };
    
    /**
    * Sets the random seed 
    * different seeds will return the coordinates in different order 
    **/
    this.setSeed = function(v)
    {
        var __seed = v;
        
        var __seed0 = (69069 * __seed) & 0xffffffff;
        if (__seed0 < 2) {
            __seed0 += 2;
        }

        var __seed1 = (69069 * __seed0) & 0xffffffff;
        if (__seed1 < 8) {
            __seed1 += 8;
        }

        var __seed2 = (69069 * __seed1) & 0xffffffff;
        if (__seed2 < 16) {
            __seed2 += 16;
        }
        
        this.__seed  = __seed;
        this.__seed0 = __seed0;
        this.__seed1 = __seed1;
        this.__seed2 = __seed2;
        
        this.update();
    };
    
    this.update = function()
    {
        var __width = this.__width;
        var __height = this.__height;
        var __lookupTableSize = this.__lookupTableSize;
        
        var i;
        var __hLookup = [];
        var __vLookup = [];
        
        for (i = __lookupTableSize - 1; i >= 0; --i)
        {
            __hLookup[i] = this.getNextInt() % __height;
            __vLookup[i] = this.getNextInt() % __width;
        }
        
        this.__hLookup = __hLookup;
        this.__vLookup = __vLookup;
    };
    
    this.getNextInt = function()
    {
        var __seed0 = this.__seed0;
        var __seed1 = this.__seed1;
        var __seed2 = this.__seed2;
        __seed0 = ((( __seed0 & 4294967294) << 12) & 0xffffffff) ^ ((((__seed0 << 13) & 0xffffffff) ^ __seed0) >>> 19);
        __seed1 = ((( __seed1 & 4294967288) <<  4) & 0xffffffff) ^ ((((__seed1 <<  2) & 0xffffffff) ^ __seed1) >>> 25);
        __seed2 = ((( __seed2 & 4294967280) << 17) & 0xffffffff) ^ ((((__seed2 <<  3) & 0xffffffff) ^ __seed2) >>> 11);
        this.__seed0 = __seed0;
        this.__seed1 = __seed1;
        this.__seed2 = __seed2;
        
        //for some reason this doesn't work in opera
        //return (__seed0 ^ __seed1 ^ __seed2) >>> 0;
        
        var result = __seed0 ^ __seed1 ^ __seed2;
        if (result < 0) { result = 4294967296 + result; }
        return result;
    };
});
var getTimer = function()
{
    return (cs3.core.initialized) ? (new Date()).getTime() - cs3.core.startTime : 0;
};
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
