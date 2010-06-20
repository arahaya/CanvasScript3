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
