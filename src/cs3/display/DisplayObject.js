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
            this.__render(context, new ColorTransform());
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
    
    this.__applyContextFilters = function(context)
    {
        var filters = this.__filters;
        for (var i = 0, l = filters.length; i < l; ++i)
        {
            if (filters[i] instanceof ContextFilter) {
                filters[i].__filter(context, this);
            }
        }
    };
    
    this.__applyMask = function()
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
        //var deltaMatrix = matrix.clone();
        var deltaMatrix = this.__transform.__get__concatenatedMatrix();
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
        maskBitmapData.__render(bitmapDataContext, null);
        bitmapDataContext.restore();
    };
    
    this.__render = function(context, colorTransform)
    {
        if (this.__filters.length) {
            this.__applyContextFilters(context);
        }
        if (this.__mask) {
            this.__applyMask();
        }
        
        if (this.__cache) {
            this.__cache.__render(context, colorTransform);
        }
        else {
            this.__render(context, colorTransform);
        }
    };
    
    this.__update = function(matrix, forceUpdate, summary)
    {
        summary.total++;
        
        if (forceUpdate || this.__getModified()) {
            summary.modified++;
            
            // collect redraw regions
            var redrawRegions = this.__stage.__redrawRegions;
            var globalBounds = matrix.transformRect(this.__getContentBounds());
            var lastGlobalBounds = this.__globalBounds;
            
            redrawRegions[redrawRegions.length] = globalBounds;
            if (lastGlobalBounds) {
                redrawRegions[redrawRegions.length] = lastGlobalBounds;
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
