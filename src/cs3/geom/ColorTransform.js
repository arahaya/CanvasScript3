var ColorTransform = new Class(Object, function()
{
    this.__init__ = function(redMultiplier, greenMultiplier, blueMultiplier, alphaMultiplier, redOffset, greenOffset, blueOffset, alphaOffset)
    {
        this.redMultiplier   = (redMultiplier   !== undefined) ? redMultiplier   : 1;
        this.greenMultiplier = (greenMultiplier !== undefined) ? greenMultiplier : 1;
        this.blueMultiplier  = (blueMultiplier  !== undefined) ? blueMultiplier  : 1;
        this.alphaMultiplier = (alphaMultiplier !== undefined) ? alphaMultiplier : 1;
        this.redOffset       = (redOffset)   ? redOffset   : 0;
        this.greenOffset     = (greenOffset) ? greenOffset : 0;
        this.blueOffset      = (blueOffset)  ? blueOffset  : 0;
        this.alphaOffset     = (alphaOffset) ? alphaOffset : 0;
    };
    this.clone = function()
    {
        return new ColorTransform(this.redMultiplier, this.greenMultiplier, this.blueMultiplier, this.alphaMultiplier, this.redOffset, this.greenOffset, this.blueOffset, this.alphaOffset);
    };
    this.concat = function(second)
    {
        this.redOffset   += second.redOffset   * this.redMultiplier;
        this.greenOffset += second.greenOffset * this.greenMultiplier;
        this.blueOffset  += second.blueOffset  * this.blueMultiplier;
        this.alphaOffset += second.alphaOffset * this.alphaMultiplier;
        this.redMultiplier   *= second.redMultiplier;
        this.greenMultiplier *= second.greenMultiplier;
        this.blueMultiplier  *= second.blueMultiplier;
        this.alphaMultiplier *= second.alphaMultiplier;
    };
    this.transformColor = function(color)
    {
        var a = Math.min((color >> 24 & 0xFF) * this.alphaMultiplier + this.alphaOffset, 255);
        var r = Math.min((color >> 16 & 0xFF) * this.redMultiplier + this.redOffset, 255);
        var g = Math.min((color >> 8  & 0xFF) * this.greenMultiplier + this.greenOffset, 255);
        var b = Math.min((color & 0xFF) * this.blueMultiplier + this.blueOffset, 255);
        return ((a << 24) | (r << 16) | (g << 8) | b) >>> 0;
    };
    this.getColor = function()
    {
        return ((this.alphaOffset << 24) | (this.redOffset << 16) | (this.greenOffset << 8) | this.blueOffset) >>> 0;
    };
    this.setColor = function(v)
    {
        this.alphaMultiplier = 0;
        this.redMultiplier   = 0;
        this.greenMultiplier = 0;
        this.blueMultiplier  = 0;
        this.alphaOffset = v >> 24 & 0xFF;
        this.redOffset   = v >> 16 & 0xFF;
        this.greenOffset = v >> 8  & 0xFF;
        this.blueOffset  = v & 0xFF;
    };
});
ColorTransform.prototype.__defineGetter__("color", ColorTransform.prototype.getColor);
ColorTransform.prototype.__defineSetter__("color", ColorTransform.prototype.setColor);
ColorTransform.prototype.toString = function()
{
    return '(redMultiplier=' + this.redMultiplier + ', greenMultiplier=' + this.greenMultiplier +
        ', blueMultiplier=' + this.blueMultiplier + ', alphaMultiplier=' + this.alphaMultiplier +
        ', redOffset=' + this.redOffset + ', greenOffset=' + this.greenOffset +
        ', blueOffset=' + this.blueOffset + ', alphaOffset=' + this.alphaOffset + ')';
};
