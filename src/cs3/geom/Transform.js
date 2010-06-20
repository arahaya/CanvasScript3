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
        this.__modified = false;
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
    this.__get__concatenatedColorTransform = function()
    {
        var target = this.__target;
        if (target && target.__parent) {
            var concatenated = this.__colorTransform.clone();
            concatenated.concat(target.__parent.__transform.__get__concatenatedColorTransform());
            return concatenated;
        }
        else {
            return this.__colorTransform.clone();
        }
    };
    this.__get__colorTransform = function()
    {
        return this.__colorTransform.clone();
    };
    this.__set__colorTransform = function(v)
    {
        this.__colorTransform = v.clone();
        this.__modified = true;
    };
    this.__get__concatenatedMatrix = function()
    {
        var target = this.__target;
        if (target && target.__parent) {
            var concatenated = this.__matrix.clone();
            concatenated.concat(target.__parent.__transform.__get__concatenatedMatrix());
            return concatenated;
        }
        else {
            return this.__matrix.clone();
        }
    };
    this.__get__matrix = function()
    {
        return this.__matrix.clone();
    };
    this.__set__matrix = function(v)
    {
        this.__matrix = v.clone();
        this.__modified = true;
    };
    this.__get__pixelBounds = function()
    {
        var target = this.__target;
        if (target) {
            return target.__getBounds();
        }
        return new Rectangle();
    };
    
    this.toString = function()
    {
        return '[object Transform]';
    };
});
