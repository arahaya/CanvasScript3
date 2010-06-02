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
if (window.CanvasRenderingContext2D && !CanvasRenderingContext2D.prototype.createImageData && window.ImageData) {
    CanvasRenderingContext2D.prototype.createImageData = function(w, h) { return new ImageData(w, h); };
}
if (Object.prototype.__defineGetter__ == undefined) {
    Object.prototype.__defineGetter__ = function(){};
    Object.prototype.__defineSetter__ = function(){};
}
var cs3 = {
    core: {
        initialized: false,
        debug: false,
        isOpera: false,
        stages: [],
        instanceId: 0,
        resizeTimeout: null,
        testCanvas: null,
        testContext: null,
        nextInstanceId: function()
        {
            ++this.instanceId;
            return this.instanceId;
        },
        init: function()
        {
            if (this.initialized) { return; }
            
            if (!document.body) {
                alert('document not loaded');
                return;
            }
            
            
            //canvas for testing
            this.testCanvas = document.createElement("CANVAS");
            if (!this.testCanvas.getContext) {
                try {
                    G_vmlCanvasManager.initElement(this.testCanvas);
                }
                catch (e) {
                    alert('no canvas support');
                    return;
                }
            }
            this.testContext = this.testCanvas.getContext('2d');
            
            
            //TODO add beter browser detection
            this.isOpera = (window.opera) ? true : false;
            
            window.onresize = this.resizeHandler;
            
            this.initialized = true;
        },
        resizeHandler: function(e)
        {
            e = e || window.event;
            var c = cs3.core;
            var t = c.resizeTimeout;
            clearTimeout(t);
            t = setTimeout(c.lazyResizeHandler, 10);
        },
        lazyResizeHandler: function(e)
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
            cs3.utils.addEventListener(canvas, 'mousemove', function(e) { stage.__mouseMoveHandler(e); });
            cs3.utils.addEventListener(canvas, 'mousedown', function(e) { stage.__mouseDownHandler(e); });
            cs3.utils.addEventListener(canvas, 'mouseup', function(e) { stage.__mouseUpHandler(e); });
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
    utils: {
        __events: {},
        addOnload: function(func)
        {
            var self = this;
            this.addEventListener(window, 'load', function()
            {
                func();
                self.removeEventListener(window, 'load', arguments.callee);
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
        createCanvas: function(id, width, height)
        {
            var canvas = document.createElement('CANVAS');
            canvas.id = id || null;
            canvas.width = width | 0;
            canvas.height = height | 0;
            return canvas;
        },
        getContext2d: function(canvas)
        {
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
        }
    }
};
/**
 * Fix rectangle coords to integers
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
function __argsLen(len, args)
{
    if (args.length !== len) {
        throw new Error("Incorrect number of arguments.  Expected " + len + ".");
    }
}
function __notNULL(name, val)
{
    if (val === null) {
        throw new TypeError("Parameter " + name + " must be non-null.");
    }
}


/* top level */
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
function Class(e, o)
{
    if (e === undefined) { e = {}; }
    if (o === undefined) { o = e; e = Object; }
    if (typeof(o) === 'function') { o = new o(); }
    if (o.__init__ === undefined) { o.__init__ = function(){}; }
    var c = o.__init__;
    var f = function(){};
    f.prototype = e.prototype;
    c.prototype = new f();
    for (var p in o) { if (p != '__init__') { c.prototype[p] = o[p]; } }
    return c;
}


var ArgumentError = function(message)
{
    Error.apply(this, arguments);
    this.name = 'ArgumentError';
    this.message = message;
};
ArgumentError.prototype = new Error();


var SimpleTween = new Class(Object, function()
{
    this.__init__ = function(displayObject, property, from, to, frames)
    {
        var range = to - from;
        var frame = 0;
        displayObject[property] = from;
        displayObject.addEventListener(Event.ENTER_FRAME, function(e)
        {
            ++frame;
            var ratio = SimpleTween.Elastic.easeOut(frame / frames);
            var next = from + (range * ratio);
            displayObject[property] = next;
            if (frame == frames) {
                displayObject[property] = to;
                displayObject.removeEventListener(Event.ENTER_FRAME, arguments.callee);
            }
        });
    };
});
SimpleTween.Back = {
    easeIn: function(t) {
        return 3 * t * t * t - 2 * t * t;
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Bounce = {
    DH: 1 / 22,
    D1: 1 / 11,
    D2: 2 / 11,
    D3: 3 / 11,
    D4: 4 / 11,
    D5: 5 / 11,
    D7: 7 / 11,
    IH: 1 / this.DH,
    I1: 1 / this.D1,
    I2: 1 / this.D2,
    I4D: 1 / this.D4 / this.D4,
    easeIn: function(t) {
        var s;
        if (t < this.D1) {
            s = t - this.DH;
            s = this.DH - s * s * this.IH;
        } else if (t < this.D3) {
            s = t - this.D2;
            s = this.D1 - s * s * this.I1;
        } else if (t < this.D7) {
            s = t - this.D5;
            s = this.D2 - s * s * this.I2;
        } else {
            s = t - 1;
            s = 1 - s * s * this.I4D;
        }
        return s;
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Circ = {
    easeIn: function(t) {
        return 1.0 - Math.sqrt(1.0 - t * t);
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Cubic = {
    easeIn: function(t) {
        return t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Elastic = {
    easeIn: function(t) {
        return 1.0 - this.easeOut(1.0 - t);
    },
    easeOut: function(t) {
        var s = 1 - t;
        return 1 - Math.pow(s, 8) + Math.sin(t * t * 6 * Math.PI) * s * s;
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Linear = {
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
SimpleTween.Quad = {
    easeIn: function(t) {
        return t * t;
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Quart = {
    easeIn: function(t) {
        return t * t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Quint = {
    easeIn: function(t) {
        return t * t * t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
SimpleTween.Sine = {
    _HALF_PI: Math.PI / 2,
    easeIn: function(t) {
        return 1.0 - Math.cos(t * this._HALF_PI);
    },
    easeOut: function(t) {
        return 1.0 - this.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
    }
};



/* flash.events */
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
Event.prototype.toString = function()
{
    return '[Event type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable + ']';
};


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
});
HTTPStatusEvent.HTTP_STATUS = 'httpStatus';
HTTPStatusEvent.prototype.toString = function()
{
    return '[HTTPStatusEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
        ' status=' + this.status + ']';
};


var IOErrorEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, text)
    {
        Event.call(this, type, bubbles, cancelable);
        this.text = text || "";
    };
    this.clone = function()
    {
        return new IOErrorEvent(this.type, this.bubbles, this.cancelable, this.text);
    };
});
IOErrorEvent.IO_ERROR = 'ioError';
IOErrorEvent.prototype.toString = function()
{
    return '[IOErrorEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
        ' text=' + this.text + ']';
};


var KeyboardEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, charCode, keyCode, keyLocation, ctrlKey, altKey, shiftKey)
    {
        Event.call(this, type, bubbles, cancelable);
        this.altKey = (altKey) ? true : false;//not possible?
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
});
KeyboardEvent.KEY_DOWN = 'keyDown';
KeyboardEvent.KEY_UP = 'keyUp';
KeyboardEvent.prototype.toString = function()
{
    return '[KeyboardEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
        ' charCode=' + this.charCode + ' keyCode=' + this.keyCode + ' keyLocation=' + this.keyLocation +
        ' ctrlKey=' + this.ctrlKey + ' altKey=' + this.altKey + ' shiftKey=' + this.shiftKey + ']';
};


var MouseEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
    {
        Event.call(this, type, bubbles, cancelable);
        this.altKey = (altKey) ? true : false;//not possible?
        this.ctrlKey = (ctrlKey) ? true : false;
        this.shiftKey = (shiftKey) ? true : false;
        this.buttonDown = (buttonDown) ? true : false;//when does this become true?
        this.delta = delta | 0;
        this.__localX = localX | 0;
        this.__localY = localY | 0;
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
    
    this.getLocalX = function()
    {
        if (this.__localX !== null) {
            return this.__localX;
        }
        return this.currentTarget.getMouseX();
    };
    this.getLocalY = function()
    {
        if (this.__localY !== null) {
            return this.__localY;
        }
        return this.currentTarget.getMouseY();
    };
    this.getStageX = function()
    {
        if (this.__localX !== null) {
            return this.currentTarget.localToGlobal(new Point(this.__localX, 0)).x;
        }
        return this.target.__stage.__mouseX;
    };
    this.getStageY = function()
    {
        if (this.__localY !== null) {
            return this.currentTarget.localToGlobal(new Point(this.__localY, 0)).y;
        }
        return this.currentTarget.__stage.__mouseY;
    };
});
MouseEvent.prototype.__defineGetter__("localX", MouseEvent.prototype.getLocalX);
MouseEvent.prototype.__defineGetter__("localY", MouseEvent.prototype.getLocalY);
MouseEvent.prototype.__defineGetter__("stageX", MouseEvent.prototype.getStageX);
MouseEvent.prototype.__defineGetter__("stageY", MouseEvent.prototype.getStageY);
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
MouseEvent.prototype.toString = function()
{
    return '[MouseEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable + ']';
};


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
});
ProgressEvent.PROGRESS = 'progress';
ProgressEvent.prototype.toString = function()
{
    return '[ProgressEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable +
        ' bytesLoaded=' + this.bytesLoaded + ' bytesTotal=' + this.bytesTotal + ']';
};


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


/* flash.display */
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
        this.__modified = true;
        this.__parent = null;
        this.__stage = null;
        this.__root = null;
        this.__stageRect = null;
        this.__cache = null;
        //this.blendMode = 'normal';
        //this.cacheAsBitmap = false;
        this.__filters = [];
        //this.loaderInfo = new LoaderInfo();
        //this.mask = null;
        //this.opaqueBackground = null;
    };
    this.__getBounds = function()
    {
        return this.__getRect();
    };
    this.__getRect = function()
    {
        return this.__getContentRect();
    };
    this.__getContentRect = function()
    {
        return new Rectangle();
    };
    this.__getObjectUnderPoint = function(context, matrix, point)
    {
        var rect = matrix.transformRect(this.__getContentRect());
        if (rect.containsPoint(point)) {
            context.save();
            context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
            this.__renderPoint(context, matrix, point);
            context.restore();
            var pixel = context.getImageData(point.x, point.y, 1, 1);
            var data = pixel.data;
            if (data[0] !== 0 || data[1] !== 0 || data[2] !== 0 || data[3] !== 0) {
                return this;
            }
        }
        return null;
    };
    this.__getModified = function()
    {
        return this.__modified || this.__transform.__modified;
    };
    this.__setModified = function(v)
    {
        this.__modified = v;
        this.__transform.__modified = v;
    };
    this.__render = function(context, matrix, color, rects)
    {
        //override
    };
    this.__renderPoint = function(context, matrix, point)
    {
        //override
    };
    this.__renderList = function(context, matrix, color, alpha, rects)
    {
        //apply ContextFilter's
        var filters = this.__filters;
        for (var i = 0, l = filters.length; i < l; ++i)
        {
            if (filters[i] instanceof ContextFilter) {
                filters[i].__filter(context, this);
            }
        }
        
        context.save();
        context.globalAlpha = alpha;
        context.transform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        
        //if (this.__cache) {
        //    this.__cache.__render(context, matrix, color, rects);
        //}
        //else {
            this.__render(context, matrix, color, rects);
        //}
        context.restore();
    };
    this.__update = function(matrix)
    {
        var modified = this.__getModified();
        if (modified) {
            var globalRect = matrix.transformRect(this.__getContentRect());
            
            //cache some variables(only used for rendering)
            //this.__globalRect = globalRect;
            //this.__globalMatrix = matrix.clone();
            
            //collect dirty rects
            this.__stage.__addDirtyRect(globalRect);
            if (this.__stageRect) {
                this.__stage.__addDirtyRect(this.__stageRect);
            }
            this.__stageRect = globalRect;
        }
        
        //reset modification
        this.__setModified(false);
    };
    this.getBounds = function(targetCoordinateSpace)
    {
        //TODO not tested at all
        var bounds = this.__getBounds();
        targetCoordinateSpace = targetCoordinateSpace || this.__root || this;
        if (targetCoordinateSpace === this) {
            return bounds;
        }
        if (targetCoordinateSpace === this.__parent) {
            return this.__transform.__matrix.transformRect(bounds);
        }
        
        //tansform your global rect to targets local rect
        var globalBounds = this.__transform.getConcatenatedMatrix().transformRect(bounds);
        if (targetCoordinateSpace === this.__root) {
            //if the target is your root, global coords is wat you want
            return globalBounds;
        }
        
        var targetMatrix = targetCoordinateSpace.__transform.getConcatenatedMatrix();
        targetMatrix.invert();
        return targetMatrix.transformRect(globalBounds);
    };
    this.getRect = function(targetCoordinateSpace)
    {
        //TODO
        return this.getBounds(targetCoordinateSpace);
    };
    this.globalToLocal = function(point)
    {
        var matrix = this.__transform.getConcatenatedMatrix();
        matrix.invert();
        return matrix.transformPoint(point);
    };
    this.hitTestObject = function(obj)
    {
        var globalBounds = this.__transform.getConcatenatedMatrix().transformRect(this.__getBounds());
        var targetGlobalBounds = obj.__transform.getConcatenatedMatrix().transformRect(obj.__getBounds());
        return globalBounds.intersects(targetGlobalBounds);
    };
    this.hitTestPoint = function(x, y, shapeFlag)
    {
        //TODO shapeFlag=true
        var globalBounds = this.__transform.getConcatenatedMatrix().transformRect(this.__getBounds());
        return globalBounds.contains(x, y);
    };
    this.localToGlobal = function(point)
    {
        return this.__transform.getConcatenatedMatrix().transformPoint(point);
    };
    
    /* getters and setters */
    this.getName = function()
    {
        if (this.__name === null) {
            return "instance" + this.__id;
        }
        return this.__name;
    };
    this.setName = function(v)
    {
        this.__name = v;
    };
    this.getStage = function()
    {
        return this.__stage;
    };
    this.getRoot = function()
    {
        return this.__root;
    };
    this.getParent = function()
    {
        return this.__parent;
    };
    this.getWidth = function()
    {
        return this.__transform.__matrix.transformRect(this.__getBounds()).width;
    };
    this.getHeight = function()
    {
        return this.__transform.__matrix.transformRect(this.__getBounds()).height;
    };
    this.getX = function()
    {
        return this.__transform.__getX();
    };
    this.setX = function(v)
    {
        this.__transform.__setX(v);
    };
    this.getY = function()
    {
        return this.__transform.__getY();
    };
    this.setY = function(v)
    {
        this.__transform.__setY(v);
    };
    this.getRotation = function()
    {
        return this.__transform.__getRotation();
    };
    this.setRotation = function(v)
    {
        this.__transform.__setRotation(v);
    };
    this.getScaleX = function()
    {
        return this.__transform.__getScaleX();
    };
    this.setScaleX = function(v)
    {
        this.__transform.__setScaleX(v);
    };
    this.getScaleY = function()
    {
        return this.__transform.__getScaleY();
    };
    this.setScaleY = function(v)
    {
        this.__transform.__setScaleY(v);
    };
    this.getAlpha = function()
    {
        return this.__alpha;
    };
    this.setAlpha = function(v)
    {
        this.__alpha = v;
        this.__modified = true;
    };
    this.getVisible = function()
    {
        return this.__visible;
    };
    this.setVisible = function(v)
    {
        this.__visible = (v) ? true : false;
        this.__modified = true;
    };
    this.getMouseX = function()
    {
        return this.globalToLocal(new Point(this.__stage.__mouseX, this.__stage.__mouseY)).x;
    };
    this.getMouseY = function()
    {
        return this.globalToLocal(new Point(this.__stage.__mouseX, this.__stage.__mouseY)).y;
    };
    this.getFilters = function()
    {
        return this.__filters.slice(0);
    };
    this.setFilters = function(v)
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
    this.getTransform = function()
    {
        return this.__transform;
    };
    this.setTransform = function(v)
    {
        this.__transform = v;
        this.__transform.__modified = true;
    };
});
DisplayObject.prototype.__defineGetter__("name", DisplayObject.prototype.getName);
DisplayObject.prototype.__defineSetter__("name", DisplayObject.prototype.setName);
DisplayObject.prototype.__defineGetter__("parent", DisplayObject.prototype.getParent);
DisplayObject.prototype.__defineGetter__("stage", DisplayObject.prototype.getStage);
DisplayObject.prototype.__defineGetter__("root", DisplayObject.prototype.getRoot);
DisplayObject.prototype.__defineGetter__("width", DisplayObject.prototype.getWidth);
DisplayObject.prototype.__defineGetter__("height", DisplayObject.prototype.getHeight);
DisplayObject.prototype.__defineGetter__("x", DisplayObject.prototype.getX);
DisplayObject.prototype.__defineSetter__("x", DisplayObject.prototype.setX);
DisplayObject.prototype.__defineGetter__("y", DisplayObject.prototype.getY);
DisplayObject.prototype.__defineSetter__("y", DisplayObject.prototype.setY);
DisplayObject.prototype.__defineGetter__("rotation", DisplayObject.prototype.getRotation);
DisplayObject.prototype.__defineSetter__("rotation", DisplayObject.prototype.setRotation);
DisplayObject.prototype.__defineGetter__("scaleX", DisplayObject.prototype.getScaleX);
DisplayObject.prototype.__defineSetter__("scaleX", DisplayObject.prototype.setScaleX);
DisplayObject.prototype.__defineGetter__("scaleY", DisplayObject.prototype.getScaleY);
DisplayObject.prototype.__defineSetter__("scaleY", DisplayObject.prototype.setScaleY);
DisplayObject.prototype.__defineGetter__("alpha", DisplayObject.prototype.getAlpha);
DisplayObject.prototype.__defineSetter__("alpha", DisplayObject.prototype.setAlpha);
DisplayObject.prototype.__defineGetter__("visible", DisplayObject.prototype.getVisible);
DisplayObject.prototype.__defineSetter__("visible", DisplayObject.prototype.setVisible);
DisplayObject.prototype.__defineGetter__("filters", DisplayObject.prototype.getFilters);
DisplayObject.prototype.__defineSetter__("filters", DisplayObject.prototype.setFilters);
DisplayObject.prototype.__defineGetter__("transform", DisplayObject.prototype.getTransform);
DisplayObject.prototype.__defineSetter__("transform", DisplayObject.prototype.setTransform);
DisplayObject.prototype.__defineGetter__("mouseX", DisplayObject.prototype.getMouseX);
DisplayObject.prototype.__defineGetter__("mouseY", DisplayObject.prototype.getMouseY);
DisplayObject.prototype.toString = function()
{
    return '[object DisplayObject]';
};


var Bitmap = new Class(DisplayObject, function()
{
    this.__init__ = function(bitmapData)
    {
        DisplayObject.call(this);
        this.__bitmapData = bitmapData ? bitmapData : null;
    };
    //override
    this.__getContentRect = function()
    {
        if (this.__bitmapData) {
            return this.__bitmapData.__rect.clone();
        }
        return new Rectangle();
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
    this.__render = function(context, matrix, color, rects)
    {
        if (this.__bitmapData) {
            this.__bitmapData.__render(context, matrix, color, rects);
        }
    };
    //override
    this.__renderPoint = function(context, matrix, point)
    {
        if (this.__bitmapData) {
            this.__bitmapData.__renderPoint(context, matrix, point);
        }
    };
    /* getters and setters */
    this.getBitmapData = function()
    {
        return this.__bitmapData;
    };
    this.setBitmapData = function(v)
    {
        this.__bitmapData = v;
        this.__setModified(true);
    };
});
Bitmap.prototype.__defineGetter__("bitmapData", Bitmap.prototype.getBitmapData);
Bitmap.prototype.toString = function()
{
    return '[object Bitmap]';
};


var BitmapData = new Class(Object, function()
{
    this.__init__ = function(width, height, transparent, fillColor)
    {
        //transparent=false doesn't work
        if (!width || !height) {
            throw new ArgumentError("Invalid BitmapData.");
        }
        
        width = Math.floor(width);
        height = Math.floor(height);
        
        this.__width = width;
        this.__height = height;
        //this.__transparent = (transparent) ? true : false;
        this.__canvas = document.createElement('CANVAS');
        this.__canvas.width = width;
        this.__canvas.height = height;
        this.__context = this.__canvas.getContext('2d');
        this.__rect = new Rectangle(0, 0, width, height);
        this.__pixel = this.__context.createImageData(1, 1);
        this.__lock = false;
        this.__tempImage = null;
        this.__modified = false;
        
        if (fillColor === null) { fillColor = 0xFFFFFFFF; }
        this.fillRect(this.__rect, fillColor);
    };
    this.__render = function(context, matrix, color, rects)
    {
        /*
        var rect = this.__rect;
        
        //convert rects to local coords
        var invertedMatrix = matrix.clone();
        invertedMatrix.invert();
        
        for (i = 0, l = rects.length; i < l; ++i)
        {
            var r = rect.intersection(invertedMatrix.transformRect(rects[i]));
            if (r.isEmpty()) {
                continue;
            }
            
            __ceilRect(r);
            context.drawImage(this.__canvas, r.x, r.y, r.width, r.height, r.x, r.y, r.width, r.height);
        }
        */
        var rect = this.__rect;
        context.translate(rect.x, rect.y);
        context.drawImage(this.__canvas, 0, 0);
    };
    this.__renderPoint = function(context, matrix, point)
    {
        var rect = this.__rect;
        
        //convert point to local coords
        var invertedMatrix = matrix.clone();
        invertedMatrix.invert();
        var localPoint = invertedMatrix.transformPoint(point);
        
        if (rect.containsPoint(localPoint)) {
            context.drawImage(this.__canvas, localPoint.x, localPoint.y, 1, 1, localPoint.x, localPoint.y, 1, 1);
        }
    };
    this.__alphaBlend = function(src, dx, dy)
    {
        var dst = this.__context.getImageData(dx, dy, src.width, src.height);
        this.__alphaBlendImageData(dst, src);
        this.__context.putImageData(dst, dx, dy);
    };
    this.__alphaBlendImageData = function(dst, src)
    {
        this.__alphaBlendArray(dst.data, src.data);
    };
    this.__alphaBlendArray = function(dst, src)
    {
        var srcLength = src.length;
        var ri, gi, bi, ai;
        var sa, da, na, ma;
        for (var i = 0; i < srcLength;)
        {
            ri = i++;
            gi = i++;
            bi = i++;
            ai = i++;
            
            if (src[ai] === 0) {
                //src is transparent, dst keeps its color
                continue;
            }
            else if (src[ai] === 255 || dst[ai] === 0) {
                //src is solid OR dst is transparent, simply overwrite dst
                dst[ri] = src[ri];
                dst[gi] = src[gi];
                dst[bi] = src[bi];
                dst[ai] = src[ai];
            }
            else if (dst[ai] !== 255) {
                //caculate the new color
                sa = src[ai] / 255;
                da = dst[ai] / 255;
                na = da + sa - sa * da;
                ma = 1 - sa;
                dst[ri] = (src[ri] * sa + dst[ri] * da * ma) / na;
                dst[gi] = (src[gi] * sa + dst[gi] * da * ma) / na;
                dst[bi] = (src[bi] * sa + dst[bi] * da * ma) / na;
                dst[ai] = na * 255;
            }
            else {
                sa = src[ai] / 255;
                ma = 1 - sa;
                dst[ri] = src[ri] * sa + dst[ri] * ma;
                dst[gi] = src[gi] * sa + dst[gi] * ma;
                dst[bi] = src[bi] * sa + dst[bi] * ma;
            }
        }
    };
    this.__floodFill4Stack = function(data, x, y, width, height, targetColor, replacementColor)
    {
        var T0 = targetColor[0];
        var T1 = targetColor[1];
        var T2 = targetColor[2];
        var T3 = targetColor[3];
        var R0 = replacementColor[0];
        var R1 = replacementColor[1];
        var R2 = replacementColor[2];
        var R3 = replacementColor[3];
        
        var stack = [];
        var pop = [x, y, 0];
        var ignore;
        while (pop)
        {
            x = pop[0];
            y = pop[1];
            ignore = pop[2];//make sure it doesn't go back the way it just came from
            
            if (x < 0 || x > width || y < 0 || y > height) {
                //out of rect
                pop = stack.pop();
                continue;
            }
            
            //get the array index
            var p = ((y * width) + x) * 4;
            
            if (data[p] !== T0 || data[p+1] !== T1 || data[p+2] !== T2 || data[p+3] !== T3) {
                //node color doesn't equal target color
                pop = stack.pop();
                continue;
            }
            
            //replace node color
            data[p]   = R0;
            data[p+1] = R1;
            data[p+2] = R2;
            data[p+3] = R3;
            
            if (ignore !== 1) { stack.push([x-1, y, 2]); }//west
            if (ignore !== 2) { stack.push([x+1, y, 1]); }//east
            if (ignore !== 3) { stack.push([x, y-1, 4]); }//north
            if (ignore !== 4) { stack.push([x, y+1, 3]); }//south
            
            pop = stack.pop();
        }
    };
    this.__floodFillScanlineStack = function(data, x, y, width, height, targetColor, replacementColor)
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
        var pop = [x, y];
        var spanLeft, spanRight, p;
        while (pop)
        {
            x = pop[0];
            y = pop[1];
            p = (y * LINESIZE) + (x * 4);
            
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
                    stack.push([x - 1, y]);
                    spanLeft = 1;
                }
                else if (spanLeft && x > 0 && (data[p] !== T0 || data[p+1] !== T1 || data[p+2] !== T2 || data[p+3] !== T3)) {
                    spanLeft = 0;
                }
                
                p += 8;//x + 1
                if (!spanRight && x < WIDTH_M1 && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3)) {
                    stack.push([x + 1, y]);
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
    this.applyFilter = function(sourceBitmapData, sourceRect, destPoint, filter)
    {
        filter.__filterBitmapData(sourceBitmapData, sourceRect, this, destPoint);
        this.__modified = true;
    };
    this.clone = function()
    {
        var b = new BitmapData(this.__width, this.__height);
        b.__context.drawImage(this.__canvas, 0, 0);
        return b;
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
        
        var image = this.__context.getImageData(rect.x, rect.y, rect.width, rect.height);
        var data = image.data;
        var length = data.length;
        var i;
        
        if (cs3.core.isOpera) {
            //I think opera does something like (color & 0xFF)
            for (i = 0; i < length;)
            {
                data[i] = Math.min(data[i++] * rm + ro, 255);
                data[i] = Math.min(data[i++] * gm + go, 255);
                data[i] = Math.min(data[i++] * bm + bo, 255);
                data[i] = Math.min(data[i++] * am + ao, 255);
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
        
        this.__context.putImageData(image, rect.x, rect.y);
        this.__modified = true;
    };
    this.compare = function(otherBitmapData)
    {
        //TODO
    };
    this.copyChannel = function(sourceBitmapData, sourceRect, destPoint, sourceChannel, destChannel)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImage = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        var destImage = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var sourceData = sourceImage.data;
        var destData = destImage.data;
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
        
        this.__context.putImageData(destImage, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.copyPixels = function(sourceBitmapData, sourceRect, destPoint)
    {
        var sourceImage = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
        this.__context.putImageData(sourceImage, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.createImageData = function()
    {
        return this.__context.createImageData(arguments);
    };
    this.dispose = function()
    {
        this.__width = 0;
        this.__height = 0;
        this.__canvas.width = 0;
        this.__canvas.height = 0;
        this.__context = null;
        this.__rect.setEmpty();
        
        var error = function() {
            throw new ArgumentError("Invalid BitmapData.");
        };
        
        //disable all methods
        //excluding toString and private methods
        for (var p in this)
        {
            if (p !== 'toString' && p.charAt(0) !== '_' && typeof this[p] == 'function') {
                this[p] = error;
            }
        }
        
        //disable getters
        this.__defineGetter__("width", error);
        this.__defineGetter__("height", error);
        this.__defineGetter__("rect", error);
        this.__modified = true;
    };
    this.draw = function(source, matrix)
    {
        //TODO a lot to fix..
        matrix = matrix || new Matrix();
        source.__renderList(this.__context, matrix, new ColorTransform(), 1, [this.__rect]);
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
        var pixels = this.__context.getImageData(0, 0, width, height);
        var data = pixels.data;
        
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
        this.__floodFillScanlineStack(data, x, y, width, height, targetColor, replacementColor);
        
        this.__context.putImageData(pixels, 0, 0);
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
        
        var width = this.__width;
        var height = this.__height;
        var data = this.__context.getImageData(0, 0, width, height).data;
        
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
                        minX = (x < minX) ? x : minX;
                        minY = (y < minY) ? y : minY;
                        maxX = (x > maxX) ? x : maxX;
                        maxY = (y > maxY) ? y : maxY;
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
                        minX = (x < minX) ? x : minX;
                        minY = (y < minY) ? y : minY;
                        maxX = (x > maxX) ? x : maxX;
                        maxY = (y > maxY) ? y : maxY;
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
        return this.__context.getImageData(arguments);
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
        var sourceImage = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        var destImage = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var sourceData = sourceImage.data;
        var destData = destImage.data;
        var length = sourceData.length;
        
        for (var i = 0; i < length;)
        {
            destData[i]   = (sourceData[i] * redMultiplier   + destData[i] * (256 - redMultiplier))   / 256;
            destData[++i] = (sourceData[i] * greenMultiplier + destData[i] * (256 - greenMultiplier)) / 256;
            destData[++i] = (sourceData[i] * blueMultiplier  + destData[i] * (256 - blueMultiplier))  / 256;
            destData[++i] = (sourceData[i] * alphaMultiplier + destData[i] * (256 - alphaMultiplier)) / 256;
            ++i;
        }
        
        this.__context.putImageData(destImage, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.noise = function()
    {
        //alert("HELP!");
    };
    this.paletteMap = function(sourceBitmapData, sourceRect, destPoint, redArray, greenArray, blueArray, alphaArray)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImage = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        //var destImage = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        //var destImage = this.__context.createImageData(destRect.width, destRect.height);
        var sourceData = sourceImage.data;
        //var destData = destImage.data;
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
            newGreen = newColor >> 8  & 0xFF;
            newBlue  = newColor & 0xFF;
            
            sourceData[i++] = newRed;
            sourceData[i++] = newGreen;
            sourceData[i++] = newBlue;
            sourceData[i++] = newAlpha;
        }
        
        this.__context.putImageData(sourceImage, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.perlinNoise = function(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsets)
    {
        //alert("HELP!");
    };
    this.pixelDissolve = function(sourceBitmapData, sourceRect, destPoint, randomSeed, numPixels, fillColor)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var destImage = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var destData = destImage.data;
        var size = destImage.width * destImage.height;
        var i, p;
        
        if (numPixels === undefined) { numPixels = size / 30; }
        
        if (sourceBitmapData === this) {
            fillColor = fillColor | 0;
            var fillAlpha = fillColor >> 24 & 0xFF;
            var fillRed   = fillColor >> 16 & 0xFF;
            var fillGreen = fillColor >> 8  & 0xFF;
            var fillBlue  = fillColor & 0xFF;
            
            for (i = 0; i < numPixels; ++i)
            {
                //TODO need a better random algorithm
                randomSeed = (randomSeed * 9301 + 49297) % 233280;
                p = Math.floor((randomSeed / 233280.0) * size) * 4;
                destData[p]   = fillRed;
                destData[p+1] = fillGreen;
                destData[p+2] = fillBlue;
                destData[p+3] = fillAlpha;
            }
        }
        else {
            var sourceImage = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
            var sourceData = sourceImage.data;
            for (i = 0; i < numPixels; ++i)
            {
                //TODO need a better random algorithm
                randomSeed = (randomSeed * 9301 + 49297) % 233280;
                p = Math.floor((randomSeed / 233280.0) * size) * 4;
                destData[p]   = sourceData[p];
                destData[p+1] = sourceData[p+1];
                destData[p+2] = sourceData[p+2];
                destData[p+3] = sourceData[p+3];
            }
        }
        
        this.__context.putImageData(destImage, destPoint.x, destPoint.y);
        this.__modified = true;
        return randomSeed;
    };
    this.putImageData = function()
    {
        this.__context.putImageData(arguments);
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
        
        var pixels = this.__context.createImageData(rect.width, rect.height);
        var data = pixels.data;
        for (var i = 0; i < length; ++i)
        {
            data[i] = inputArray[i];
        }
        this.__context.putImageData(pixels, rect.x, rect.y);
        this.__modified = true;
    };
    this.threshold = function(sourceBitmapData, sourceRect, destPoint, operation, threshold, color, mask, copySource)
    {
        if (color === undefined) { color = 0x00000000; }
        if (mask === undefined) { mask = 0xFFFFFFFF; }
        if (copySource === undefined) { copySource = false; }
        
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImage = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        var destImage = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var sourceData = sourceImage.data;
        var destData = destImage.data;
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
        
        this.__context.putImageData(destImage, destPoint.x, destPoint.y);
        this.__modified = true;
        return cnt;
    };
    
    /* getters and setters */
    this.getWidth = function()
    {
        return this.__width;
    };
    this.getHeight = function()
    {
        return this.__height;
    };
    this.getRect = function()
    {
        return this.__rect.clone();
    };
    this.getTransparent = function()
    {
        //return this.__transparent;
        return true;
    };
});
BitmapData.prototype.__defineGetter__("width", BitmapData.prototype.getWidth);
BitmapData.prototype.__defineGetter__("height", BitmapData.prototype.getHeight);
BitmapData.prototype.__defineGetter__("rect", BitmapData.prototype.getRect);
BitmapData.prototype.__defineGetter__("transparent", BitmapData.prototype.getTransparent);
BitmapData.prototype.toString = function()
{
    return '[object BitmapData]';
};


var BitmapDataChannel = {
    RED: 1,
    GREEN: 2,
    BLUE: 4,
    ALPHA: 8
};


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
});
InteractiveObject.prototype.toString = function()
{
    return '[object InteractiveObject]';
};


var DisplayObjectContainer = new Class(InteractiveObject, function()
{
    this.__init__ = function() {
        InteractiveObject.call(this);
        this.__children = [];
        this.mouseChildren = true;
        //this.tabChildren = true;
    };
    this.__getRect = function()
    {
        //TODO get rect containing child objects
        //return this.__getContentRect();
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
    this.__getObjectUnderPoint = function(context, matrix, point)
    {
        var children = this.__children;
        for (var i = children.length - 1, l = 0; i >= l; --i)
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
        
        return DisplayObject.prototype.__getObjectUnderPoint.call(this, context, matrix, point);
    };
    this.__renderList = function(context, matrix, color, alpha, rects)
    {
        DisplayObject.prototype.__renderList.call(this, context, matrix, color, alpha, rects);
        
        if (this.__cache) {
            //if rendered by cache, children do not need to be rendered
            return;
        }
        
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            if (child.__visible) {
                var childMatrix = child.__transform.__matrix.clone();
                childMatrix.concat(matrix);
                var childColor = child.__transform.__colorTransform.clone();
                childColor.concat(color);
                var childAlpha = alpha * child.__alpha;
                child.__renderList(context, childMatrix, childColor, childAlpha, rects);
            }
        }
    };
    this.__update = function(matrix)
    {
        var modified = this.__getModified();
        if (modified) {
            var globalRect = matrix.transformRect(this.__getContentRect());
            
            //collect dirty rects
            this.__stage.__addDirtyRect(globalRect);
            if (this.__stageRect) {
                this.__stage.__addDirtyRect(this.__stageRect);
            }
            this.__stageRect = globalRect;
        }
        
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            var childMatrix = child.__transform.__matrix.clone();
            childMatrix.concat(matrix);
            if (modified) {
                //if parent is modified child is to
                child.__setModified(true);
            }
            child.__update(childMatrix);
        }
        
        //reset modification
        this.__setModified(false);
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
        
        //add dirty rects
        child.__setModified(true);
        child.__update(child.__transform.getConcatenatedMatrix());
        
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
        for (var i = 0, l = this.__children.length; i < l; ++i)
        {
            var child = this.__children[i];
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
            throw e;//ArgumentError('The supplied DisplayObject must be a child of the caller.')
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
            throw e;//ArgumentError('The supplied DisplayObject must be a child of the caller.')
        }
        
        this.__children.splice(oldIndex, 1);
        this.__children.splice(index, 0, child);
    };
    this.swapChildren = function(child1, child2)
    {
        var index1, index2;
        try {
            index1 = this.getChildIndex(child1);
            index2 = this.getChildIndex(child2);
        }
        catch (e) {
            throw e;//ArgumentError('The supplied DisplayObject must be a child of the caller.')
        }
        
        this.__children[index2] = child1;
        this.__children[index1] = child2;
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
    };
    this.getObjectsUnderPoint = function(point)
    {
        var context;
        if (this.__stage) {
            context = this.__stage.__hiddenContext;
        }
        else {
            //if there is no reference to a stage
            //we have to create a new context to draw
            var rect = this.__getRect();
            var canvas = cs3.utils.createCanvas('_cs3_temp_canvas', rect.width, rect.height);
            context = cs3.utils.getContext2d(canvas);
        }
        
        //TODO
    };
    
    /* getters and setters */
    this.getNumChildren = function()
    {
        return this.__children.length;
    };
});
DisplayObjectContainer.prototype.__defineGetter__("numChildren", DisplayObjectContainer.prototype.getNumChildren);
DisplayObjectContainer.prototype.toString = function()
{
    return '[object DisplayObjectContainer]';
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
        this.__strokeStyle = null;
        this.__fillStyle = null;
        this.__x = 0;
        this.__y = 0;
        this.__rect = new Rectangle();
        this.__commands = [];
        this.__lastCommands = [];
    };
    this.__updateRect = function(x, y, width, height)
    {
        var rect = new Rectangle(x, y, width, height);
        rect.repair();
        //todo consider line caps
        rect.inflate(this.__lineWidth * 0.5, this.__lineWidth * 0.5);
        this.__rect = this.__rect.union(rect);
    };
    this.beginBitmapFill = function(bitmap, matrix, repeat, smooth)
    {
        //TODO
    };
    this.beginFill = function(color, alpha)
    {
        if (alpha === undefined) { alpha = 1; }
        this.__commands.push([BEGIN_FILL, __toRGB(color), alpha]);
    };
    this.beginGradientFill = function(type, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio)
    {
        //TODO
    };
    this.curveTo = function(controlX, controlY, anchorX, anchorY)
    {
        //TODO calculate rect
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
        this.__commands.push([LINE_STYLE, thickness, __toRGB(color), alpha, pixelHinting, scaleMode, caps, joints, miterLimit]);
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
    this.__fill = function(context, doFill, fillAlpha)
    {
        if (!doFill) { return; }
        
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
    this.__stroke = function(context, doStroke, strokeAlpha)
    {
        if (!doStroke) { return; }
        
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
    this.__closeStroke = function(context, doFill, sx, sy, ax, ay)
    {
        if (!doFill) { return; }
        
        if (sx !== ax || sy !== ay) {
            context.lineTo(sx, sy);
        }
    };
    this.__render = function(context, matrix, colorTransform)
    {
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
        var cmd, i, ii;
        var color, alpha;
        var thickness, pixelHinting, scaleMode, caps, joints, miterLimit;
        var controlX, controlY, anchorX, anchorY;
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
            switch (cmd[0])
            {
                case BEGIN_FILL:
                    this.__fill(context, doFill, fillAlpha);
                    color = cmd[1];
                    alpha = cmd[2];
                    doFill = true;
                    fillAlpha = alpha;
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.fillStyle = color;
                    break;
                case CURVE_TO:
                    controlX = cmd[1];
                    controlY = cmd[2];
                    anchorX = cmd[3];
                    anchorY = cmd[4];
                    context.quadraticCurveTo(controlX, controlY, anchorX, anchorY);
                    ax = anchorX;
                    ay = anchorY;
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    radius = cmd[3];
                    context.moveTo(x + radius, y);
                    context.arc(x, y, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
                    ax = x + radius;
                    ay = y;
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
                case DRAW_RECT:
                    //anchor at the top left
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    context.rect(x, y, width, height);
                    ax = x;
                    ay = y;
                    context.moveTo(ax, ay);
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
                case END_FILL:
                    this.__fill(context, doFill, fillAlpha);
                    doFill = false;
                    break;
                case LINE_STYLE:
                    break;
                case LINE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.lineTo(x, y);
                    ax = x;
                    ay = y;
                    break;
                case MOVE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.moveTo(x, y);
                    ax = x;
                    ay = y;
                    break;
                default:
                    break;
            }
        }
        this.__fill(context, doFill, fillAlpha);
        
        //stroke phase
        sx = sy = ax = ay = 0;
        context.beginPath();
        context.moveTo(0, 0);
        for (i = 0, l = commandLength; i < l; ++i)
        {
            cmd = commands[i];
            switch (cmd[0])
            {
                case BEGIN_FILL:
                    this.__closeStroke(context, doFill, sx, sy, ax, ay);
                    ax = sx;
                    ay = sy;
                    doFill = true;
                    break;
                case CURVE_TO:
                    controlX = cmd[1];
                    controlY = cmd[2];
                    anchorX = cmd[3];
                    anchorY = cmd[4];
                    context.quadraticCurveTo(controlX, controlY, anchorX, anchorY);
                    ax = anchorX;
                    ay = anchorY;
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    radius = cmd[3];
                    context.moveTo(x + radius, y);
                    context.arc(x, y, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
                    sx = ax = x + radius;
                    sy = ay = y;
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
                case DRAW_RECT:
                    //anchor at the top left
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    context.rect(x, y, width, height);
                    sx = ax = x;
                    sy = ay = y;
                    context.moveTo(ax, ay);
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
                case END_FILL:
                    this.__closeStroke(context, doFill, sx, sy, ax, ay);
                    ax = sx;
                    ay = sy;
                    doFill = false;
                    break;
                case LINE_STYLE:
                    this.__stroke(context, doStroke, strokeAlpha);
                    thickness    = cmd[1];
                    color        = cmd[2];
                    alpha        = cmd[3];
                    pixelHinting = cmd[4];
                    scaleMode    = cmd[5];
                    caps         = cmd[6];
                    joints       = cmd[7];
                    miterLimit   = cmd[8];
                    doStroke = (thickness) ? true : false;
                    strokeAlpha = alpha;
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.lineWidth = thickness;
                    context.strokeStyle = color;
                    context.lineCap = caps;
                    context.lineJoin = joints;
                    context.miterLimit = miterLimit;
                    break;
                case LINE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.lineTo(x, y);
                    ax = x;
                    ay = y;
                    break;
                case MOVE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.moveTo(x, y);
                    sx = ax = x;
                    sy = ay = y;
                    break;
                default:
                    break;
            }
        }
        this.__closeStroke(context, doFill, sx, sy, ax, ay);
        this.__stroke(context, doStroke, strokeAlpha);
    };
});
Graphics.prototype.toString = function()
{
    return '[object Graphics]';
};


var Loader = new Class(DisplayObjectContainer, function()
{
    this.__init__ = function()
    {
        DisplayObjectContainer.call(this);
        this.__content = null;
        this.__contentLoaderInfo = new LoaderInfo();
        this.__rect = new Rectangle();
    };
    this.load = function(request)
    {
        if (typeof request == 'string') {
            request = new URLRequest(request);
        }
        var img = new Image();
        var self = this;
        img.onload = function()
        {
            var bitmapData = new BitmapData(this.width, this.height, false, 0xFF000000);
            bitmapData.__context.drawImage(this, 0, 0);
            self.__content = new Bitmap(bitmapData);
            
            //add content as a child
            self.__addChildAt(self.__content, 0);
            
            self.__contentLoaderInfo.dispatchEvent(new Event(Event.COMPLETE, false, false));
        };
        img.src = request.url;
    };
    this.unload = function()
    {
        if (this.__content) {
            this.__content = null;
            this.__removeChildAt(0);
        }
    };
    this.close = function()
    {
        //nothing to do..
    };
    this.addChild = function(child)
    {
        throw new Error("The Loader class does not implement this method.");
    };
    this.addChildAt = function(child, index)
    {
        throw new Error("The Loader class does not implement this method.");
    };
    this.removeChild = function(child)
    {
        throw new Error("The Loader class does not implement this method.");
    };
    this.removeChildAt = function(index)
    {
        throw new Error("The Loader class does not implement this method.");
    };
    this.setChildIndex = function(child, index)
    {
        throw new Error("The Loader class does not implement this method.");
    };
    
    /* getters and setters */
    this.getContent = function()
    {
        return this.__content;
    };
    this.getContentLoaderInfo = function()
    {
        return this.__contentLoaderInfo;
    };
});
Loader.prototype.__defineGetter__("content", Loader.prototype.getContent);
Loader.prototype.__defineGetter__("contentLoaderInfo", Loader.prototype.getContentLoaderInfo);
Loader.prototype.toString = function()
{
    return '[object Loader]';
};


var LoaderInfo = new Class(EventDispatcher, function()
{
    this.__init__ = function()
    {
        EventDispatcher.call(this);
    };
});
LoaderInfo.prototype.toString = function()
{
    return '[object LoaderInfo]';
};


var Shape = new Class(DisplayObject, function()
{
    this.__init__ = function()
    {
        DisplayObject.call(this);
        this.__graphics = null;
    };
    this.__getContentRect = function()
    {
        if (this.__cache) {
            return this.__cache.__rect.clone();
        }
        if (this.__graphics) {
            return this.__graphics.__rect.clone();
        }
        return new Rectangle();
    };
    this.__getModified = function()
    {
        return (this.__modified ||
                this.__transform.__modified ||
                (this.__graphics && this.__graphics.__modified));
    };
    this.__setModified = function(v)
    {
        this.__modified = v;
        this.__transform.__modified = v;
        if (this.__graphics) {
            this.__graphics.__modified = v;
        }
    };
    this.__render = function(context, matrix, color)
    {
        if (!this.__graphics) {
            return;
        }
        /*
        //convert local rect to global coords
        var globalRect = matrix.transformRect(this.__graphics.__rect);
        
        //hit test
        for (var i = 0, l = rects.length; i < l; ++i)
        {
            if (globalRect.intersects(rects[i])) {
                this.__graphics.__render(context);
                return;
            }
        }
        */
        this.__graphics.__render(context, matrix, color);
    };
    this.__renderPoint = function(context, matrix, point)
    {
        if (!this.__graphics) {
            return;
        }
        /*
        var rect = this.__graphics.__rect;
        
        //convert local rect to global coords
        var globalRect = matrix.transformRect(rect);
        
        if (globalRect.containsPoint(point)) {
            this.__graphics.__render(context);
        }
        */
        this.__graphics.__render(context, matrix, null);
    };
    
    /* getters and setters */
    this.getGraphics = function()
    {
        if (this.__graphics === null) {
            this.__graphics = new Graphics();
        }
        return this.__graphics;
    };
});
Shape.prototype.__defineGetter__("graphics", Shape.prototype.getGraphics);
Shape.prototype.toString = function()
{
    return '[object Shape]';
};


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
    this.__getContentRect = Shape.prototype.__getContentRect;
    this.__getModified = Shape.prototype.__getModified;
    this.__setModified = Shape.prototype.__setModified;
    this.__render = Shape.prototype.__render;
    this.__renderPoint = Shape.prototype.__renderPoint;
    this.startDrag = function(lockCenter, bounds)
    {
        this.__stage.startDrag(this, lockCenter, bounds);
    };
    this.stopDrag = function()
    {
        this.__stage.stopDrag();
    };
    
    /* getters and setters */
    this.getGraphics = Shape.prototype.getGraphics;
});
Sprite.prototype.__defineGetter__("graphics", Sprite.prototype.getGraphics);
Sprite.prototype.toString = function()
{
    return '[object Sprite]';
};


var Stage = new Class(DisplayObjectContainer, function()
{
    this.__init__ = function(params)
    {
        DisplayObjectContainer.call(this);
        
        params = params || {};
        params.canvas     = params.canvas || null;
        params.width      = params.width | 0;
        params.height     = params.height | 0;
        params.frameRate  = params.frameRate | 30;
        params.align      = params.align || StageAlign.TOP_LEFT;
        params.scaleMode  = params.scaleMode || StageScaleMode.NO_SCALE;
        params.renderMode = params.renderMode || StageRenderMode.AUTO;/* all, dirty, auto */
        params.debug      = (params.debug) ? true : false;
        
        params.preventMouseWheel = (params.preventMouseWheel) ? true : false;
        params.preventTabKey     = (params.preventTabKey) ? true : false;
        
        cs3.core.debug = params.debug;
        
        this.__initialized = false;
        this.__rect = new Rectangle(0, 0, params.width ,params.height);
        this.__stageWidth = params.width;
        this.__stageHeight = params.height;
        this.__offsetX = 0;
        this.__offsetY = 0;
        this.__timer = null;
        this.__align = params.align;
        this.__scaleMode = params.scaleMode;
        this.__renderMode = params.renderMode;
        this.__mouseX = 0;
        this.__mouseY = 0;
        this.__objectUnderMouse = null;
        this.__mouseDownObject = null;
        this.__mouseClickObject = null;
        this.__dragOffsetX = 0;
        this.__dragOffsetY = 0;
        this.__dragTarget = null;
        this.__dragBounds = null;
        this.__lockFrameEvent = false;
        this.__blockedFrameEvent = false;
        this.__renderAll = true;
        this.__dirtyRects = [];
        this.__keyPressTimer = null;
        this.__isKeyDown = false;
        this.__preventMouseWheel = params.preventMouseWheel;
        this.__preventTabKey = params.preventTabKey;
        this.__frameRate = params.frameRate;
        this.stageFocusRect = false;
        this.showRedrawRegions = params.showRedrawRegions;
        this.__canvasWidth = null;
        this.__canvasHeight = null;
        this.__stage = this;
        this.__root = this;
        
        //TODO start preloading
        
        //setup
        if (!window.document.body) {
            var stage = this;
            cs3.utils.addOnload(function()
            {
                stage.__setup(params);
            });
        }
        else {
            this.__setup(params);
        }
    };
    this.__setup = function(params)
    {
        //document should now be loaded
        //setup stage
        if (params.canvas instanceof HTMLCanvasElement) {
            this.canvas = params.canvas;
        }
        else if (typeof params.canvas == 'string') {
            this.canvas = document.getElementById(params.canvas);
        }
        
        if (!this.canvas) {
            this.canvas = cs3.utils.createCanvas("_cs3_canvas_" + this.__id, 0, 0);
            document.body.appendChild(this.canvas);
        }
        
        this.__context = cs3.utils.getContext2d(this.canvas);
        this.__hiddenCanvas = cs3.utils.createCanvas("_cs3_hidden_canvas_" + this.__id, 0, 0);
        this.__hiddenContext = cs3.utils.getContext2d(this.__hiddenCanvas);
        
        this.canvas.style.cursor = 'default';
        this.canvas.tabIndex = 1;//enable focus events
        this.canvas.style.outline = "none";
        //this.canvas.oncontextmenu = function() { return false; };
        
        //register stage for document events
        cs3.core.registerStage(this);
        
        //adjust stage size
        this.__resize();
        
        //start frame loops
        this.__initialized = true;
        this.__enterFrame();
    };
    this.__addDirtyRect = function(rect)
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
        
        var dirtyRects = this.__dirtyRects;
        var i = dirtyRects.length;
        while (i--)
        {
            var dirty = dirtyRects[i];
            if (dirty.intersects(rect)) {
                //var intersection = dirty.intersection(rect);
                //if (intersection.width * intersection.height > rect.width * rect.height / 5) {
                    dirtyRects[i] = dirty.union(rect);
                    return;
                //}
            }
        }
        
        dirtyRects.push(rect);
    };
    this.__focusHandler = function(e)
    {
        //trace("focus");
        //Firefox needs to resize
        //solved by adding outline=none
        //this.__resize();
    };
    this.__blurHandler = function(e)
    {
        //trace("blur");
        //Firefox needs to resize
        //solved by adding outline=none
        //this.__resize();
    };
    this.__keyDownHandler = function(e)
    {
        clearTimeout(this.__keyPressTimer);
        this.__isKeyDown = true;
        
        if (cs3.core.isOpera) {
            this.__keyPressTimer = setTimeout(function(){ this.__keyPressHandler(e); }, 500);
        }
        
        var keyCode = e.keyCode;
        var charCode = 0;//todo
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
        e = e || window.event;
        this.__isKeyDown = false;
        clearTimeout(this.__keyPressTimer);
        
        var keyCode = e.keyCode;
        var charCode = 0;//todo
        var keyLocation = 0;//not supported
        this.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_UP, true, false, charCode, keyCode, keyLocation, e.ctrlKey, e.altKey, e.shiftKey));
    };
    this.__mouseMoveHandler = function(e)
    {
        e = e || window.event;
        var x, y;
        if (e.offsetX) {
            x = e.offsetX;
            y = e.offsetY;
        }
        //else if (e.layerX) {
        else {
            x = e.layerX;
            y = e.layerY;
        }
        
        /*
        if (this.__scaleX || this.__scaleY) {
            x = Math.round(x / this.__scaleX);
            y = Math.round(y / this.__scaleY);
        }
        */
        
        if (this.__rect.contains(x, y) === false) {
            return;
        }
        
        this.__mouseX = x;
        this.__mouseY = y;
        
        this.__updateObjectUnderMouse();
        
        //mouse move events
        if (this.__objectUnderMouse) {
            this.__objectUnderMouse.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, true, false));
        }
        
        //handle startDrag
        var drag = this.__dragTarget;
        var bounds = this.__dragBounds;
        
        if (drag) {
            var newX = x - this.__dragOffsetX;
            var newY = y - this.__dragOffsetY;
            
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
            
            drag.setX(newX);
            drag.setY(newY);
        }
    };
    this.__mouseDownHandler = function(e)
    {
        e = e || window.event;
        
        //FIXED in opera and chrome we can't capture mousemove events while the contextmenu is open.
        //so without the code bellow if you right click then left click the mouse position will not be updated.
        this.__mouseMoveHandler(e);
        
        var target = this.__objectUnderMouse || this;
        //TODO fix MouseEvent arguments
        if (e.which === 1) {
            //left click
            //function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
            target.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_DOWN, true, false, 0, 0, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
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
        e = e || window.event;
        this.__mouseMoveHandler(e);
        var target = this.__objectUnderMouse || this;
        //TODO fix MouseEvent arguments
        if (e.which === 1) {
            //function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
            target.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_UP, true, false, 0, 0, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
            if (this.__mouseDownObject === target) {
                target.dispatchEvent(new MouseEvent(MouseEvent.CLICK, true, false, 0, 0, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
                
                //double click
                clearTimeout(this.__doubleClickTimer);
                if (this.__mouseClickObject === target) {
                    target.dispatchEvent(new MouseEvent(MouseEvent.DOUBLE_CLICK, true, false, 0, 0, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
                    this.__mouseClickObject = null;
                }
                else {
                    this.__mouseClickObject = target;
                    var stage = this;
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
        var target = this.__objectUnderMouse || this;
        
        var delta = 0;
        if (e.wheelDelta) { /* IE/Opera. */
                delta = e.wheelDelta/120;
                //if (cs3.core.isOpera) { delta = -delta; }
        }
        else if (e.detail) { /** Mozilla case. */
                delta = -e.detail/3;
        }
        
        if (delta) {
            //TODO MouseEvent arguments
            target.dispatchEvent(new MouseEvent(
                MouseEvent.MOUSE_WHEEL, true, false, 0, 0, null, false, false, false, false, delta));
        }
        if (this.__preventMouseWheel) {
            //disable browser scrolling
            if (e.preventDefault) { e.preventDefault(); }
            e.returnValue = false;
        }
    };
    this.__getObjectUnderPoint = function(point)
    {
        var context = this.__hiddenContext;
        context.clearRect(point.x, point.y, 1, 1);
        context.save();
        context.beginPath();
        context.rect(point.x, point.y, 1, 1);
        context.clip();
        var result = DisplayObjectContainer.prototype.__getObjectUnderPoint.call(this, context, new Matrix(), point);
        context.restore();
        return result;
    };
    this.__enterFrame = function()
    {
        if (this.__lockFrameEvent === true) {
            this.__blockedFrameEvent = true;
            return;
        }
        
        this.__lockFrameEvent = true;
        this.__blockedFrameEvent = false;
        
        //reserve next frame
        var self = this;
        clearTimeout(this.__timer);
        this.__timer = setTimeout(function(){ self.__enterFrame(); }, 1000 / this.frameRate);
        
        //resize
        //this.__resize();
        
        //run user ENTER_FRAME event code
        __applyDown(this, this.dispatchEvent, [new Event(Event.ENTER_FRAME, false, false)]);
        
        this.__update();
        
        this.__lockFrameEvent = false;
        if (this.__blockedFrameEvent === true) {
            //if block occurred during process, run the next frame right away
            ///this.__enterFrame();
            this.__timer = setTimeout(function(){ self.__enterFrame(); }, 1);
        }
    };
    this.__update = function()
    {
        if (!this.__initialized) { return; }
        var context = this.__context;
        var stageRect = this.__rect.clone();
        
        
        //render
        context.save();
        if (this.__renderMode == 'all' || this.__renderAll) {
            //force to render the entire stage
            dirtyRects = [stageRect];
            this.__renderAll = false;
        }
        else {
            //update modified objects and collect dirty rects
            for (var i = 0, l = this.__children.length; i < l; ++i)
            {
                this.__children[i].__update(new Matrix());
            }
            var dirtyRects = this.__dirtyRects;
            
            if (this.__renderMode == 'auto' && dirtyRects.length > 50) {
                dirtyRects = [stageRect];
            }
        }
        
        //clear context and clip dirty rects for rendering
        context.beginPath();
        for (i = 0, l = dirtyRects.length; i < l; ++i)
        {
            var rect = dirtyRects[i];
            context.clearRect(rect.x, rect.y, rect.width, rect.height);
            context.rect(rect.x, rect.y, rect.width, rect.height);
        }
        context.clip();
        
        this.__renderList(context, new Matrix(), new ColorTransform(), 1, dirtyRects);
        context.restore();
        
        
        //catch mouse events
        //this.__updateObjectUnderMouse();
        
        
        //debug
        if (this.showDirtyRect) {
            context.save();
            context.strokeStyle = "#FF0000";
            context.lineWidth = 1;
            context.beginPath();
            for (i = 0, l = dirtyRects.length; i < l; ++i)
            {
                rect = dirtyRects[i];
                context.rect(rect.x, rect.y, rect.width, rect.height);
            }
            context.stroke();
            context.restore();
        }
        
        //clean up
        this.__dirtyRects = [];
    };
    this.__updateObjectUnderMouse = function()
    {
        var current = this.__getObjectUnderPoint(new Point(this.__mouseX, this.__mouseY));
        var last = this.__objectUnderMouse;
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
                    //all parents fire event
                    __applyUp(last, function(event)
                    {
                        this.dispatchEvent(event);
                    }, [rollOutEvent]);
                }
                
                this.__objectUnderMouse = null;
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
                    //all parents fire event
                    __applyUp(current, function(event)
                    {
                        this.dispatchEvent(event);
                    }, [rollOverEvent]);
                }
                
                this.__objectUnderMouse = current;
            }
        }
        
        //button mode
        //TODO buttonMode should effect children to
        current = this.__objectUnderMouse;
        if (current && current.buttonMode && current.useHandCursor) {
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
            
            //TODO force top left for now
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
        this.__dragOffsetX = (lockCenter) ? 0 : this.__mouseX - target.x;
        this.__dragOffsetY = (lockCenter) ? 0 : this.__mouseY - target.y;
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
    //override
    this.getMouseX = function()
    {
        return this.__mouseX;
    };
    //override
    this.getMouseY = function()
    {
        return this.__mouseY;
    };
    this.getStageWidth = function()
    {
        return this.__rect.width;
    };
    this.getStageHeight = function()
    {
        return this.__rect.height;
    };
    this.getFrameRate = function()
    {
        return this.__frameRate;
    };
    this.setFrameRate = function(v)
    {
        this.__frameRate = v | 1;
    };
});
Stage.prototype.__defineGetter__("mouseX", Stage.prototype.getMouseX);
Stage.prototype.__defineGetter__("mouseY", Stage.prototype.getMouseY);
Stage.prototype.__defineGetter__("stageWidth", Stage.prototype.getStageWidth);
Stage.prototype.__defineGetter__("stageHeight", Stage.prototype.getStageHeight);
Stage.prototype.toString = function()
{
    return '[object Stage]';
};


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



/* flash.filters */
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
});
BitmapFilter.prototype.toString = function()
{
    return '[object BitmapFilter]';
};


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
        var rect = sourceRect.clone();
        rect.inflate(inflateX, inflateY);
        return rect;
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
});
BlurFilter.prototype.toString = function()
{
    return '[object BlurFilter]';
};


var ContextFilter = new Class(Object, function()
{
    this.__filter = function(context, target)
    {
    };
    this.clone = function()
    {
        return new ContextFilter();
    };
});
ContextFilter.prototype.toString = function()
{
    return '[object ContextFilter]';
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
    this.clone = function()
    {
        return new DropShadowFilter(this.distance, this.angle, this.color, this.alpha, this.blur);
    };
});
DropShadowFilter.prototype.toString = function()
{
    return '[object DropShadowFilter]';
};



/* flash.geom */
var ColorTransform = new Class(Object, function()
{
    this.__init__ = function(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset)
    {
        this.redMultiplier   = redMultiplier   || 1.0;
        this.greenMultiplier = greenMultiplier || 1.0;
        this.blueMultiplier  = blueMultiplier  || 1.0;
        this.alphaMultiplier = alphaMultiplier || 1.0;
        this.redOffset       = redOffset        | 0;
        this.greenOffset     = greenOffset      | 0;
        this.blueOffset      = blueOffset       | 0;
        this.alphaOffset     = alphaOffset      | 0;
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
        var a = Math.min((color >> 24 & 0xFF) * this.alphaMultiplier + this.alphaOffset, 255);
        var r = Math.min((color >> 16 & 0xFF) * this.redMultiplier + this.redOffset, 255);
        var g = Math.min((color >> 8  & 0xFF) * this.greenMultiplier + this.greenOffset, 255);
        var b = Math.min((color & 0xFF) * this.blueMultiplier + this.blueOffset, 255);
        return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    };
    this.getColor = function()
    {
        return ((this.alphaOffset << 24) | (this.redOffset << 16) | (this.greenOffset << 8) | this.blueOffset) >>> 0;
    };
    this.setColor = function(v)
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
});
ColorTransform.prototype.__defineGetter__("color", ColorTransform.prototype.getColor);
ColorTransform.prototype.__defineSetter__("color", ColorTransform.prototype.setColor);
ColorTransform.prototype.toString = function()
{
    return '(redMultiplier=' + this.redMultiplier + ', greenMultiplier=' + this.greenMultiplier +
        ', blueMultiplier=' + this.blueMultiplier + ', alphaMultiplier=' + this.alphaMultiplier +
        ', redOffset=' + this.redOffset + ', greenOffset=' + this.greenOffset +
        ', blueOffset=' + this.blueOffset + ', alphaOffset=' + this.alphaOffset + ')';
};


var Matrix = new Class(Object, function()
{
    this.__init__ = function(a, b, c, d, tx, ty)
    {
        this.a  = a  || 1;
        this.b  = b  || 0;
        this.c  = c  || 0;
        this.d  = d  || 1;
        this.tx = tx || 0;
        this.ty = ty || 0;
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
        
        var na  = 1;
        var nb  = 0;
        var nc  = 0;
        var nd  = 1;
        var ntx = 0;
        var nty = 0;

        var v01 = b;
        var v11 = d;
        var v21 = ty;

        if (a) {
            na  /= a;
            v01 /= a;
        }
        v11 -= c  * v01;
        nc  -= c  * na;
        v21 -= tx * v01;
        ntx -= tx * na;

        if (v11) {
            nc /= v11;
        }
        ntx -= v21 * nc;
        na  -= v01 * nc;

        v01 = b;
        v11 = d;
        v21 = ty;

        if (a) {
            nb  /= a;
            v01 /= a;
        }
        v11 -= c  * v01;
        nd  -= c  * nb;
        v21 -= tx * v01;
        nty -= tx * nb;

        if (v11) {
            nd /= v11;
        }
        nty -= v21 * nd;
        nb  -= v01 * nd;

        this.a  = na;
        this.b  = nb;
        this.c  = nc;
        this.d  = nd;
        this.tx = ntx;
        this.ty = nty;
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
});
Matrix.prototype.toString = function()
{
    return '(a=' + this.a + ', b=' + this.b + ', c=' + this.c + ', d=' + this.d + ', tx=' + this.tx + ', ty=' + this.ty + ')';
};


var MatrixTransformer = new Class(Object, function()
{
});
MatrixTransformer.prototype.toString = function()
{
    return '[object MatrixTransformer]';
};
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
    this.setSkewXRadians(m, skewX * 0.017453292519943295);
};
MatrixTransformer.getSkewY = function(m)
{
    return Math.atan2(m.b, m.a) * 57.29577951308232;
};
MatrixTransformer.setSkewY = function(m, skewY)
{
    this.setSkewYRadians(m, skewY * 0.017453292519943295);
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
    this.setRotationRadians(m, rotation * 0.017453292519943295);
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
        this.x = (x === undefined) ? 0 : x;
        this.y = (y === undefined) ? 0 : y;
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
    this.getLength = function()
    {
        return Math.sqrt(this._x * this._x + this._y * this._y);
    };
});
Point.prototype.__defineGetter__("length", Point.prototype.getLength);
Point.prototype.toString = function()
{
    return '(x=' + this.x + ', y=' + this.y + ')';
};
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
        this.x = x || 0;
        this.y = y || 0;
        this.width = width || 0;
        this.height = height || 0;
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
    this.getTop = function()
    {
        return this.y;
    };
    this.getRight = function()
    {
        return this.x + this.width;
    };
    this.getBottom = function()
    {
        return this.y + this.height;
    };
    this.getLeft = function()
    {
        return this.x;
    };
    this.getTopLeft = function()
    {
        return new Point(this.x, this.y);
    };
    this.setTopLeft = function(v)
    {
        this.x = v.x;
        this.y = v.y;
    };
    this.getBottomRight = function()
    {
        return new Point(this.x + this.width, this.y + this.height);
    };
    this.setBottomRight = function(v)
    {
        this.width = v.x - this.x;
        this.height = v.y - this.y;
    };
    this.getSize = function()
    {
        return new Point(this.width, this.height);
    };
    this.setSize = function(v)
    {
        this.width = v.x;
        this.height = v.y;
    };
});
Rectangle.prototype.__defineGetter__("top", Rectangle.prototype.getTop);
Rectangle.prototype.__defineGetter__("right", Rectangle.prototype.getRight);
Rectangle.prototype.__defineGetter__("bottom", Rectangle.prototype.getBottom);
Rectangle.prototype.__defineGetter__("left", Rectangle.prototype.getLeft);
Rectangle.prototype.__defineGetter__("topLeft", Rectangle.prototype.getTopLeft);
Rectangle.prototype.__defineSetter__("topLeft", Rectangle.prototype.setTopLeft);
Rectangle.prototype.__defineGetter__("bottomRight", Rectangle.prototype.getBottomRight);
Rectangle.prototype.__defineSetter__("bottomRight", Rectangle.prototype.setBottomRight);
Rectangle.prototype.__defineGetter__("size", Rectangle.prototype.getSize);
Rectangle.prototype.__defineSetter__("size", Rectangle.prototype.setSize);
Rectangle.prototype.toString = function()
{
    return '(x=' + this.x + ', y=' + this.y + ', w=' + this.width + ', h=' + this.height + ')';
};


var Transform = new Class(Object, function()
{
    this.__init__ = function()
    {
        this.__target = null;
        //this.__concatenatedMatrix = null;
        this.__colorTransform = new ColorTransform();
        this.__matrix = new Matrix();
        //this.__pixelBounds = new Rectangle(0, 0, 0, 0);
        this.__modified = true;
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
        return MatrixTransformer.getRotation(this.__matrix);
    };
    this.__setRotation = function(v)
    {
        MatrixTransformer.setRotation(this.__matrix, v);
        this.__modified = true;
    };
    this.__getScaleX = function()
    {
        return MatrixTransformer.getScaleX(this.__matrix);
    };
    this.__setScaleX = function(v)
    {
        MatrixTransformer.setScaleX(this.__matrix, v);
        this.__modified = true;
    };
    this.__getScaleY = function()
    {
        return MatrixTransformer.getScaleY(this.__matrix);
    };
    this.__setScaleY = function(v)
    {
        MatrixTransformer.setScaleY(this.__matrix, v);
        this.__modified = true;
    };
    
    /* getters and setters */
    this.getConcatenatedColorTransform = function()
    {
        if (this.__target && this.__target.__parent) {
            var c = this.__colorTransform.clone();
            c.concat(this.__target.__parent.__transform.getConcatenatedColorTransform());
            return c;
        }
        else {
            return this.__colorTransform.clone();
        }
    };
    this.getColorTransform = function()
    {
        return this.__colorTransform.clone();
    };
    this.setColorTransform = function(v)
    {
        this.__colorTransform = v.clone();
        this.__modified = true;
    };
    this.getConcatenatedMatrix = function()
    {
        if (this.__target && this.__target.__parent) {
            var m = this.__matrix.clone();
            m.concat(this.__target.__parent.__transform.getConcatenatedMatrix());
            return m;
        }
        else {
            return this.__matrix.clone();
        }
    };
    this.getMatrix = function()
    {
        return this.__matrix.clone();
    };
    this.setMatrix = function(v)
    {
        this.__matrix = v.clone();
        this.__modified = true;
    };
    this.getPixelBounds = function()
    {
        return new Rectangle();//TODO
    };
});
Transform.prototype.__defineGetter__("concatenatedColorTransform", Transform.prototype.getConcatenatedColorTransform);
Transform.prototype.__defineGetter__("colorTransform", Transform.prototype.getColorTransform);
Transform.prototype.__defineSetter__("colorTransform", Transform.prototype.setColorTransform);
Transform.prototype.__defineGetter__("concatenatedMatrix", Transform.prototype.getConcatenatedMatrix);
Transform.prototype.__defineGetter__("matrix", Transform.prototype.getMatrix);
Transform.prototype.__defineSetter__("matrix", Transform.prototype.setMatrix);
Transform.prototype.__defineGetter__("pixelBounds", Transform.prototype.getPixelBounds);
Transform.prototype.toString = function()
{
    return '[object Transform]';
};



/* flash.media */
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
            source.src = request.url;
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
    this.getLength = function()
    {
        if (this.__media) {
            return this.__media.duration;
        }
        return 0;
    };
    this.getPosition = function()
    {
        if (this.__media) {
            return this.__media.currentTime;
        }
        return 0;
    };
    this.getUrl = function()
    {
        return this.__url;
    };
    this.getVolume = function()
    {
        return this.__volume;
    };
    this.setVolume = function(v)
    {
        this.__volume = v;
        if (this.__media) {
            this.__media.volume = v;
        }
    };
});
Sound.prototype.__defineGetter__("length", Sound.prototype.getLength);
Sound.prototype.__defineGetter__("position", Sound.prototype.getPosition);
Sound.prototype.__defineGetter__("volume", Sound.prototype.getVolume);
Sound.prototype.__defineSetter__("volume", Sound.prototype.setVolume);
Sound.prototype.__defineGetter__("url", Sound.prototype.getUrl);
Sound.prototype.toString = function()
{
    return '[object Sound]';
};


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
    this.__getContentRect = function()
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
        return this.__modified || this.__transform.__modified;
    };
    //override
    this.__setModified = function(v)
    {
        this.__modified = v;
    };
    //override
    this.__render = function(context, matrix, color, rects)
    {
        if (this.__media) {
            try {
                context.drawImage(this.__media, 0, 0);
            }catch(e){}
        }
    };
    //override
    this.__renderPoint = function(context, matrix, point)
    {
        if (this.__media) {
            var selfRect = this.__getContentRect();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (selfRect.containsPoint(localPoint)) {
                context.drawImage(this.__media, localPoint.x, localPoint.y, 1, 1, localPoint.x, localPoint.y, 1, 1);
            }
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
            source.src = request.url;
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
        /*
        cs3.utils.addEventListener(media, 'loadedmetadata', function(e)
        {
            var params = {
                duration: media.duration,
                width: media.videoWidth,
                height: media.videoHeight
            };
            self.onMetaData(params);
        });
        cs3.utils.addEventListener(media, 'durationchange', function(e)
        {
            self.onDurationChange();
        });
        cs3.utils.addEventListener(media, 'progress', function(e)
        {
            trace("progress");
        });
        cs3.utils.addEventListener(media, 'timeupdate', function(e)
        {
            self.onTimeUpdate();
        });
        cs3.utils.addEventListener(media, 'canplay', function(e)
        {
            self.onCanPlay();
        });
        cs3.utils.addEventListener(media, 'ended', function(e)
        {
            self.onEnded();
        });
        cs3.utils.addEventListener(media, 'error', function(e)
        {
            self.onError();
        });
        */
        
        /*
        var lastState = null;
        setInterval(function(t){
            if (media.readyState !== lastState) {
                lastState = media.readyState;
                trace("readyState: " + lastState);
                if (lastState == media.HAVE_ENOUGH_DATA) {
                    clearInterval(t);
                }
            }
        }, 20);
        */
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
    this.getLength = function()
    {
        if (this.__media) {
            return this.__media.duration;
        }
        return 0;
    };
    this.getPosition = function()
    {
        if (this.__media) {
            return this.__media.currentTime;
        }
        return 0;
    };
    this.getUrl = function()
    {
        return this.__url;
    };
    this.getVolume = function()
    {
        return this.__volume;
    };
    this.setVolume = function(v)
    {
        this.__volume = v;
        if (this.__media) {
            this.__media.volume = v;
        }
    };
    /*
    this.onCanPlay = function(){};
    this.onDurationChange = function(){};
    this.onEnded = function(){};
    this.onError = function(){};
    this.onMetaData = function(params){};
    this.onTimeUpdate = function(){};
    */
});
Video.prototype.__defineGetter__("length", Video.prototype.getLength);
Video.prototype.__defineGetter__("position", Video.prototype.getPosition);
Video.prototype.__defineGetter__("volume", Video.prototype.getVolume);
Video.prototype.__defineSetter__("volume", Video.prototype.setVolume);
Video.prototype.__defineGetter__("url", Video.prototype.getUrl);
Video.prototype.toString = function()
{
    return '[object Video]';
};



