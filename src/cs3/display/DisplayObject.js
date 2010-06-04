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
        this.__globalBounds = null;
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
        return this.__getContentBounds();
    };
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
        var bounds = matrix.transformRect(this.__getContentBounds());
        if (bounds.containsPoint(point)) {
            context.save();
            //context.clearRect(point.x, point.y, 1, 1);
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
    };
    this.__renderPoint = function(context, matrix, point)
    {
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
            var globalBounds = matrix.transformRect(this.__getContentBounds());
            
            //collect dirty rects
            this.__stage.__addDirtyRect(globalBounds);
            if (this.__globalBounds) {
                this.__stage.__addDirtyRect(this.__globalBounds);
            }
            this.__globalBounds = globalBounds;
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
        
        //tansform your global bounds to targets local bounds
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
        if (shapeFlag === false) {
            var globalBounds = this.__transform.getConcatenatedMatrix().transformRect(this.__getBounds());
            return globalBounds.contains(x, y);
        }
        else {
            if (!this.__stage) {
                //if shape flag is true and object is not addet to the stage
                //always returns false;
                return false;
            }
            
            var context = this.__stage.__hiddenContext;
            var matrix = this.__transform.getConcatenatedMatrix();
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
