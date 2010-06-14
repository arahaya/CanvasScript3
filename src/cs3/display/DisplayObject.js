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
            bitmap.setX(bounds.x);
            bitmap.setY(bounds.y);
        }
        
        //TODO: check if the bitmap needs to be rendered
        //always true for now
        var render = false;
        if (true) {
            render = true;
        }
        
        if (render) {
            //update the position
            bitmap.setX(bounds.x);
            bitmap.setY(bounds.y);
            
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
     * Bounds of your entire display list
     */
    this.__getBounds = function()
    {
        return this.__getContentBounds();
    };
    /**
     * Bounds of yourself only
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
        return this.__modified || this.__transform.__modified;
    };
    this.__setModified = function(v)
    {
        this.__modified = v;
        this.__transform.__modified = v;
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
        if (this.__mask) {
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
            var maskMatrix = mask.__transform.getConcatenatedMatrix();
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
        }
    };
    this.__render = function(context, matrix, colorTransform)
    {
    };
    this.__update = function(matrix)
    {
    };
    this.__updateList = function(matrix)
    {
        //this.__update();
        var modified = this.__getModified();
        if (modified) {
            var globalBounds = matrix.transformRect(this.__getContentBounds());
            
            //collect redraw regions
            this.__stage.__addRedrawRegion(globalBounds);
            if (this.__globalBounds) {
                this.__stage.__addRedrawRegion(this.__globalBounds);
            }
            this.__globalBounds = globalBounds;
        }
        
        //reset modification
        this.__setModified(false);
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
        
        var globalBounds = this.__transform.getConcatenatedMatrix().transformRect(bounds);
        if (targetCoordinateSpace === this.__root) {
            //if the target is your root, global coords is wat you want
            return globalBounds;
        }
        
        //tansform your global bounds to targets local bounds
        var targetMatrix = targetCoordinateSpace.__transform.getConcatenatedMatrix();
        targetMatrix.invert();
        return targetMatrix.transformRect(globalBounds);
    };
    this.getRect = function(targetCoordinateSpace)
    {
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
        if (shapeFlag === false) {
            var globalBounds = this.__transform.getConcatenatedMatrix().transformRect(this.__getBounds());
            return globalBounds.contains(x, y);
        }
        else {
            if (!this.__stage) {
                //if shape flag is true and object is not addet to the stage
                //always return false;
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
    this.setName = function(name)
    {
        this.__name = name;
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
    this.getMask = function()
    {
        return this.__mask;
    };
    this.setMask = function(v)
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
DisplayObject.prototype.__defineGetter__("mask", DisplayObject.prototype.getMask);
DisplayObject.prototype.__defineSetter__("mask", DisplayObject.prototype.setMask);
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
