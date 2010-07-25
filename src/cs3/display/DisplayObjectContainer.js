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
            if (child.__visible) 
            {
                var childMatrix = child.__transform.__matrix.clone();
                childMatrix.concat(matrix);
                var result = child.__getObjectUnderPoint(context, childMatrix, point);
                if (result) 
                {
                    return result;
                }
            }
        }
        
        context.setTransform(matrix.a, matrix.b, matrix.c, matrix.d, matrix.tx, matrix.ty);
        if (this.__hitTestPoint(context, matrix, point)) 
        {
            return this;
        }
        return null;
    };
    
    /* @override DisplayObject.__update */
    this.__update = function(matrix, forceUpdate, summary)
    {
        summary.total++;
        
        var update = forceUpdate || this.__getModified();
        
        // update children first
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i) 
        {
            var child = children[i];
            var childMatrix = child.__transform.__matrix.clone();
            childMatrix.concat(matrix);
            child.__update(childMatrix, update, summary);
        }
        
        // update your self
        if (update) 
        {
            summary.modified++;
            
            // collect redraw regions
            var redrawRegions = this.__stage.__redrawRegions;
            var globalBounds = matrix.transformRect(this.__getContentBounds());
            var lastGlobalBounds = this.__globalBounds;
            
            redrawRegions[redrawRegions.length] = globalBounds;
            if (lastGlobalBounds) 
            {
                redrawRegions[redrawRegions.length] = lastGlobalBounds;
            }
            
            // save the global bounds for the next update
            this.__globalBounds = globalBounds;
            
            // reset modification
            this.__setModified(false);
        }
    };
    
    this.__renderChildren = function(context, colorTransform)
    {
        var children = this.__children;
        var render = DisplayObject.prototype.__render;
        for (var i = 0, l = children.length; i < l; ++i) 
        {
            var child = children[i];
            
            if (child.__visible === false) 
            {
                continue;
            }
            if (child.__maskee !== null) 
            {
                continue;
            }
            
            var childMatrix = child.__transform.__matrix;
            var childColor = child.__transform.__colorTransform.clone();
            childColor.concat(colorTransform);
            
            context.save();
            context.globalAlpha *= child.__alpha;
            context.transform(childMatrix.a, childMatrix.b, childMatrix.c, childMatrix.d, childMatrix.tx, childMatrix.ty);
            
            render.call(child, context, childColor);
            
            context.restore();
        }
    };
    
    this.__addChildAt = function(child, index)
    {
        if (!(child instanceof DisplayObject)) 
        {
            throw new ArgumentError("child is not a DisplayObject");
        }
        if (child.__parent === this) 
        {
            return;
        }
        if (child.__parent !== null) 
        {
            child.__parent.removeChild(child);
        }
        
        this.__children.splice(index, 0, child);
        child.dispatchEvent(new Event(Event.ADDED, true, false));
        child.__parent = this;
        if (this.__stage) 
        {
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
        child.__update(child.__transform.__get__concatenatedMatrix(), true, {
            total: 0,
            modified: 0
        });
        
        this.__children.splice(index, 1);
        child.__parent = null;
        child.dispatchEvent(new Event(Event.REMOVED, true, false));
        if (this.__stage) 
        {
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
            if (child === object) 
            {
                return true;
            }
            if (child instanceof DisplayObjectContainer && child.contains(object)) 
            {
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
        if (index < 0 || index > this.__children.length) 
        {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        this.__addChildAt(child, index);
    };
    
    this.getChildAt = function(index)
    {
        if (index < 0 || index >= this.__children.length) 
        {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        return this.__children[index];
    };
    
    this.getChildByName = function(name)
    {
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i) 
        {
            if (children[i].name == name) 
            {
                return children[i];
            }
        }
        return null;
    };
    
    this.getChildIndex = function(child)
    {
        var children = this.__children;
        for (var i = 0, l = children.length; i < l; ++i) 
        {
            if (children[i] == child) 
            {
                return i;
            }
        }
        
        throw new ArgumentError('The supplied DisplayObject must be a child of the caller.');
    };
    
    this.removeChild = function(child)
    {
        var index;
        try 
        {
            index = this.getChildIndex(child);
        } 
        catch (e) 
        {
            throw e;//ArgumentError
        }
        return this.__removeChildAt(index);
    };
    
    this.removeChildAt = function(index)
    {
        if (index < 0 || index >= this.__children.length) 
        {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        return this.__removeChildAt(index);
    };
    
    this.setChildIndex = function(child, index)
    {
        if (index < 0 || index >= this.__children.length) 
        {
            throw new RangeError('The supplied index is out of bounds.');
        }
        
        var oldIndex;
        try 
        {
            oldIndex = this.getChildIndex(child);
        } 
        catch (e) 
        {
            throw e;//ArgumentError
        }
        
        this.__children.splice(oldIndex, 1);
        this.__children.splice(index, 0, child);
        this.__modified = true;
    };
    
    this.swapChildren = function(child1, child2)
    {
        var index1, index2;
        try 
        {
            index1 = this.getChildIndex(child1);
            index2 = this.getChildIndex(child2);
        } 
        catch (e) 
        {
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
        if (index1 < 0 || index1 >= length || index2 < 0 || index2 >= length) 
        {
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
