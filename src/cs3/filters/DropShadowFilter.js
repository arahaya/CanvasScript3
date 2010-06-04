var DropShadowFilter = new Class(ContextFilter, function()
{
    this.__init__ = function(distance, angle, color, alpha, blur)
    {
        this.alpha    = alpha    || 1;
        this.blur     = blur     || 4;
        this.color    = color     | 0;
        this.distance = distance || 4;
        this.angle    = angle    || 45;
    };
    //override
    this.__filter = function(context, target)
    {
        var radian = this.angle * 0.017453292519943295;
        context.shadowBlur = this.blur;
        context.shadowColor = __toRGBA(((this.alpha * 255) << 24) + this.color);
        context.shadowOffsetX = this.distance * Math.cos(radian);
        context.shadowOffsetY = this.distance * Math.sin(radian);
    };
    //override
    this.clone = function()
    {
        return new DropShadowFilter(this.distance, this.angle, this.color, this.alpha, this.blur);
    };
});
DropShadowFilter.prototype.toString = function()
{
    return '[object DropShadowFilter]';
};
