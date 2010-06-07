var BitmapData = new Class(Object, function()
{
    var invalidBitmapData = function()
    {
        throw new ArgumentError("Invalid BitmapData.");
    };
    
    var __alphaBlend = function(context, src, dx, dy)
    {
        var dst = context.getImageData(dx, dy, src.width, src.height);
        __alphaBlendImageData(dst, src);
        context.putImageData(dst, dx, dy);
    };
    var __alphaBlendImageData = function(dst, src)
    {
        __alphaBlendArray(dst.data, src.data);
    };
    var __alphaBlendArray = function(dst, src)
    {
        var srcLength = src.length;
        var ri, gi, bi, ai;
        var sa, da, na, ma;
        for (var i = 0; i < srcLength;)
        {
            ri = i++;
            gi = i++;
            bi = i++;
            ai = i++;
            
            if (src[ai] === 0) {
                //src is transparent, dst keeps its color
                continue;
            }
            else if (src[ai] === 255 || dst[ai] === 0) {
                //src is solid OR dst is transparent, overwrite dst
                dst[ri] = src[ri];
                dst[gi] = src[gi];
                dst[bi] = src[bi];
                dst[ai] = src[ai];
            }
            else if (dst[ai] !== 255) {
                //merge
                sa = src[ai] / 255;
                da = dst[ai] / 255;
                na = da + sa - sa * da;
                ma = 1 - sa;
                dst[ri] = (src[ri] * sa + dst[ri] * da * ma) / na;
                dst[gi] = (src[gi] * sa + dst[gi] * da * ma) / na;
                dst[bi] = (src[bi] * sa + dst[bi] * da * ma) / na;
                dst[ai] = na * 255;
            }
            else {
                //add
                sa = src[ai] / 255;
                ma = 1 - sa;
                dst[ri] = src[ri] * sa + dst[ri] * ma;
                dst[gi] = src[gi] * sa + dst[gi] * ma;
                dst[bi] = src[bi] * sa + dst[bi] * ma;
            }
        }
    };
    var __floodFill4Stack = function(data, x, y, width, height, targetColor, replacementColor)
    {
        var T0 = targetColor[0];
        var T1 = targetColor[1];
        var T2 = targetColor[2];
        var T3 = targetColor[3];
        var R0 = replacementColor[0];
        var R1 = replacementColor[1];
        var R2 = replacementColor[2];
        var R3 = replacementColor[3];
        
        var stack = [];
        var pop = [x, y, 0];
        var ignore;
        while (pop)
        {
            x = pop[0];
            y = pop[1];
            ignore = pop[2];//make sure it doesn't go back the way it just came from
            
            if (x < 0 || x > width || y < 0 || y > height) {
                //out of rect
                pop = stack.pop();
                continue;
            }
            
            //get the array index
            var p = ((y * width) + x) * 4;
            
            if (data[p] !== T0 || data[p+1] !== T1 || data[p+2] !== T2 || data[p+3] !== T3) {
                //node color doesn't equal target color
                pop = stack.pop();
                continue;
            }
            
            //replace node color
            data[p]   = R0;
            data[p+1] = R1;
            data[p+2] = R2;
            data[p+3] = R3;
            
            if (ignore !== 1) { stack.push([x-1, y, 2]); }//west
            if (ignore !== 2) { stack.push([x+1, y, 1]); }//east
            if (ignore !== 3) { stack.push([x, y-1, 4]); }//north
            if (ignore !== 4) { stack.push([x, y+1, 3]); }//south
            
            pop = stack.pop();
        }
    };
    var __floodFillScanlineStack = function(data, x, y, width, height, targetColor, replacementColor)
    {
        var T0 = targetColor[0];
        var T1 = targetColor[1];
        var T2 = targetColor[2];
        var T3 = targetColor[3];
        var R0 = replacementColor[0];
        var R1 = replacementColor[1];
        var R2 = replacementColor[2];
        var R3 = replacementColor[3];
        
        var LINESIZE = width * 4;
        var WIDTH_M1 = width - 1;
        
        var stack = [];
        var pop = [x, y];
        var spanLeft, spanRight, p;
        while (pop)
        {
            x = pop[0];
            y = pop[1];
            p = (y * LINESIZE) + (x * 4);
            
            while (y >= 0 && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3))
            {
                --y;
                p -= LINESIZE;
            }
            ++y;
            p += LINESIZE;
            spanLeft = spanRight = 0;
            
            while (y < height && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3))
            {
                //replace node color
                data[p]   = R0;
                data[p+1] = R1;
                data[p+2] = R2;
                data[p+3] = R3;
                
                p -= 4;//x - 1
                if (!spanLeft && x > 0 && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3)) {
                    stack.push([x - 1, y]);
                    spanLeft = 1;
                }
                else if (spanLeft && x > 0 && (data[p] !== T0 || data[p+1] !== T1 || data[p+2] !== T2 || data[p+3] !== T3)) {
                    spanLeft = 0;
                }
                
                p += 8;//x + 1
                if (!spanRight && x < WIDTH_M1 && (data[p] === T0 && data[p+1] === T1 && data[p+2] === T2 && data[p+3] === T3)) {
                    stack.push([x + 1, y]);
                    spanRight = 1;
                }
                else if (spanRight && x < WIDTH_M1 && (data[p] !== T0 || data[p+1] !== T1 || data[p+2] !== T2 || data[p+3] !== T3)) {
                    spanRight = 0;
                }
                p -= 4;
                
                ++y;
                p += LINESIZE;
            }
            
            pop = stack.pop();
        }
    };
    
    this.__init__ = function(width, height, transparent, fillColor)
    {
        //transparent=false doesn't work
        width  = width  | 0;
        height = height | 0;
        if (!width || !height) {
            throw new ArgumentError("Invalid BitmapData.");
        }
        
        this.__width = width;
        this.__height = height;
        //this.__transparent = (transparent) ? true : false;
        this.__canvas = cs3.utils.createCanvas(width, height);
        this.__context = cs3.utils.getContext2d(this.__canvas);
        this.__rect = new Rectangle(0, 0, width, height);
        this.__pixel = this.__context.createImageData(1, 1);
        this.__modified = false;
        this.__disposed = false;
        
        if (fillColor === null) { fillColor = 0xFFFFFFFF; }
        if (fillColor) { this.fillRect(this.__rect, fillColor); }
    };
    this.__render = function(context, matrix, colorTransform)
    {
        if (this.__canvas) {
            var rect = this.__rect;
            context.drawImage(this.__canvas, 0, 0);
        }
    };
    this.__resize = function(width, height)
    {
        this.__width = width;
        this.__height = height;
        this.__rect.width = width;
        this.__rect.height = height;
        this.__canvas.width = width;
        this.__canvas.height = height;
    };
    this.applyFilter = function(sourceBitmapData, sourceRect, destPoint, filter)
    {
        filter.__filterBitmapData(sourceBitmapData, sourceRect, this, destPoint);
        this.__modified = true;
    };
    this.clone = function()
    {
        var clone = new BitmapData(this.__width, this.__height, true, 0);
        clone.__context.drawImage(this.__canvas, 0, 0);
        clone.__rect = this.__rect.clone();
        return clone;
    };
    this.colorTransform = function(rect, colorTransform)
    {
        var rm = colorTransform.redMultiplier;
        var gm = colorTransform.greenMultiplier;
        var bm = colorTransform.blueMultiplier;
        var am = colorTransform.alphaMultiplier;
        var ro = colorTransform.redOffset;
        var go = colorTransform.greenOffset;
        var bo = colorTransform.blueOffset;
        var ao = colorTransform.alphaOffset;
        
        var image = this.__context.getImageData(rect.x, rect.y, rect.width, rect.height);
        var data = image.data;
        var length = data.length;
        var i;
        
        if (cs3.core.isOpera) {
            //I think opera does something like (color & 0xFF)
            for (i = 0; i < length;)
            {
                data[i] = Math.min(data[i++] * rm + ro, 255);
                data[i] = Math.min(data[i++] * gm + go, 255);
                data[i] = Math.min(data[i++] * bm + bo, 255);
                data[i] = Math.min(data[i++] * am + ao, 255);
            }
        }
        else {
            for (i = 0; i < length;)
            {
                data[i] = data[i++] * rm + ro;
                data[i] = data[i++] * gm + go;
                data[i] = data[i++] * bm + bo;
                data[i] = data[i++] * am + ao;
            }
        }
        
        this.__context.putImageData(image, rect.x, rect.y);
        this.__modified = true;
    };
    this.compare = function(otherBitmapData)
    {
        //TODO not tested
        var width = this.__width;
        var height = this.__height;
        var otherWidth = otherBitmapData.__width;
        var otherHeight = otherBitmapData.__height;
        
        if (width !== otherWidth) {
            return -3;
        }
        if (height !== otherHeight) {
            return -4;
        }
        
        var sourceImageData = sourceBitmapData.__context.getImageData(0, 0, width, height);
        var otherImageData = otherBitmapData.__context.getImageData(0, 0, width, height);
        var newImageData = sourceBitmapData.__context.createImageData(width, height);
        var sourcePixels = sourceImageData.data;
        var otherPixels = otherImageData.data;
        var newPixels = newImageData.data;
        var length = sourceImageData.length;
        var isDifferent = false;
        
        for (var i = 0; i < length; i += 4)
        {
            var sr = sourcePixels[i];
            var sg = sourcePixels[i+1];
            var sb = sourcePixels[i+2];
            var sa = sourcePixels[i+3];
            var or = otherPixels[i];
            var og = otherPixels[i+1];
            var ob = otherPixels[i+2];
            var oa = otherPixels[i+3];
            
            if ((sr !== or) || (sg !== og) || (sb !== ob)) {
                newPixels[i]   = sr - or;
                newPixels[i+1] = sg - og;
                newPixels[i+2] = sb - ob;
                newPixels[i+3] = 0xFF;
                isDifferent = true;
            }
            else if (sa !== oa) {
                newPixels[i]   = 0xFF;
                newPixels[i+1] = 0xFF;
                newPixels[i+2] = 0xFF;
                newPixels[i+3] = sa - oa;
                isDifferent = true;
            }
        }
        
        if (isDifferent === false) {
            return 0;
        }
        
        var newBitmapData = new BitmapData(width, height, true, 0x00000000);
        newBitmapData.__context.putImageData(newImageData, 0, 0);
        return newBitmapData;
    };
    this.copyChannel = function(sourceBitmapData, sourceRect, destPoint, sourceChannel, destChannel)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var sourcePixels = sourceImageData.data;
        var destPixels = destImageData.data;
        var length = sourcePixels.length;
        
        var sourceChannelIndex, destChannelIndex;
        if (sourceChannel == BitmapDataChannel.RED) { sourceChannelIndex = 0; }
        else if (sourceChannel == BitmapDataChannel.GREEN) { sourceChannelIndex = 1; }
        else if (sourceChannel == BitmapDataChannel.BLUE) { sourceChannelIndex = 2; }
        else if (sourceChannel == BitmapDataChannel.ALPHA) { sourceChannelIndex = 3; }
        else { return; }
        if (destChannel == BitmapDataChannel.RED) { destChannelIndex = 0; }
        else if (destChannel == BitmapDataChannel.GREEN) { destChannelIndex = 1; }
        else if (destChannel == BitmapDataChannel.BLUE) { destChannelIndex = 2; }
        else if (destChannel == BitmapDataChannel.ALPHA) { destChannelIndex = 3; }
        else { return; }
        
        for (var i = 0; i < length; i += 4)
        {
            destPixels[i + destChannelIndex] = sourcePixels[i + sourceChannelIndex];
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.copyPixels = function(sourceBitmapData, sourceRect, destPoint)
    {
        /*
        var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height);
        this.__context.putImageData(sourceImageData, destPoint.x, destPoint.y);
        this.__modified = true;
        */
        //about 4 - 30 times faster
        this.__context.clearRect(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height);
        this.__context.drawImage(sourceBitmapData.__canvas, sourceRect.x, sourceRect.y, sourceRect.width, sourceRect.height,
                        destPoint.x, destPoint.y, sourceRect.width, sourceRect.height);
        this.__modified = true;
    };
    this.createImageData = function()
    {
        return this.__context.createImageData.apply(this.__context, arguments);
    };
    this.dispose = function()
    {
        this.__width = 0;
        this.__height = 0;
        this.__canvas.width = 0;
        this.__canvas.height = 0;
        this.__canvas = null;
        this.__context = null;
        this.__rect.setEmpty();
        this.__pixel = null;
        
        //disable all public methods
        //excluding toString
        for (var p in this)
        {
            if (p !== 'toString' && p.charAt(0) !== '_' && typeof(this[p]) === 'function') {
                this[p] = invalidBitmapData;
            }
        }
        
        //disable getters
        this.__defineGetter__("width", invalidBitmapData);
        this.__defineGetter__("height", invalidBitmapData);
        this.__defineGetter__("rect", invalidBitmapData);
        
        this.__modified = true;
        this.__disposed = true;
    };
    this.draw = function(source, matrix)
    {
        //TODO a lot to fix..
        matrix = matrix || new Matrix();
        
        var context = this.__context;
        context.save();
        context.setTransform(
            matrix.a,
            matrix.b,
            matrix.c,
            matrix.d,
            matrix.tx,
            matrix.ty);
        source.__renderList(context, matrix, new ColorTransform());
        context.restore();
        this.__modified = true;
    };
    this.fillRect = function(rect, color)
    {
        var context = this.__context;
        context.save();
        context.clearRect(rect.x, rect.y, rect.width, rect.height);
        context.fillStyle = __toRGBA(color);
        context.beginPath();
        context.rect(rect.x, rect.y, rect.width, rect.height);
        context.fill();
        context.restore();
        this.__modified = true;
    };
    this.floodFill = function(x, y, color)
    {
        var width = this.__width;
        var height = this.__height;
        var pixels = this.__context.getImageData(0, 0, width, height);
        var data = pixels.data;
        
        //get the array index
        var p = ((y * width) + x) * 4;
        
        //get the target color to overwrite(rgba array)
        var targetColor = [data[p], data[p+1], data[p+2], data[p+3]];
        
        //replacement color to rgba array
        var replacementColor = [color >> 16 & 0xFF, color >> 8  & 0xFF, color & 0xFF, color >> 24 & 0xFF];
        
        if (targetColor[0] === replacementColor[0] && targetColor[1] === replacementColor[1] &&
            targetColor[2] === replacementColor[2] && targetColor[3] === replacementColor[3]) {
                //already the same color
                return;
        }
        
        //start the search
        __floodFillScanlineStack(data, x, y, width, height, targetColor, replacementColor);
        
        this.__context.putImageData(pixels, 0, 0);
        this.__modified = true;
    };
    this.generateFilterRect = function(sourceRect, filter)
    {
        return filter.__generateRect(sourceRect);
    };
    this.getColorBoundsRect = function(mask, color, findColor)
    {
        if (mask === undefined || color === undefined) { return null; }
        findColor = (findColor) ? true : false;
        
        var width = this.__width;
        var height = this.__height;
        var data = this.__context.getImageData(0, 0, width, height).data;
        
        var minX = width;
        var minY = height;
        var maxX = 0;
        var maxY = 0;
        var x, y, p, value;
        
        color = color & mask;
        
        if (findColor === true) {
            for (x = 0; x < width; ++x)
            {
                for (y = 0; y < height; ++y)
                {
                    p = ((y * width) + x) * 4;
                    value = (data[p+3] << 24) | (data[p] << 16) | (data[p+1] << 8) | data[p+2];
                    if ((value & mask) === color) {
                        minX = (x < minX) ? x : minX;
                        minY = (y < minY) ? y : minY;
                        maxX = (x > maxX) ? x : maxX;
                        maxY = (y > maxY) ? y : maxY;
                    }
                }
            }
        }
        else {
            for (x = 0; x < width; ++x)
            {
                for (y = 0; y < height; ++y)
                {
                    p = ((y * width) + x) * 4;
                    value = (data[p+3] << 24) | (data[p] << 16) | (data[p+1] << 8) | data[p+2];
                    if ((value & mask) !== color) {
                        minX = (x < minX) ? x : minX;
                        minY = (y < minY) ? y : minY;
                        maxX = (x > maxX) ? x : maxX;
                        maxY = (y > maxY) ? y : maxY;
                    }
                }
            }
        }
        
        var rect = new Rectangle(minX, minY, maxX - minX + 1, maxY - minY + 1);
        if (rect.isEmpty()) {
            rect.setEmpty();
        }
        return rect;
    };
    this.getImageData = function()
    {
        return this.__context.getImageData.apply(this.__context, arguments);
    };
    this.getPixel = function(x, y)
    {
        if (!this.__rect.contains(x, y)) { return 0; }
        
        var data = this.__context.getImageData(x, y, 1, 1).data;
        return (data[0] << 16) | (data[1] << 8) | data[2];
    };
    this.getPixel32 = function(x, y)
    {
        if (!this.__rect.contains(x, y)) { return 0; }
        
        var data = this.__context.getImageData(x, y, 1, 1).data;
        return ((data[3] << 24) | (data[0] << 16) | (data[1] << 8) | data[2]) >>> 0;
    };
    this.getPixels = function(rect)
    {
        return this.__context.getImageData(rect.x, rect.y, rect.width, rect.height).data;
    };
    this.hitTest = function(firstPoint, firstAlphaThreshold, secondObject, secondBitmapDataPoint, secondAlphaThreshold)
    {
        secondAlphaThreshold = secondAlphaThreshold || 1;
        //TODO
        return false;
    };
    this.lock = function()
    {
        //use getImageData and putImageData
        __noImp('BitmapData.lock()');
    };
    this.unlock = function()
    {
        //use getImageData and putImageData
        __noImp('BitmapData.unlock()');
    };
    this.merge = function(sourceBitmapData, sourceRect, destPoint, redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var sourcePixels = sourceImageData.data;
        var destPixels = destImageData.data;
        var length = sourcePixels.length;
        
        for (var i = 0; i < length;)
        {
            destPixels[i]   = (sourcePixels[i] * redMultiplier   + destPixels[i] * (256 - redMultiplier))   / 256;
            destPixels[++i] = (sourcePixels[i] * greenMultiplier + destPixels[i] * (256 - greenMultiplier)) / 256;
            destPixels[++i] = (sourcePixels[i] * blueMultiplier  + destPixels[i] * (256 - blueMultiplier))  / 256;
            destPixels[++i] = (sourcePixels[i] * alphaMultiplier + destPixels[i] * (256 - alphaMultiplier)) / 256;
            ++i;
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.noise = function()
    {
        //alert("HELP!");
    };
    this.paletteMap = function(sourceBitmapData, sourceRect, destPoint, redArray, greenArray, blueArray, alphaArray)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        //var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        //var destImageData = this.__context.createImageData(destRect.width, destRect.height);
        var sourcePixels = sourceImageData.data;
        //var destPixels = destImageData.data;
        var length = sourcePixels.length;
        
        if (!(redArray   instanceof Array)) { redArray   = []; }
        if (!(greenArray instanceof Array)) { greenArray = []; }
        if (!(blueArray  instanceof Array)) { blueArray  = []; }
        if (!(alphaArray instanceof Array)) { alphaArray = []; }
        
        for (var i = 0; i < 256; ++i)
        {
            if (redArray[i]   === undefined) { redArray[i]   = i << 16; }
            if (greenArray[i] === undefined) { greenArray[i] = i << 8; }
            if (blueArray[i]  === undefined) { blueArray[i]  = i; }
            if (alphaArray[i] === undefined) { alphaArray[i] = i << 24; }
        }
        
        var newColor, newRed, newGreen, newBlue, newAlpha;
        for (i = 0; i < length;)
        {
            
            newColor = redArray[sourcePixels[i]] | greenArray[sourcePixels[i+1]] | blueArray[sourcePixels[i+2]] | alphaArray[sourcePixels[i+3]];
            newAlpha = newColor >> 24 & 0xFF;
            newRed   = newColor >> 16 & 0xFF;
            newGreen = newColor >> 8  & 0xFF;
            newBlue  = newColor & 0xFF;
            
            sourcePixels[i++] = newRed;
            sourcePixels[i++] = newGreen;
            sourcePixels[i++] = newBlue;
            sourcePixels[i++] = newAlpha;
        }
        
        this.__context.putImageData(sourceImageData, destPoint.x, destPoint.y);
        this.__modified = true;
    };
    this.perlinNoise = function(baseX, baseY, numOctaves, randomSeed, stitch, fractalNoise, channelOptions, grayScale, offsets)
    {
        //alert("HELP!");
    };
    this.pixelDissolve = function(sourceBitmapData, sourceRect, destPoint, randomSeed, numPixels, fillColor)
    {
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var destPixels = destImageData.data;
        var width = destImageData.width;
        var height = destImageData.height;
        var size = destImageData.width * destImageData.height;
        var i, p, c;
        
        if (!numPixels) { numPixels = (size / 30) | 0; }
        else if (numPixels > size) { numPixels = size; }
        
        if (randomSeed < 1) { randomSeed = (randomSeed * 0xFFFFFFFF) | 0; }
        
        //extract the real seed and index from randomSeed
        var seed  = randomSeed & 0xFF;//only 256 patterns
        var index = randomSeed >> 8 & 0xFFFFFF;//max is 16,777,215
        
        var coordinateShuffler = new CoordinateShuffler(width, height, seed, 3, 256);
        var coords = coordinateShuffler.getCoordinates(numPixels, index);
        
        if (sourceBitmapData === this) {
            fillColor = fillColor | 0;
            var fillAlpha = fillColor >> 24 & 0xFF;
            var fillRed   = fillColor >> 16 & 0xFF;
            var fillGreen = fillColor >> 8  & 0xFF;
            var fillBlue  = fillColor & 0xFF;
            
            for (i = 0; i < numPixels; ++i)
            {
                c = coords[i];
                p = (c[1] * width + c[0]) * 4;
                destPixels[p]   = fillRed;
                destPixels[p+1] = fillGreen;
                destPixels[p+2] = fillBlue;
                destPixels[p+3] = fillAlpha;
            }
        }
        else {
            var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
            var sourcePixels = sourceImageData.data;
            for (i = 0; i < numPixels; ++i)
            {
                c = coords[i];
                p = (c[1] * width + c[0]) * 4;
                destPixels[p]   = sourcePixels[p];
                destPixels[p+1] = sourcePixels[p+1];
                destPixels[p+2] = sourcePixels[p+2];
                destPixels[p+3] = sourcePixels[p+3];
            }
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
        
        //return the new seed
        return ((coordinateShuffler.getIndex() << 8) | seed) >>> 0;
    };
    this.putImageData = function()
    {
        this.__context.putImageData.apply(this.__context, arguments);
    };
    this.scroll = function(x, y)
    {
        var sourceX, sourceY, sourceWidth, sourceHeight;
        if (x < 0) {
            sourceX = -x;
            sourceWidth = this.__width + x;
        }
        else {
            sourceX = 0;
            sourceWidth = this.__width - x;
        }
        if (y < 0) {
            sourceY = -y;
            sourceHeight = this.__height + y;
        }
        else {
            sourceY = 0;
            sourceHeight = this.__height + y;
        }
        var imageData = this.__context.getImageData(sourceX, sourceY, sourceWidth, sourceHeight);
        this.__context.putImageData(imageData, x, y);
        this.__modified = true;
    };
    this.setPixel = function(x, y, color)
    {
        var a = 255;
        var r = color >> 16 & 0xFF;
        var g = color >> 8  & 0xFF;
        var b = color & 0xFF;
        
        var pixel = this.__pixel;
        var data = pixel.data;
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a;
        this.__context.putImageData(pixel, x, y);
        this.__modified = true;
    };
    this.setPixel32 = function(x, y, color)
    {
        var a = color >> 24 & 0xFF;
        var r = color >> 16 & 0xFF;
        var g = color >> 8  & 0xFF;
        var b = color & 0xFF;
        
        var pixel = this.__pixel;
        var data = pixel.data;
        data[0] = r;
        data[1] = g;
        data[2] = b;
        data[3] = a;
        this.__context.putImageData(pixel, x, y);
        this.__modified = true;
    };
    this.setPixels = function(rect, inputArray)
    {
        var rectLength = rect.width * rect.height * 4;
        var arrayLength = inputArray.length;
        var length = (rectLength > arrayLength) ? arrayLength : rectLength;
        
        var pixels = this.__context.createImageData(rect.width, rect.height);
        var data = pixels.data;
        for (var i = 0; i < length; ++i)
        {
            data[i] = inputArray[i];
        }
        this.__context.putImageData(pixels, rect.x, rect.y);
        this.__modified = true;
    };
    this.threshold = function(sourceBitmapData, sourceRect, destPoint, operation, threshold, color, mask, copySource)
    {
        if (color === undefined) { color = 0x00000000; }
        if (mask === undefined) { mask = 0xFFFFFFFF; }
        if (copySource === undefined) { copySource = false; }
        
        var destRect = this.__rect.intersection(new Rectangle(destPoint.x, destPoint.y, sourceRect.width, sourceRect.height));
        var sourceImageData = sourceBitmapData.__context.getImageData(sourceRect.x, sourceRect.y, destRect.width, destRect.height);
        var destImageData = this.__context.getImageData(destRect.x, destRect.y, destRect.width, destRect.height);
        var sourcePixels = sourceImageData.data;
        var destPixels = destImageData.data;
        var length = sourcePixels.length;
        
        threshold = threshold & mask;
        var colors = [color >> 16 & 0xFF, color >> 8 & 0xFF, color & 0xFF, color >> 24 & 0xFF];
        
        var destColor;
        var i;
        var cnt = 0;
        
        if (operation == '<') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourcePixels[i+3] << 24) | (sourcePixels[i] << 16) | (sourcePixels[i+1] << 8) | sourcePixels[i+2];
                if ((testColor & mask) < threshold) {
                    destPixels[i] = colors[0]; destPixels[i+1] = colors[1]; destPixels[i+2] = colors[2]; destPixels[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destPixels[i] = sourcePixels[i]; destPixels[i+1] = sourcePixels[i+1]; destPixels[i+2] = sourcePixels[i+2]; destPixels[i+3] = sourcePixels[i+3];
                }
            }
        }
        else if (operation == '<=') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourcePixels[i+3] << 24) | (sourcePixels[i] << 16) | (sourcePixels[i+1] << 8) | sourcePixels[i+2];
                if ((testColor & mask) <= threshold) {
                    destPixels[i] = colors[0]; destPixels[i+1] = colors[1]; destPixels[i+2] = colors[2]; destPixels[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destPixels[i] = sourcePixels[i]; destPixels[i+1] = sourcePixels[i+1]; destPixels[i+2] = sourcePixels[i+2]; destPixels[i+3] = sourcePixels[i+3];
                }
            }
        }
        else if (operation == '>') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourcePixels[i+3] << 24) | (sourcePixels[i] << 16) | (sourcePixels[i+1] << 8) | sourcePixels[i+2];
                if ((testColor & mask) > threshold) {
                    destPixels[i] = colors[0]; destPixels[i+1] = colors[1]; destPixels[i+2] = colors[2]; destPixels[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destPixels[i] = sourcePixels[i]; destPixels[i+1] = sourcePixels[i+1]; destPixels[i+2] = sourcePixels[i+2]; destPixels[i+3] = sourcePixels[i+3];
                }
            }
        }
        else if (operation == '>=') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourcePixels[i+3] << 24) | (sourcePixels[i] << 16) | (sourcePixels[i+1] << 8) | sourcePixels[i+2];
                if ((testColor & mask) >= threshold) {
                    destPixels[i] = colors[0]; destPixels[i+1] = colors[1]; destPixels[i+2] = colors[2]; destPixels[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destPixels[i] = sourcePixels[i]; destPixels[i+1] = sourcePixels[i+1]; destPixels[i+2] = sourcePixels[i+2]; destPixels[i+3] = sourcePixels[i+3];
                }
            }
        }
        else if (operation == '==') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourcePixels[i+3] << 24) | (sourcePixels[i] << 16) | (sourcePixels[i+1] << 8) | sourcePixels[i+2];
                if ((testColor & mask) == threshold) {
                    destPixels[i] = colors[0]; destPixels[i+1] = colors[1]; destPixels[i+2] = colors[2]; destPixels[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destPixels[i] = sourcePixels[i]; destPixels[i+1] = sourcePixels[i+1]; destPixels[i+2] = sourcePixels[i+2]; destPixels[i+3] = sourcePixels[i+3];
                }
            }
        }
        else if (operation == '!=') {
            for (i = 0; i < length; i += 4) {
                testColor = (sourcePixels[i+3] << 24) | (sourcePixels[i] << 16) | (sourcePixels[i+1] << 8) | sourcePixels[i+2];
                if ((testColor & mask) != threshold) {
                    destPixels[i] = colors[0]; destPixels[i+1] = colors[1]; destPixels[i+2] = colors[2]; destPixels[i+3] = colors[3];
                    ++cnt;
                }
                else if (copySource) {
                    destPixels[i] = sourcePixels[i]; destPixels[i+1] = sourcePixels[i+1]; destPixels[i+2] = sourcePixels[i+2]; destPixels[i+3] = sourcePixels[i+3];
                }
            }
        }
        
        this.__context.putImageData(destImageData, destPoint.x, destPoint.y);
        this.__modified = true;
        return cnt;
    };
    
    /* getters and setters */
    this.getWidth = function()
    {
        return this.__width;
    };
    this.getHeight = function()
    {
        return this.__height;
    };
    this.getRect = function()
    {
        return this.__rect.clone();
    };
    this.getTransparent = function()
    {
        //return this.__transparent;
        return true;
    };
});
BitmapData.prototype.__defineGetter__("width", BitmapData.prototype.getWidth);
BitmapData.prototype.__defineGetter__("height", BitmapData.prototype.getHeight);
BitmapData.prototype.__defineGetter__("rect", BitmapData.prototype.getRect);
BitmapData.prototype.__defineGetter__("transparent", BitmapData.prototype.getTransparent);
BitmapData.prototype.toString = function()
{
    return '[object BitmapData]';
};