/* flash.net */
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
        
        if (this.dataFormat == URLLoaderDataFormat.BINARY) {
            throw new Error("URLLoaderDataFormat.BINARY is not supported");
        }
        
        this.__request.open('GET', request.url, true);
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
                            throw new TypeError("XML パーサエラー :文書の形式が正しくありません。");
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
            }
        };
        this.__request.send(null);
    };
});
URLLoader.prototype.toString = function()
{
    return '[object URLLoader]';
};


var URLLoaderDataFormat = new Class();
URLLoaderDataFormat.prototype.toString = function()
{
    return '[object URLLoaderDataFormat]';
};
URLLoaderDataFormat.BINARY = 'binary';
URLLoaderDataFormat.TEXT = 'text';
URLLoaderDataFormat.XML = 'xml';
URLLoaderDataFormat.JSON = 'json';
URLLoaderDataFormat.VARIABLES = 'variables';


var URLRequest = new Class(Object, function()
{
    this.__init__ = function(url)
    {
        this.url = url || null;
    };
});
URLRequest.prototype.toString = function()
{
    return '[object URLRequest]';
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
                throw new Error('URLVariables.decode() に渡される文字列は、名前/値のペアを含む、URL エンコーディングされたクエリー文字列でなければなりません。');
            }
            
            var p = s.split('=', 2);
            
            if (this.hasOwnProperty(p[0])) {
                throw new ReferenceError('URLVariables のメソッド ' + p[0] + ' に代入できません。');
            }
            
            this[p[0]] = decodeURIComponent(p[1]);
        }
    };
});
URLVariables.prototype.toString = function()
{
    var pairs = [];
    for (var p in this)
    {
        if (p != 'decode' && p != 'toString') {
            pairs.push(p + '=' + encodeURIComponent(this[p]));
        }
    }
    return pairs.join('&');
};


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



