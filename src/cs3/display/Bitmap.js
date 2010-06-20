var Bitmap = new Class(DisplayObject, function()
{
    this.__init__ = function(bitmapData)
    {
        DisplayObject.call(this);
        
        this.__bitmapData = null;
        
        if (bitmapData) {
            this.__set__bitmapData(bitmapData);
        }
    };
    
    //override
    this.__getContentBounds = function()
    {
        if (this.__bitmapData) {
            return this.__bitmapData.__rect.clone();
        }
        return new Rectangle();
    };
    
    //override
    this.__getAsBitmap = function()
    {
        if (this.__bitmapData) {
            return this;
        }
        return null;
    };
    
    //override
    this.__getModified = function()
    {
        return (this.__modified ||
                this.__transform.__modified ||
                (this.__bitmapData && this.__bitmapData.__modified));
    };
    
    //override
    this.__setModified = function(v)
    {
        this.__modified = v;
        this.__transform.__modified = v;
        if (this.__bitmapData) {
            this.__bitmapData.__modified = v;
        }
    };
    
    //override
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__bitmapData) {
            this.__bitmapData.__render(context, matrix, colorTransform);
        }
    };
    
    //override
    this.__hitTestPoint = function(context, matrix, point)
    {
        if (this.__bitmapData) {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (bounds.containsPoint(localPoint)) {
                //fix the points back to ints
                localPoint.x = localPoint.x | 0;
                localPoint.y = localPoint.y | 0;
                try {
                    return (this.__bitmapData.getImageData(localPoint.x, localPoint.y, 1, 1).data[3] !== 0);
                }
                catch (e) {
                    // if the bitmap source is on a different domain and we cant call getImageData
                    // return true as if it was a hitTest with shapeflag=false
                    return true;
                }
            }
        }
        return false;
    };
    
    /* getters and setters */
    this.__get__bitmapData = function()
    {
        return this.__bitmapData;
    };
    
    this.__set__bitmapData = function(v)
    {
        this.__bitmapData = v;
        this.__modified = true;
    };
    
    this.__get__pixelSnapping = function()
    {
        //not supported
        return false;
    };
    
    this.__set__pixelSnapping = function(v)
    {
        //not supported
    };
    
    this.__get__smoothing = function()
    {
        //not supported
        return false;
    };
    
    this.__set__smoothing = function(v)
    {
        //not supported
    };
    
    this.toString = function()
    {
        return '[object Bitmap]';
    };
});
