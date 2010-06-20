var Rectangle = new Class(Object, function()
{
    this.__init__ = function(x, y, width, height)
    {
        this.x = (x) ? x : 0;
        this.y = (y) ? y : 0;
        this.width  = (width)  ? width  : 0;
        this.height = (height) ? height : 0;
    };
    this.clone = function()
    {
        return new Rectangle(this.x, this.y, this.width, this.height);
    };
    this.contains = function(x, y)
    {
        return (
            this.x <= x &&
            this.y <= y &&
            this.x + this.width > x &&
            this.y + this.height > y) ? true : false;
    };
    this.containsPoint = function(point)
    {
        return this.contains(point.x, point.y);
    };
    this.containsRect = function(rect)
    {
        return (
            this.x <= rect.x &&
            this.y <= rect.y &&
            this.x + this.width >= rect.x + rect.width &&
            this.y + this.height >= rect.y + rect.height) ? true : false;
    };
    this.equals = function(toCompare)
    {
        return (
            toCompare.x === this.x &&
            toCompare.y === this.y &&
            toCompare.width === this.width &&
            toCompare.height === this.height) ? true : false;
    };
    this.inflate = function(dx, dy)
    {
        this.x -= dx;
        this.width += 2 * dx;
        this.y -= dy;
        this.height += 2 * dy;
    };
    this.inflatePoint = function(point)
    {
        return this.inflate(point.x, point.y);
    };
    this.intersection = function(toIntersect)
    {
        var x1 = this.x;
        var y1 = this.y;
        var w1 = this.width;
        var h1 = this.height;
        var x2 = toIntersect.x;
        var y2 = toIntersect.y;
        var w2 = toIntersect.width;
        var h2 = toIntersect.height;
        
        if (w1 <= 0 || h1 <= 0 || w2 <= 0 || h2 <= 0) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        var l = (x1 > x2) ? x1 : x2;
        var r = (x1 + w1 < x2 + w2) ? x1 + w1 : x2 + w2;
        
        if (l >= r) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        var t = (y1 > y2) ? y1 : y2;
        var b = (y1 + h1 < y2 + h2) ? y1 + h1 : y2 + h2;
        
        if (t >= b) {
            return new Rectangle(0, 0, 0, 0);
        }
        
        return new Rectangle(l, t, r - l, b - t);
    };
    this.intersects = function(toIntersect)
    {
        var x1 = this.x;
        var y1 = this.y;
        var w1 = this.width;
        var h1 = this.height;
        var x2 = toIntersect.x;
        var y2 = toIntersect.y;
        var w2 = toIntersect.width;
        var h2 = toIntersect.height;
        
        if (w1 <= 0 || h1 <= 0 || w2 <= 0 || h2 <= 0) {
            return false;
        }
        
        return (x1 <= x2 + w2 &&
                x2 <= x1 + w1 &&
                y1 <= y2 + h2 &&
                y2 <= y1 + h1) ? true : false;
    };
    this.isEmpty = function()
    {
        return (this.width <= 0 || this.height <= 0) ? true : false;
    };
    this.offset = function(dx, dy)
    {
        this.x += dx;
        this.y += dy;
    };
    this.offsetPoint = function(point)
    {
        this.x += point.x;
        this.y += point.y;
    };
    this.repair = function()
    {
        if (this.width < 0) {
            this.width = -this.width;
            this.x -= this.width;
        }
        if (this.height < 0) {
            this.height = -this.height;
            this.y -= this.height;
        }
    };
    this.setEmpty = function()
    {
        this.x = this.y = this.width = this.height = 0;
    };
    this.union = function(toUnion)
    {
        var x1 = this.x;
        var y1 = this.y;
        var w1 = this.width;
        var h1 = this.height;
        var x2 = toUnion.x;
        var y2 = toUnion.y;
        var w2 = toUnion.width;
        var h2 = toUnion.height;
        
        if (w1 <= 0 || h1 <= 0) {
            return toUnion.clone();
        }
        
        if (w2 <= 0 || h2 <= 0) {
            return this.clone();
        }
        
        var l = (x1 < x2) ? x1 : x2;
        var r = (x1 + w1 > x2 + w2) ? x1 + w1 : x2 + w2;
        var t = (y1 < y2) ? y1 : y2;
        var b = (y1 + h1 > y2 + h2) ? y1 + h1 : y2 + h2;
        
        return new Rectangle(l, t, r - l, b - t);
    };
    
    /* getters and setters */
    this.__get__top = function()
    {
        return this.y;
    };
    this.__get__right = function()
    {
        return this.x + this.width;
    };
    this.__get__bottom = function()
    {
        return this.y + this.height;
    };
    this.__get__left = function()
    {
        return this.x;
    };
    this.__get__topLeft = function()
    {
        return new Point(this.x, this.y);
    };
    this.__set__topLeft = function(v)
    {
        this.x = v.x;
        this.y = v.y;
    };
    this.__get__bottomRight = function()
    {
        return new Point(this.x + this.width, this.y + this.height);
    };
    this.__set__bottomRight = function(v)
    {
        this.width = v.x - this.x;
        this.height = v.y - this.y;
    };
    this.__get__size = function()
    {
        return new Point(this.width, this.height);
    };
    this.__set__size = function(v)
    {
        this.width = v.x;
        this.height = v.y;
    };
    
    this.toString = function()
    {
        return '(x=' + this.x + ', y=' + this.y + ', w=' + this.width + ', h=' + this.height + ')';
    };
});
