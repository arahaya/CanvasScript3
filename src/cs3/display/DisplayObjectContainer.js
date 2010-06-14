var DisplayObjectContainer = new Class(InteractiveObject, function()
{
    this.__init__ = function()
    {
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
        
        context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        if (this.__hitTestPoint(context, matrix, point)) {
            return this;
        }
        return null;
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
    /**
     * NOTE: argument matrix and alpha is already applied to context
     * NOTE: argument matrix already contains self local matrix
     */
    this.__renderChildren = function(context, matrix, colorTransform)
    {
        var alpha = context.globalAlpha;
        var children = this.__children;
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
            
            child.__applyContextFilters(context, matrix, colorTransform);
            child.__applyMask(context, matrix, colorTransform);
            
            if (child.__cache) {
                child.__cache.__render(context, childMatrix, childColor);
            }
            else {
                child.__render(context, childMatrix, childColor);
            }
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
