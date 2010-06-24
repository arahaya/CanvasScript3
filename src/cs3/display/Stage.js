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
        
        if (this.canvas.__stage) {
            //stage already exists
            this.canvas.__stage.__destroy();
        }
        
        this.__context = cs3.utils.getContext2d(this.canvas);
        this.__hiddenCanvas = cs3.utils.createCanvas(0, 0);
        this.__hiddenContext = cs3.utils.getContext2d(this.__hiddenCanvas);
        
        this.canvas.__stage = this;
        this.canvas.width = this.canvas.width;// clear the current content
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
    
    this.__destroy = function()
    {
        //call children REMOVED_FROM_STAGE events
        __applyDown(this, function(stage, event)
        {
            this.__stage = this.__root = null;
            this.dispatchEvent(event);
        }, [this, new Event(Event.REMOVED_FROM_STAGE, false, false)]);
        
        clearTimeout(this.__keyPressTimer);
        clearTimeout(this.__timer);
        cs3.core.removeStage(this);
    };
    
    this.__focusHandler = function(e)
    {
        var stage = e.target.__stage;
    };
    
    this.__blurHandler = function(e)
    {
        var stage = e.target.__stage;
    };
    
    this.__keyDownHandler = function(e)
    {
        var stage = e.target.__stage;
        
        clearTimeout(stage.__keyPressTimer);
        stage.__isKeyDown = true;
        
        if (cs3.core.isOpera) {
            stage.__keyPressTimer = setTimeout(function(){ stage.__keyPressHandler(e); }, 500);
        }
        
        var keyCode = e.keyCode;
        var charCode = e.charCode;//todo
        var keyLocation = 0;//not supported
        stage.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_DOWN, true, false, charCode, keyCode, keyLocation, e.ctrlKey, e.altKey, e.shiftKey));
        
        if (stage.__preventTabKey && keyCode === 9) {
            //disable tab focusing
            if (e.preventDefault) { e.preventDefault(); }
            e.returnValue = false;
        }
    };
    
    this.__keyPressHandler = function(e)
    {
        var stage = this;
        
        clearTimeout(stage.__keyPressTimer);
        if (!stage.__isKeyDown) { return; }
        
        stage.__keyDownHandler(e);
        
        if (cs3.core.isOpera) {
            stage.__keyPressTimer = setTimeout(function(){ stage.__keyPressHandler(e); }, 33);
        }
    };
    
    this.__keyUpHandler = function(e)
    {
        var stage = e.target.__stage;
        
        stage.__isKeyDown = false;
        clearTimeout(stage.__keyPressTimer);
        
        var keyCode = e.keyCode;
        var charCode = e.charCode;//todo
        var keyLocation = 0;//not supported
        stage.dispatchEvent(new KeyboardEvent(KeyboardEvent.KEY_UP, true, false, charCode, keyCode, keyLocation, e.ctrlKey, e.altKey, e.shiftKey));
    };
    
    this.__mouseMoveHandler = function(e)
    {
        var stage = this;
        var canvas = stage.canvas;
        
        //get the absolute position of the canvas
        var element = canvas;
        var offsetLeft = 0;
        var offsetTop  = 0;
        while (element)
        {
            offsetLeft += element.offsetLeft;
            offsetTop  += element.offsetTop;
            element = element.offsetParent;
        }
        
        var x = e.pageX - offsetLeft;
        var y = e.pageY - offsetTop;
        
        /*
        if (this.__scaleX || this.__scaleY) {
            x = Math.round(x / this.__scaleX);
            y = Math.round(y / this.__scaleY);
        }
        */
        
        if (x === stage.__mouseX && y === stage.__mouseY) {
            return;
        }
        
        
        
        // mouse move events
        stage.__mouseOverStage = false;
        if (stage.__rect.contains(x, y) === true) {
            stage.__mouseX = x;
            stage.__mouseY = y;
            stage.__mouseOverStage = true;
            stage.__updateObjectUnderMouse();
            
            if (stage.__objectUnderMouse) {
                stage.__objectUnderMouse.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, true, false));
            }
            else {
                //if there is no abject under the mouse point,
                //stage's mousemove event gets called
                stage.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, true, false));
            }
        }
        else if (stage.__mouseDownObject) {
            //if the mouse is out of the stage but the mouse is down
            //stage's mousemove event gets called
            stage.__mouseX = x;
            stage.__mouseY = y;
            stage.__objectUnderMouse = null;
            stage.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_MOVE, true, false));
        }
        else {
            //mouse is out of the stage and mouse is not down
            stage.__objectUnderMouse = null;
            return;
        }
        
        
        //handle startDrag
        var target = stage.__dragTarget;
        if (target) {
            var newX = x - stage.__dragOffsetX;
            var newY = y - stage.__dragOffsetY;
            var bounds = stage.__dragBounds;
            
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
        var stage = this;
        
        //FIXED in opera and chrome we can't capture mousemove events while the contextmenu is open.
        //so without the code bellow if you right click then left click, the mouse position will not be updated.
        stage.__mouseMoveHandler(e);
        
        var target = stage.__objectUnderMouse;
        if (!target) { return; }
        
        if (e.which === 1) {
            //left click
            //function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
            target.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_DOWN, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
            stage.__mouseDownObject = target;
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
        var stage = this;
        
        stage.__mouseMoveHandler(e);
        
        var target = stage.__objectUnderMouse;
        if (!target) {
            if (stage.__mouseDownObject) {
                target = stage;
            }
            else {
                return;
            }
        }
        
        if (e.which === 1) {
            //function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
            target.dispatchEvent(new MouseEvent(MouseEvent.MOUSE_UP, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
            if (stage.__mouseDownObject === target) {
                target.dispatchEvent(new MouseEvent(MouseEvent.CLICK, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
                
                //double click
                clearTimeout(stage.__doubleClickTimer);
                if (stage.__mouseClickObject === target) {
                    target.dispatchEvent(new MouseEvent(MouseEvent.DOUBLE_CLICK, true, false, null, null, null, e.ctrlKey, e.altKey, e.shiftKey, false, 0));
                    stage.__mouseClickObject = null;
                }
                else {
                    stage.__mouseClickObject = target;
                    stage.__doubleClickTimer = setTimeout(function(){ stage.__mouseClickObject = null; }, 500);
                }
            }
            stage.__mouseDownObject = null;
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
        var stage = e.target.__stage;
        var target = stage.__objectUnderMouse;
        
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
        if (stage.__preventMouseWheel) {
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
        // reserve next frame
        var self = this;
        clearTimeout(this.__timer);
        this.__timer = setTimeout(function(){ self.__enterFrame(); }, 1000 / this.__frameRate);
        
        // run user ENTER_FRAME event code
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
            
            render.call(child, context, childColor);
        }
    };
    
    /* @override DisplayObjectContainer */
    this.__update = function(matrix, forceUpdate, summary)
    {
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            var childMatrix = child.__transform.__matrix.clone();
            child.__update(childMatrix, forceUpdate, summary);
        }
    };
    
    this.__updateStage = function()
    {
        if (!this.__initialized) { return; }
        var context = this.__context;
        
        // update the display list
        var summary = {total:0, modified:0};
        this.__update(new Matrix(), false, summary);
        var redrawRegions = this.__redrawRegions;
        var redrawRegionsLength = redrawRegions.length;
        var renderAll = this.__renderAll;
        var renderMode = this.__renderMode;
        
        if (redrawRegionsLength) {
            // render required
            var stageRect = this.__rect;
            var i;
            
            // render mode
            if (!renderAll && renderMode == StageRenderMode.AUTO) {
                // TODO: better algorithm to detect the appropriate render mode
                renderAll = (redrawRegionsLength > 50 || (summary.modified / summary.total) > 0.7);
            }
            
            if (renderAll || renderMode == StageRenderMode.ALL) {
                // render the entire stage
                context.save();
                context.clearRect(stageRect.x, stageRect.y, stageRect.width, stageRect.height);
                this.__render(context);
                context.restore();
            }
            else {
                // optimize the redraw regions
                var temp = [];
                var tempLength = 0;
                
                for (i = 0; i < redrawRegionsLength; ++i)
                {
                    var rect = redrawRegions[i].clone();
                    if (rect.width <= 0 || rect.height <= 0) { continue; }
                    
                    //only add parts inside of the stage rect
                    if (!stageRect.containsRect(rect)) {
                        if (!stageRect.intersects(rect)) {
                            continue;
                        }
                        
                        // TODO: optimize here
                        rect = stageRect.intersection(rect);
                    }
                    
                    //convert float's to int's
                    var x = rect.x, y = rect.y, nx = Math.floor(x), ny = Math.floor(y);
                    rect.x = nx;
                    rect.y = ny;
                    rect.width = (rect.width + (x - nx) + 1) | 0;
                    rect.height = (rect.height + (y - ny) + 1) | 0;
                    
                    // union to existing rect if necessary
                    var ti = tempLength;
                    var addRect = true;
                    while (ti--)
                    {
                        var rect2 = temp[ti];
                        if (rect2.intersects(rect)) {
                            //var intersection = region.intersection(rect);
                            //if (intersection.width * intersection.height > rect.width * rect.height / 5) {
                                temp[ti] = rect2.union(rect);
                                addRect = false;
                                break;
                            //}
                        }
                    }
                    
                    if (addRect) { temp[tempLength++] = rect; }
                }
                
                redrawRegions = temp;
                redrawRegionsLength = tempLength;
                
                // clear and clip the redraw regions.
                context.save();
                context.beginPath();
                
                for (i = 0; i < redrawRegionsLength; ++i)
                {
                    rect = redrawRegions[i];
                    context.clearRect(rect.x, rect.y, rect.width, rect.height);
                    context.rect(rect.x, rect.y, rect.width, rect.height);
                }
                
                context.clip();
                this.__render(context);
                context.restore();
                
                // debug
                if (this.showRedrawRegions) {
                    context.save();
                    context.strokeStyle = "#FF0000";
                    context.lineWidth = 1;
                    context.beginPath();
                    for (i = 0; i < redrawRegionsLength; ++i)
                    {
                        rect = redrawRegions[i];
                        context.rect(rect.x, rect.y, rect.width, rect.height);
                    }
                    context.stroke();
                    context.restore();
                }
            }
            
            // catch mouse events
            this.__updateObjectUnderMouse();
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
            target.__set__x(target.__get__x() + localPoint.x);
            target.__set__y(target.__get__y() + localPoint.y);
        }
        this.__dragOffsetX = this.__mouseX - target.__get__x();
        this.__dragOffsetY = this.__mouseY - target.__get__y();
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
    
    this.__get__preventMouseWheel = function(v)
    {
        return this.__preventMouseWheel;
    };
    
    this.__set__preventMouseWheel = function(v)
    {
        this.__preventMouseWheel = v;
    };
    
    this.__get__preventTabKey = function(v)
    {
        return this.__preventTabKey;
    };
    
    this.__set__preventTabKey = function(v)
    {
        this.__preventTabKey = v;
    };
    
    this.toString = function()
    {
        return '[object Stage]';
    };
});
