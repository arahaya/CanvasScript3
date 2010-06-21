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
    this.__render = function(context, colorTransform)
    {
        if (this.__graphics) {
            this.__graphics.__render(context, colorTransform);
        }
    };
    
    //override
    this.__hitTestPoint = function(context, matrix, point)
    {
        if (this.__graphics) {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (bounds.containsPoint(localPoint)) {
                this.__graphics.__render(context, null);
                return (context.getImageData(point.x, point.y, 1, 1).data[3] !== 0);
            }
        }
        return false;
    };
    
    /* getters and setters */
    this.__get__graphics = function()
    {
        if (this.__graphics === null) {
            this.__graphics = new Graphics();
        }
        return this.__graphics;
    };
    
    this.toString = function()
    {
        return '[object Shape]';
    };
});
