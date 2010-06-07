var Bitmap = new Class(DisplayObject, function()
{
    this.__init__ = function(bitmapData)
    {
        DisplayObject.call(this);
        this.__bitmapData = bitmapData ? bitmapData : null;
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
                var imageData = this.__bitmapData.getImageData(localPoint.x, localPoint.y, 1, 1);
                var pixel = imageData.data;
                //if (pixel[0] !== 0 || pixel[1] !== 0 || pixel[2] !== 0 || pixel[3] !== 0) {
                if (pixel[3] !== 0) {
                    return true;
                }
            }
        }
        return false;
    };
    /* getters and setters */
    this.getBitmapData = function()
    {
        return this.__bitmapData;
    };
    this.setBitmapData = function(v)
    {
        this.__bitmapData = v;
        this.__setModified(true);
    };
    this.getPixelSnapping = function()
    {
        //not supported
        return false;
    };
    this.setPixelSnapping = function(v)
    {
        //not supported
    };
    this.getSmoothing = function()
    {
        //not supported
        return false;
    };
    this.setSmoothing = function(v)
    {
        //not supported
    };
});
Bitmap.prototype.__defineGetter__("bitmapData", Bitmap.prototype.getBitmapData);
Bitmap.prototype.__defineGetter__("pixelSnapping", Bitmap.prototype.getPixelSnapping);
Bitmap.prototype.__defineSetter__("pixelSnapping", Bitmap.prototype.setPixelSnapping);
Bitmap.prototype.__defineGetter__("smoothing", Bitmap.prototype.getSmoothing);
Bitmap.prototype.__defineSetter__("smoothing", Bitmap.prototype.setSmoothing);
Bitmap.prototype.toString = function()
{
    return '[object Bitmap]';
};
