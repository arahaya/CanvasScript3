var Matrix = new Class(Object, function()
{
    this.__init__ = function(a, b, c, d, tx, ty)
    {
        this.a  = (a !== undefined) ? a : 1;
        this.b  = (b) ? b : 0;
        this.c  = (c) ? c : 0;
        this.d  = (d !== undefined) ? d : 1;
        this.tx = (tx) ? tx : 0;
        this.ty = (ty) ? ty : 0;
    };
    this.concat = function(m)
    {
        var a1  = this.a;
        var b1  = this.b;
        var c1  = this.c;
        var d1  = this.d;
        var tx1 = this.tx;
        var ty1 = this.ty;
        var a2  = m.a;
        var b2  = m.b;
        var c2  = m.c;
        var d2  = m.d;
        var tx2 = m.tx;
        var ty2 = m.ty;
        
        this.a  = a1  * a2 + b1  * c2;
        this.b  = a1  * b2 + b1  * d2;
        this.c  = c1  * a2 + d1  * c2;
        this.d  = c1  * b2 + d1  * d2;
        this.tx = tx1 * a2 + ty1 * c2 + tx2;
        this.ty = tx1 * b2 + ty1 * d2 + ty2;
    };
    this.clone = function()
    {
        return new Matrix(this.a, this.b, this.c, this.d, this.tx, this.ty);
    };
    this.identity = function()
    {
        this.a  = 1;
        this.b  = 0;
        this.c  = 0;
        this.d  = 1;
        this.tx = 0;
        this.ty = 0;
    };
    this.invert = function()
    {
        var a  = this.a;
        var b  = this.b;
        var c  = this.c;
        var d  = this.d;
        var tx = this.tx;
        var ty = this.ty;
        var det  = a * d - b * c;
        
        this.a  =  d / det;
        this.b  = -b / det;
        this.c  = -c / det;
        this.d  =  a / det;
        this.tx =  (c * ty - d * tx) / det;
        this.ty = -(a * ty - b * tx) / det;
    };
    this.rotate = function(angle)
    {
        var cos = Math.cos(angle);
        var sin = Math.sin(angle);
        var a  = this.a;
        var b  = this.b;
        var c  = this.c;
        var d  = this.d;
        var tx = this.tx;
        var ty = this.ty;

        this.a  =  a  * cos - b  * sin;
        this.b  =  b  * cos + a  * sin;
        this.c  =  c  * cos - d  * sin;
        this.d  =  d  * cos + c  * sin;
        this.tx =  tx * cos - ty * sin;
        this.ty =  ty * cos + tx * sin;
    };
    this.scale = function(sx, sy)
    {
        this.a  *= sx;
        this.b  *= sy;
        this.c  *= sx;
        this.d  *= sy;
        this.tx *= sx;
        this.ty *= sy;
    };
    this.deltaTransformPoint = function(point)
    {
        var x = point.x;
        var y = point.y;
        return new Point(
            x * this.a + y * this.c,
            x * this.b + y * this.d);
    };
    this.transformPoint = function(point)
    {
        var x = point.x;
        var y = point.y;
        return new Point(
            x * this.a + y * this.c + this.tx,
            x * this.b + y * this.d + this.ty);
    };
    this.transformRect = function(rect)
    {
        var a  = this.a;
        var b  = this.b;
        var c  = this.c;
        var d  = this.d;
        var tx = this.tx;
        var ty = this.ty;
        
        var rx = rect.x;
        var ry = rect.y;
        var rr = rx + rect.width;
        var rb = ry + rect.height;
        
        var nx1 = rx * a + ry * c + tx;
        var ny1 = rx * b + ry * d + ty;
        var nx2 = rr * a + ry * c + tx;
        var ny2 = rr * b + ry * d + ty;
        var nx3 = rr * a + rb * c + tx;
        var ny3 = rr * b + rb * d + ty;
        var nx4 = rx * a + rb * c + tx;
        var ny4 = rx * b + rb * d + ty;
        
        var left = nx1;
        if (left > nx2) { left = nx2; }
        if (left > nx3) { left = nx3; }
        if (left > nx4) { left = nx4; }
        
        var top = ny1;
        if (top > ny2) { top = ny2; }
        if (top > ny3) { top = ny3; }
        if (top > ny4) { top = ny4; }
        
        var right = nx1;
        if (right < nx2) { right = nx2; }
        if (right < nx3) { right = nx3; }
        if (right < nx4) { right = nx4; }
        
        var bottom = ny1;
        if (bottom < ny2) { bottom = ny2; }
        if (bottom < ny3) { bottom = ny3; }
        if (bottom < ny4) { bottom = ny4; }
        
        return new Rectangle(left, top, right - left, bottom - top);
    };
    this.translate = function(dx, dy)
    {
        this.tx += dx;
        this.ty += dy;
    };
    
    this.toString = function()
    {
        return '(a=' + this.a + ', b=' + this.b + ', c=' + this.c + ', d=' + this.d + ', tx=' + this.tx + ', ty=' + this.ty + ')';
    };
});