/* flash.text */
var TextField = new Class(InteractiveObject, function()
{
    this.__init__ = function()
    {
        InteractiveObject.call(this);
        this.__buffer = [];
        this.__textWidth = 0;
        this.__textHeight = 0;
        this.__defaultTextFormat = new TextFormat();
        
        this.background = false;
        this.backgroundColor = 0xFFFFFF;
        this.border = false;
        this.borderColor = 0;
    };
    //override
    this.__getContentRect = function()
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
    //override
    this.__render = function(context, matrix, color, rects)
    {
        var rect = this.__getContentRect();
        
        //convert local rect to global coords
        var globalRect = matrix.transformRect(rect);
        
        //hit test
        var doRender = false;
        for (var i = 0, l = rects.length; i < l; ++i)
        {
            if (globalRect.intersects(rects[i])) {
                doRender = true;
                break;
            }
        }
        if (!doRender) {
            return;
        }
        
        //render
        var buffer = this.__buffer;
        var format = this.__defaultTextFormat;
        var lineHeight = format.size + format.leading;
        var lineWidth = this.__textWidth;
        
        //add 1px margin on each side
        var offsetX = 1;
        var offsetY = 1;
        if (this.border) {
            //shift the margin 1px more
            offsetX = 2;
            offsetY = 2;
            
            //border changes the rect size
            context.fillStyle = __toRGB(this.borderColor);
            context.beginPath();
            context.rect(0, 0, rect.width, rect.height);
            //do not use stroke for borders because for some reason
            //the lines will not become solid(maybe in Chrome only)
            context.fill();
            
            context.beginPath();
            context.rect(1, 1, rect.width - 2, rect.height - 2);
        }
        else {
            context.beginPath();
            context.rect(0, 0, rect.width, rect.height);
        }
        
        if (this.background) {
            context.fillStyle = __toRGB(this.backgroundColor);
            context.fill();
        }
        
        context.clip();
        context.fillStyle = __toRGB(format.color);
        
        var align = format.align;
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
        
        var font = (format.italic) ? "italic " : "";
        font += (format.bold) ? "bold " : "";
        font += format.size + "px '" + format.font + "'";
        
        context.font = font;
        context.textBaseline = 'top';
        
        if (align == TextFormatAlign.JUSTIFY) {
            //TODO need a better algorithm
            for (i = 0, l = buffer.length; i < l; ++i)
            {
                var row = buffer[i];
                var rowLength = row.length;
                var perChar = lineWidth / rowLength;
                for (var ii = 0; ii < rowLength; ++ii)
                {
                    context.fillText(row[ii], offsetX + perChar * ii, offsetY + i * lineHeight);
                }
                
            }
        }
        else {
            for (i = 0, l = buffer.length; i < l; ++i)
            {
                context.fillText(buffer[i], offsetX, offsetY + i * lineHeight);
            }
        }
    };
    //override
    this.__renderPoint = function(context, matrix, point)
    {
        var rect = this.__getContentRect();
        
        //convert local rect to global coords
        var globalRect = matrix.transformRect(rect);
        
        if (globalRect.containsPoint(point)) {
            context.beginPath();
            context.rect(0, 0, rect.width, rect.height);
            context.fill();
        }
    };
    /**
     * update width and height and set modified flag to TRUE
     */
    this.__updateRect = function()
    {
        var context = cs3.core.testContext;
        var width = 0;
        var height = 0;
        var buffer = this.__buffer;
        var format = this.__defaultTextFormat;
        var lineHeight = format.size + format.leading;
        
        var font = (format.italic) ? "italic " : "";
        font += (format.bold) ? "bold " : "";
        font += format.size + "px '" + format.font + "'";
        
        context.font = font;
        for (var i = 0, l = buffer.length; i < l; ++i)
        {
            var testWidth = context.measureText(buffer[i]).width;
            width = (testWidth > width) ? testWidth : width;
            height += lineHeight;
        }
        
        this.__textWidth = width + 2;//add 1px margin on each side
        this.__textHeight = height + 2;
        this.__modified = true;
    };
    
    /* getters and setters */
    this.getText = function()
    {
        return this.__buffer.join("\n");
    };
    this.setText = function(v)
    {
        v = v.replace(/\r\n/gim, "\n");
        v = v.replace(/\r/gim, "\n");
        this.__buffer = v.split("\n");
        this.__updateRect();
    };
    this.getDefaultTextFormat = function()
    {
        //TODO clone it
        return this.__defaultTextFormat;
    };
    this.setDefaultTextFormat = function(v)
    {
        this.__defaultTextFormat = v;
        this.__updateRect();
    };
});


var TextFormat = new Class(Object, function()
{
    this.__init__ = function()
    {
        this.align = TextFormatAlign.LEFT;
        this.bold = false;
        this.color = 0;
        this.font = "Times New Roman";
        this.italic = false;
        this.leading = 0;
        this.size = 24;
    };
});


var TextFormatAlign = {
    CENTER: 'center',
    JUSTIFY: 'justify',
    LEFT: 'left',
    RIGHT: 'right'
};
