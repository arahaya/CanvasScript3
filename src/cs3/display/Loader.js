var Loader = new Class(DisplayObjectContainer, function()
{
    var noImplement = function()
    {
        throw new Error("The Loader class does not implement this method.");
    };
    
    /* @constructor */
    this.__init__ = function()
    {
        DisplayObjectContainer.call(this);
        this.__content = null;
        this.__contentLoaderInfo = new LoaderInfo(this);
        this.__img = null;
    };
    
    /* @override DisplayObject */
    this.__getAsBitmap = function()
    {
        if (this.__content) {
            return this.__content.__getAsBitmap();
        }
    };
    
    /* @override DisplayObject */
    this.__getModified = function()
    {
        return this.__transform.__modified || this.__modified;
    };
    
    /* @override DisplayObject */
    this.__setModified = function(v)
    {
        this.__transform.__modified = this.__modified = v;
    };
    
    /* @override DisplayObject */
    this.__render = function(context, colorTransform)
    {
        if (!this.__content) {
            return;
        }
        
        this.__renderChildren(context, colorTransform);
    };
    
    this.load = function(request)
    {
        if (typeof request == 'string') {
            request = new URLRequest(request);
        }
        
        if (this.__content) {
            this.unload();
        }
        
        var img = new Image();
        var self = this;
        img.onload = function(e)
        {
            //convert HTMLImageElement to BitmapData(HTMLCanvasElement)
            var bitmapData = new BitmapData(this.width, this.height, false, 0x00000000);
            bitmapData.__context.drawImage(this, 0, 0);
            self.__content = new Bitmap(bitmapData);
            
            //add content as a child
            self.__addChildAt(self.__content, 0);
            
            var contentLoaderInfo = self.__contentLoaderInfo;
            contentLoaderInfo.__content = self.__content;
            contentLoaderInfo.__width = bitmapData.__width;
            contentLoaderInfo.__height = bitmapData.__height;
            contentLoaderInfo.dispatchEvent(new Event(Event.INIT, false, false));
            contentLoaderInfo.dispatchEvent(new Event(Event.COMPLETE, false, false));
            self.close();
        };
        img.onerror = function(e)
        {
            self.__contentLoaderInfo.dispatchEvent(new IOErrorEvent(IOErrorEvent.IO_ERROR, false, false));
            self.close();
        };
        img.onabort = function(e)
        {
            self.close();
        };
        img.src = request.__url;
        this.__img = img;
    };
    
    this.unload = function()
    {
        if (this.__content) {
            this.__removeChildAt(0);
            this.__content = null;
            var contentLoaderInfo = this.__contentLoaderInfo;
            contentLoaderInfo.__content = null;
            contentLoaderInfo.__width = 0;
            contentLoaderInfo.__height = 0;
            contentLoaderInfo.dispatchEvent(new Event(Event.UNLOAD, false, false));
        }
    };
    
    this.close = function()
    {
        this.__img.src = null;
        this.__img.onload = null;
        this.__img.onerror = null;
        this.__img.onabort = null;
        this.__img = null;
    };
    
    this.addChild = noImplement;
    this.addChildAt = noImplement;
    this.removeChild = noImplement;
    this.removeChildAt = noImplement;
    this.setChildIndex = noImplement;
    
    /* getters and setters */
    this.__get__content = function()
    {
        return this.__content;
    };
    
    this.__get__contentLoaderInfo = function()
    {
        return this.__contentLoaderInfo;
    };
    
    this.toString = function()
    {
        return '[object Loader]';
    };
});
