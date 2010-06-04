var Point = new Class(Object, function()
{
    this.__init__ = function(x, y)
    {
        this.x = (x) ? x : 0;
        this.y = (y) ? y : 0;
    };
    this.add = function(v)
    {
        return new Point(this.x + v.x, this.y + v.y);
    };
    this.clone = function()
    {
        return new Point(this.x, this.y);
    };
    this.equals = function(toCompare)
    {
        return (toCompare.x === this.x && toCompare.y === this.y) ? true : false;
    };
    this.normalize = function(thickness)
    {
        var x = this.x;
        var y = this.y;
        var l = this.length;
        if (l > 0) {
            var f = length / l;
            x *= f;
            y *= f;
        }
        return new Point(x, y);
    };
    this.offset = function(dx, dy)
    {
        return new Point(this.x + dx, this.y + dy);
    };
    this.subtract = function(v)
    {
        return new Point(this.x - v.x, this.y - v.y);
    };
    
    /* getters and setters */
    this.getLength = function()
    {
        return Math.sqrt(this._x * this._x + this._y * this._y);
    };
});
Point.prototype.__defineGetter__("length", Point.prototype.getLength);
Point.prototype.toString = function()
{
    return '(x=' + this.x + ', y=' + this.y + ')';
};
Point.distance = function(pt1, pt2)
{
    var dx = pt2.x - pt1.x;
    var dy = pt2.y - pt1.y;
    return Math.sqrt(dx * dx + dy * dy);
};
Point.interpolate = function(pt1, pt2, f)
{
    return new Point(f * pt1.x + (1 - f) * pt2.x, f * pt1.y + (1 - f) * pt2.y);
};
Point.polar = function(len, angle)
{
    return new Point(len * Math.cos(angle), len * Math.sin(angle));
};
