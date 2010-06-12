var DisplayObjectContainer = new Class(InteractiveObject, function()
{
    this.__init__ = function() {
        InteractiveObject.call(this);
        this.__children = [];
        this.mouseChildren = true;
        //this.tabChildren = true;
    };
    //override
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
    //override
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
    //override
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
        
        return DisplayObject.prototype.__getObjectUnderPoint.call(this, context, matrix, point);
    };
    //override
    /**
     * NOTE: argument matrix and alpha is already applied to context
     * NOTE: argument matrix already contains self local matrix
     */
    this.__renderList = function(context, matrix, colorTransform)
    {
        var i, l;
        //apply ContextFilter's
        var filters = this.__filters;
        for (i = 0, l = filters.length; i < l; ++i)
        {
            if (filters[i] instanceof ContextFilter) {
                filters[i].__filter(context, this);
            }
        }
        
        this.__render(context, matrix, colorTransform);
        
        var globalAlpha = context.globalAlpha;
        var children = this.__children;
        for (i = 0, l = children.length; i < l; ++i)
        {
            var child = children[i];
            if (child.__visible === false) { continue; }
            if (child.__maskee !== null) { continue; }
            
            var childMatrix = child.__transform.__matrix.clone();
            childMatrix.concat(matrix);
            var childColor = child.__transform.__colorTransform.clone();
            childColor.concat(colorTransform);
            
            context.globalAlpha = globalAlpha * child.__alpha;
            context.setTransform(childMatrix.a, childMatrix.b, childMatrix.c, childMatrix.d, childMatrix.tx, childMatrix.ty);
            
            /*
            if (child.__cache) {
                child.__cache.__render(context, childMatrix, childColor);
                continue;
            }
            */
            
            /*** experimental ***/
            if (child.__mask) {
                var childBitmap = child.__getAsBitmap();
                if (!childBitmap) {
                    //child content is empty so we don't need to apply a mask
                    continue;
                }
                var mask = child.__mask;
                var maskBitmap = mask.__getAsBitmap();
                if (!maskBitmap) {
                    //mask content is empty so we don't need to render the child
                    continue;
                }
                
                var childBitmapData = childBitmap.__bitmapData;
                var maskBitmapData = maskBitmap.__bitmapData;
                
                //create another bitmap to apply the mask
                if (child.__cache) {
                    //if it already exists, reuse it
                    child.__cache.__bitmapData.__resize(childBitmapData.__width, childBitmapData.__height);
                    child.__cache.__bitmapData.__context.drawImage(childBitmapData.__canvas, 0, 0);
                    child.__cache.setX(childBitmap.getX());
                    child.__cache.setY(childBitmap.getY());
                }
                else {
                    //create a new bitmap
                    child.__cache = new Bitmap(childBitmapData.clone());
                    child.__cache.setX(childBitmap.getX());
                    child.__cache.setY(childBitmap.getY());
                }
                
                var bitmap = child.__cache;
                var bitmapData = bitmap.__bitmapData;
                var bitmapDataContext = bitmapData.__context;
                
                //create the mask's matrix
                var maskMatrix = mask.__transform.getConcatenatedMatrix();
                var deltaMatrix = childMatrix.clone();
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
                
                //render the bitmapData to the stage context
                bitmapData.__render(context, childMatrix, childColor);
                
                //cache the masked bitmapData
                //child.__cache = bitmapData;
                continue;
            }
            
            child.__renderList(context, childMatrix, childColor);
        }
    };
    //override
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
            child.__updateList(childMatrix);
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
        
        //add redraw regions
        child.__setModified(true);
        child.__updateList(child.__transform.getConcatenatedMatrix());
        
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
