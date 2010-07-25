var BlurFilter = new Class(BitmapFilter, function()
{
    this.__init__ = function(blurX, blurY, quality)
    {
        this.blurX = blurX || 4;
        this.blurY = blurY || 4;
        this.quality = quality || 1;
    };
    
    //override
    this.__filter = function(displayObject)
    {
        /*
        var target = (displayObject.__cache) ? displayObject.__cache : displayObject;
        var exWidth = this.blurX * this.quality;
        var exHeight = this.blurY * this.quality;
        var newWidth = target.width + exWidth;
        var newHeight = target.height + exHeight;
        var bitmapData = new BitmapData(newWidth, newHeight, true, 0);
        
        var matrix = new Matrix(1, 0, 0, 1, exWidth/2, exHeight/2);
        bitmapData.draw(target, matrix);
        //this.__applyBitmap(bitmapData);
        
        bitmapData.__rect.offset(-exWidth/2, -exHeight/2);
        displayObject.__cache = bitmapData;
        */
    };
    
    //override
    this.__filterBitmapData = function(sourceBitmapData, sourceRect, distBitmapData, distPoint)
    {
        var width = sourceRect.width;
        var height = sourceRect.height;
        var srcImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, width, height);
        var dstImageData = sourceBitmapData.__context.createImageData(width, height);
        
        for (var i = 0; i < this.quality; ++i)
        {
            this.__blur( srcImageData.data, dstImageData.data, width, height, this.blurX / 2 );
            this.__blur( dstImageData.data, srcImageData.data, height, width, this.blurY / 2 );
        }
        
        distBitmapData.__context.putImageData(srcImageData, distPoint.x, distPoint.y);
    };
    
    //override
    this.__generateRect = function(sourceRect)
    {
        var inflateX = this.blurX * this.quality / 2;
        var inflateY = this.blurY * this.quality / 2;
        var newRect = sourceRect.clone();
        newRect.inflate(inflateX, inflateY);
        return newRect;
    };
    
    /*
     * http://www.jhlabs.com/ip/BoxBlurFilter.java
     * Copyright 2005 Huxtable.com. All rights reserved.
     */
    this.__blur = function(src, dst, width, height, radius)
    {
        var length = src.length;
        var widthMinus1 = width - 1;
        var tableSize = 2 * radius + 1;
        var srcIndex = 0;
        var dstIndex;
        var divide = [];
        //var clamp = this.__clamp;
        var i, l, p, p2;
        
        for (i = 0, l = 256 * tableSize; i < l; ++i)
        {
            divide[i] = (i / tableSize) | 0;
        }
        
        for (var y = 0; y < height; ++y)
        {
            dstIndex = y;
            var ta = 0, tr = 0, tg = 0, tb = 0;

            for (i = -radius; i <= radius; ++i)
            {
                //p = (srcIndex + clamp(i, 0, widthMinus1)) * 4;
                p = (srcIndex + ((i < 0) ? 0 : (i > widthMinus1) ? widthMinus1 : i)) * 4;
                tr += src[p];
                tg += src[++p];
                tb += src[++p];
                ta += src[++p];
            }

            for (var x = 0; x < width; ++x)
            {
                p = dstIndex * 4;
                dst[p]   = divide[tr];
                dst[++p] = divide[tg];
                dst[++p] = divide[tb];
                dst[++p] = divide[ta];

                var i1 = x + radius + 1;
                if (i1 > widthMinus1)
                {
                    i1 = widthMinus1;
                }
                var i2 = x - radius;
                if (i2 < 0)
                {
                    i2 = 0;
                }
                
                p  = (srcIndex + i1) * 4;
                p2 = (srcIndex + i2) * 4;
                
                tr += src[p]   - src[p2];
                tg += src[++p] - src[++p2];
                tb += src[++p] - src[++p2];
                ta += src[++p] - src[++p2];
                
                dstIndex += height;
            }
            srcIndex += width;
        }
    };
    
    //override
    this.clone = function()
    {
        return new BlurFilter(this.blurX, this.blurY, this.quality);
    };
    
    this.toString = function()
    {
        return '[object BlurFilter]';
    };
});
