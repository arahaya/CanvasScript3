var Transform = new Class(Object, function()
{
    var getRotation = MatrixTransformer.getRotation;
    var setRotation = MatrixTransformer.setRotation;
    var getScaleX = MatrixTransformer.getScaleX;
    var setScaleX = MatrixTransformer.setScaleX;
    var getScaleY = MatrixTransformer.getScaleY;
    var setScaleY = MatrixTransformer.setScaleY;
    
    this.__init__ = function()
    {
        this.__target = null;
        this.__colorTransform = new ColorTransform();
        this.__matrix = new Matrix();
        this.__modified = true;
    };
    this.__getX = function()
    {
        return this.__matrix.tx;
    };
    this.__setX = function(v)
    {
        this.__matrix.tx = v;
        this.__modified = true;
    };
    this.__getY = function()
    {
        return this.__matrix.ty;
    };
    this.__setY = function(v)
    {
        this.__matrix.ty = v;
        this.__modified = true;
    };
    this.__getRotation = function(v)
    {
        return getRotation(this.__matrix);
    };
    this.__setRotation = function(v)
    {
        setRotation(this.__matrix, v);
        this.__modified = true;
    };
    this.__getScaleX = function()
    {
        return getScaleX(this.__matrix);
    };
    this.__setScaleX = function(v)
    {
        setScaleX(this.__matrix, v);
        this.__modified = true;
    };
    this.__getScaleY = function()
    {
        return getScaleY(this.__matrix);
    };
    this.__setScaleY = function(v)
    {
        setScaleY(this.__matrix, v);
        this.__modified = true;
    };
    
    /* getters and setters */
    this.getConcatenatedColorTransform = function()
    {
        var target = this.__target;
        if (target && target.__parent) {
            var concatenated = this.__colorTransform.clone();
            concatenated.concat(target.__parent.__transform.getConcatenatedColorTransform());
            return concatenated;
        }
        else {
            return this.__colorTransform.clone();
        }
    };
    this.getColorTransform = function()
    {
        return this.__colorTransform.clone();
    };
    this.setColorTransform = function(v)
    {
        this.__colorTransform = v.clone();
        this.__modified = true;
    };
    this.getConcatenatedMatrix = function()
    {
        var target = this.__target;
        if (target && target.__parent) {
            var concatenated = this.__matrix.clone();
            concatenated.concat(target.__parent.__transform.getConcatenatedMatrix());
            return concatenated;
        }
        else {
            return this.__matrix.clone();
        }
    };
    this.getMatrix = function()
    {
        return this.__matrix.clone();
    };
    this.setMatrix = function(v)
    {
        this.__matrix = v.clone();
        this.__modified = true;
    };
    this.getPixelBounds = function()
    {
        var target = this.__target;
        if (target) {
            return target.__getBounds();
        }
        return new Rectangle();
    };
});
Transform.prototype.__defineGetter__("concatenatedColorTransform", Transform.prototype.getConcatenatedColorTransform);
Transform.prototype.__defineGetter__("colorTransform", Transform.prototype.getColorTransform);
Transform.prototype.__defineSetter__("colorTransform", Transform.prototype.setColorTransform);
Transform.prototype.__defineGetter__("concatenatedMatrix", Transform.prototype.getConcatenatedMatrix);
Transform.prototype.__defineGetter__("matrix", Transform.prototype.getMatrix);
Transform.prototype.__defineSetter__("matrix", Transform.prototype.setMatrix);
Transform.prototype.__defineGetter__("pixelBounds", Transform.prototype.getPixelBounds);
Transform.prototype.toString = function()
{
    return '[object Transform]';
};
