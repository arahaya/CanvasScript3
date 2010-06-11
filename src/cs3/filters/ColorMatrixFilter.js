var ColorMatrixFilter = new Class(BitmapFilter, function()
{
    this.__init__ = function(matrix)
    {
        this.matrix = matrix;
    };
    //override
    this.__filter = function(displayObject)
    {
    };
    //override
    this.__filterBitmapData = function(sourceBitmapData, sourceRect, distBitmapData, distPoint)
    {
        var width = sourceRect.width;
        var height = sourceRect.height;
        var srcImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
        var dstImageData = sourceBitmapData.__context.createImageData(sourceRect.width, sourceRect.height);
        var sourcePixels = sourceImageData.data;
        var destPixels = destImageData.data;
        var length = sourcePixels.length;
        
        var m = this.matrix;
        
        for (var i = 0; i < length; i += 4)
        {
            var srcR = sourcePixels[i];
            var srcG = sourcePixels[i+1];
            var srcB = sourcePixels[i+2];
            var srcA = sourcePixels[i+3];
            destPixels[i++] = (m[0]  * srcR) + (m[1]  * srcG) + (m[2]  * srcB) + (m[3]  * srcA) + m[4];
            destPixels[i++] = (m[5]  * srcR) + (m[6]  * srcG) + (m[7]  * srcB) + (m[8]  * srcA) + m[9];
            destPixels[i++] = (m[10] * srcR) + (m[11] * srcG) + (m[12] * srcB) + (m[13] * srcA) + m[14];
            destPixels[i++] = (m[15] * srcR) + (m[16] * srcG) + (m[17] * srcB) + (m[18] * srcA) + m[19];
        }
        
        distBitmapData.__context.putImageData(dstImageData, distPoint.x, distPoint.y);
    };
    //override
    this.__generateRect = function(sourceRect)
    {
        return sourceRect.clone();
    };
    //override
    this.clone = function()
    {
        return new ColorMatrixFilter(this.matrix);
    };
});
ColorMatrixFilter.prototype.toString = function()
{
    return '[object ColorMatrixFilter]';
};
