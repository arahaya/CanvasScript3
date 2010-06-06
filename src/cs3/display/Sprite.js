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
    this.__getContentBounds = Shape.prototype.__getContentBounds;
    this.__getModified = Shape.prototype.__getModified;
    this.__setModified = Shape.prototype.__setModified;
    this.__render = Shape.prototype.__render;
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
    this.getGraphics = Shape.prototype.getGraphics;
});
Sprite.prototype.__defineGetter__("graphics", Sprite.prototype.getGraphics);
Sprite.prototype.toString = function()
{
    return '[object Sprite]';
};
