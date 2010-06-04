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
        //if (this.__cache) {
        //    return this.__cache.__rect.clone();
        //}
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
    this.__render = function(context, matrix, color)
    {
        if (!this.__graphics) {
            return;
        }
        /*
        //convert local bounds to global coords
        var globalBounds = matrix.transformRect(this.__graphics.__rect);
        
        //hit test
        for (var i = 0, l = rects.length; i < l; ++i)
        {
            if (globalBounds.intersects(rects[i])) {
                this.__graphics.__render(context);
                return;
            }
        }
        */
        this.__graphics.__render(context, matrix, color);
    };
    //override
    this.__renderPoint = function(context, matrix, point)
    {
        if (!this.__graphics) {
            return;
        }
        /*
        //convert local bounds to global coords
        var globalBounds = matrix.transformRect(this.__graphics.__rect);
        
        if (globalBounds.containsPoint(point)) {
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
