/**
* CoordinateShuffler by Mario Klingemann. Dec 14, 2008
* Visit www.quasimondo.com for documentation, updates and more free code.
*
*
* Copyright (c) 2008 Mario Klingemann
* 
* Permission is hereby granted, free of charge, to any person
* obtaining a copy of this software and associated documentation
* files (the "Software"), to deal in the Software without
* restriction, including without limitation the rights to use,
* copy, modify, merge, publish, distribute, sublicense, and/or sell
* copies of the Software, and to permit persons to whom the
* Software is furnished to do so, subject to the following
* conditions:
* 
* The above copyright notice and this permission notice shall be
* included in all copies or substantial portions of the Software.
* 
* THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
* EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
* OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
* NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
* HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
* WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
* FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
* OTHER DEALINGS IN THE SOFTWARE.
**/
var CoordinateShuffler = new Class(Object, function()
{
    this.__init__ = function(width, height, seed, shuffleDepth, lookupTableSize)
    {
        this.__width = width;
        this.__height = height;
        this.__maximumIndex = width * height;
        this.__currentIndex = 0;
        this.__shuffleDepth = shuffleDepth || 3;
        this.__lookupTableSize = lookupTableSize || 256;
        this.__hLookup = [];
        this.__vLookup = [];
        this.__seed0 = 0;
        this.__seed1 = 0;
        this.__seed2 = 0;
        this.setSeed(seed || 0xBADA55);
    };
    
    /**
    * Returns a unique coordinate within the given width and height
    * Valid values for index go from 0 to width * height, 
    * bigger values will be wrapped around  
    **/
    this.getCoordinate = function(index)
    {
        var __width = this.__width;
        var __height = this.__height;
        var __hLookup = this.__hLookup;
        var __vLookup = this.__vLookup;
        var __maximumIndex = this.__maximumIndex;
        var __shuffleDepth = this.__shuffleDepth;
        var __lookupTableSize = this.__lookupTableSize;
        
        index %= __maximumIndex;
        var x = index % __width;
        var y = index / __width | 0;
        
        for (var i = 0; i < __shuffleDepth; ++i)
        {
            y = ( y + __hLookup[ (i * __width  + x) % __lookupTableSize ] ) % __height;
            x = ( x + __vLookup[ (i * __height + y) % __lookupTableSize ] ) % __width;
        }
        this.__currentIndex = index++;
        return [x, y];
    };
    
    
    /**
    * Returns a unique coordinate within the given width and height
    * and increments the internal index
    **/
    this.getNextCoordinate = function()
    {
        this.__currentIndex %= this.__maximumIndex;
        return this.getCoordinate( this.__currentIndex++ );
    };
    
    /**
    * Returns a list of unique coordinate within the given width and height
    * The maximum amount of returned coordinates is width * height which constitutes all pixels, 
    **/
    this.getCoordinates = function(count, index)
    {
        var __width = this.__width;
        var __height = this.__height;
        var __hLookup = this.__hLookup;
        var __vLookup = this.__vLookup;
        var __maximumIndex = this.__maximumIndex;
        var __shuffleDepth = this.__shuffleDepth;
        var __lookupTableSize = this.__lookupTableSize;
        var list = [];
        
        if ( count < 1 ) { return []; }
        count = Math.min(count, __maximumIndex);
        
        index %= __maximumIndex;
        var xx = index % __width;
        var yy = index / __width | 0;
        
        while (count > 0)
        {
            var x = xx;
            var y = yy;
            for (var i = 0; i < __shuffleDepth; ++i)
            {
                y = ( y + __hLookup[ (i * __width  + x) % __lookupTableSize ] ) % __height;
                x = ( x + __vLookup[ (i * __height + y) % __lookupTableSize ] ) % __width;
            }
            list.push([x, y]);
            
            index++;
            index %= __maximumIndex;
            
            xx = (xx + 1) % __width;
            if (xx === 0) {
                yy = (yy + 1) % __height;
            }
            
            count--;
        }
        
        this.__currentIndex = index + count % __maximumIndex;
        return list;
    };
    
    /**
    * Controls how often the coordinates get shuffled around
    * A higher should create a more random looking pattern
    * minimum value is 1 
    **/
    this.getShuffleDepth = function()
    {
        return this.__shuffleDepth;
    };
    this.setShuffleDepth = function(v)
    {
        this.__shuffleDepth = Math.max(1, v);
        this.setSeed(this.__seed);
    };
    
    
    /**
    * Sets the size of the internal coordinate shuffle tables
    * Smaller values create a more geometric looking pattern
    * Bigger values need a bit longer for the initial setup of the table 
    * minimum value is 1 
    **/
    this.getLookupTableSize = function()
    {
        return this.__lookupTableSize;
    };
    this.setLookupTableSize = function(v)
    {
        this.__lookupTableSize = Math.max(1, v);
        this.setSeed(this.__seed);
    };
    
    this.getMaximumIndex = function()
    {
        return this.__maximumIndex;
    };
    
    this.getWidth = function()
    {
        return this.__width;
    };
    this.setWidth = function(v)
    {
        this.__width = v;
        this.__maximumIndex = v * this.__height;
        this.setSeed(this.__seed);
    };
    
    this.getHeight = function()
    {
        return this.__height;
    };
    this.setHeight = function(v)
    {
        this.__height = v;
        this.__maximumIndex = this.__width * v;
        this.setSeed(this.__seed);
    };
    
    /**
    * Sets the next point index
    * used in conjuntion with getNextCoordinate
    **/
    this.getIndex = function(v)
    {
        return this.__currentIndex;
    };
    this.setIndex = function(v)
    {
        this.__currentIndex = v % this.__maximumIndex;
    };
    
    /**
    * Sets the random seed 
    * different seeds will return the coordinates in different order 
    **/
    this.setSeed = function(v)
    {
        var __seed = v;
        
        var __seed0 = (69069 * __seed) & 0xffffffff;
        if (__seed0 < 2) {
            __seed0 += 2;
        }

        var __seed1 = (69069 * __seed0) & 0xffffffff;
        if (__seed1 < 8) {
            __seed1 += 8;
        }

        var __seed2 = (69069 * __seed1) & 0xffffffff;
        if (__seed2 < 16) {
            __seed2 += 16;
        }
        
        this.__seed  = __seed;
        this.__seed0 = __seed0;
        this.__seed1 = __seed1;
        this.__seed2 = __seed2;
        
        this.update();
    };
    
    this.update = function()
    {
        var __width = this.__width;
        var __height = this.__height;
        var __lookupTableSize = this.__lookupTableSize;
        
        var i;
        var __hLookup = [];
        var __vLookup = [];
        
        for (i = __lookupTableSize - 1; i >= 0; --i)
        {
            __hLookup[i] = this.getNextInt() % __height;
        }
        
        for (i = __lookupTableSize - 1; i >= 0; --i)
        {
            __vLookup[i] = this.getNextInt() % __width;
        }
        
        this.__hLookup = __hLookup;
        this.__vLookup = __vLookup;
    };
    
    this.getNextInt = function()
    {
        var __seed0 = this.__seed0;
        var __seed1 = this.__seed1;
        var __seed2 = this.__seed2;
        __seed0 = ((( __seed0 & 4294967294) << 12) & 0xffffffff) ^ ((((__seed0 << 13) & 0xffffffff) ^ __seed0) >>> 19);
        __seed1 = ((( __seed1 & 4294967288) <<  4) & 0xffffffff) ^ ((((__seed1 <<  2) & 0xffffffff) ^ __seed1) >>> 25);
        __seed2 = ((( __seed2 & 4294967280) << 17) & 0xffffffff) ^ ((((__seed2 <<  3) & 0xffffffff) ^ __seed2) >>> 11);
        this.__seed0 = __seed0;
        this.__seed1 = __seed1;
        this.__seed2 = __seed2;
        
        //for some reason this doesn't work in opera
        //return (__seed0 ^ __seed1 ^ __seed2) >>> 0;
        
        var result = __seed0 ^ __seed1 ^ __seed2;
        if (result < 0) { result = 4294967296 + result; }
        return result;
    };
});
