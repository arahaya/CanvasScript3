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
    this.__generateRect = function(sourceRect)
    {
        //TODO figure out how blur effects the size
        var newRect = sourceRect.clone();
        var point = Point.polar(this.distance, this.angle * 0.017453292519943295);
        if (point.x > 0) {
            newRect.width += point.x;
        }
        else if (point.x < 0) {
            newRect.x += point.x;
            newRect.width -= point.x;
        }
        if (point.y > 0) {
            newRect.height += point.y;
        }
        else if (point.y < 0) {
            newRect.y += point.y;
            newRect.height -= point.y;
        }
        return newRect;
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
