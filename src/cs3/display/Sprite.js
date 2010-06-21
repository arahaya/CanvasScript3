var Sprite = new Class(DisplayObjectContainer, function()
{
    this.__init__ = function()
    {
        DisplayObjectContainer.call(this);
        this.__graphics = null;
        //this.__dropTarget = null;
        this.buttonMode = false;
        //this.hitArea = null;
        //this.soundTransform = null;
        this.useHandCursor = true;
    };
    
    /* @override DisplayObject */
    this.__getContentBounds = Shape.prototype.__getContentBounds;
    
    /* @override DisplayObject */
    this.__getModified = Shape.prototype.__getModified;
    
    /* @override DisplayObject */
    this.__setModified = Shape.prototype.__setModified;
    
    /* @override DisplayObject */
    this.__render = function(context, colorTransform)
    {
        if (this.__graphics) {
            this.__graphics.__render(context, colorTransform);
        }
        
        this.__renderChildren(context, colorTransform);
    };
    
    /* @override DisplayObject.__hitTestPoint */
    this.__hitTestPoint = Shape.prototype.__hitTestPoint;
    
    this.startDrag = function(lockCenter, bounds)
    {
        this.__stage.startDrag(this, lockCenter, bounds);
    };
    
    this.stopDrag = function()
    {
        this.__stage.stopDrag();
    };
    
    /* getters and setters */
    this.__get__graphics = Shape.prototype.__get__graphics;
    
    this.toString = function()
    {
        return '[object Sprite]';
    };
});
