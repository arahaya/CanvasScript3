var MatrixTransformer = new Class(Object, function()
{
});
MatrixTransformer.prototype.toString = function()
{
    return '[object MatrixTransformer]';
};
MatrixTransformer.getScaleX = function(m)
{
    return Math.sqrt(m.a * m.a + m.b * m.b);
};
MatrixTransformer.setScaleX = function(m, scaleX)
{
    var a = m.a;
    var b = m.b;
    var old = Math.sqrt(a * a + b * b);
    if (old) {
        var ratio = scaleX / old;
        m.a *= ratio;
        m.b *= ratio;
    }
    else {
        var skewY = Math.atan2(b, a);
        m.a = Math.cos(skewY) * scaleX;
        m.b = Math.sin(skewY) * scaleX;
    }
};
MatrixTransformer.getScaleY = function(m)
{
    return Math.sqrt(m.c * m.c + m.d * m.d);
};
MatrixTransformer.setScaleY = function(m, scaleY)
{
    var c = m.c;
    var d = m.d;
    var old = Math.sqrt(c * c + d * d);
    if (old) {
        var ratio = scaleY / old;
        m.c *= ratio;
        m.d *= ratio;
    }
    else {
        var skewX = Math.atan2(-c, d);
        m.c = -Math.sin(skewX) * scaleY;
        m.d =  Math.cos(skewX) * scaleY;
    }
};
MatrixTransformer.getSkewXRadians = function(m)
{
    return Math.atan2(-m.c, m.d);
};
MatrixTransformer.setSkewXRadians = function(m, skewX)
{
    var scaleY = Math.sqrt(m.c * m.c + m.d * m.d);
    m.c = -scaleY * Math.sin(skewX);
    m.d =  scaleY * Math.cos(skewX);
};
MatrixTransformer.getSkewYRadians = function(m)
{
    return Math.atan2(m.b, m.a);
};
MatrixTransformer.setSkewYRadians = function(m, skewY)
{
    var scaleX = Math.sqrt(m.a * m.a + m.b * m.b);
    m.a = scaleX * Math.cos(skewY);
    m.b = scaleX * Math.sin(skewY);
};
MatrixTransformer.getSkewX = function(m)
{
    return Math.atan2(-m.c, m.d) * 57.29577951308232;
};
MatrixTransformer.setSkewX = function(m, skewX)
{
    MatrixTransformer.setSkewXRadians(m, skewX * 0.017453292519943295);
};
MatrixTransformer.getSkewY = function(m)
{
    return Math.atan2(m.b, m.a) * 57.29577951308232;
};
MatrixTransformer.setSkewY = function(m, skewY)
{
    MatrixTransformer.setSkewYRadians(m, skewY * 0.017453292519943295);
};
MatrixTransformer.getRotationRadians = function(m)
{
    return Math.atan2(m.b, m.a);
};
MatrixTransformer.setRotationRadians = function(m, rotation)
{
    var a = m.a;
    var b = m.b;
    var c = m.c;
    var d = m.d;
    var oldRotation = Math.atan2(b, a);
    var oldSkewX = Math.atan2(-c, d);
    var skewX = oldSkewX + rotation - oldRotation;
    var skewY = rotation;
    var scaleY = Math.sqrt(c * c + d * d);
    var scaleX = Math.sqrt(a * a + b * b);
    m.c = -scaleY * Math.sin(skewX);
    m.d =  scaleY * Math.cos(skewX);
    m.a =  scaleX * Math.cos(skewY);
    m.b =  scaleX * Math.sin(skewY);
};
MatrixTransformer.getRotation = function(m)
{
    return Math.atan2(m.b, m.a) * 57.29577951308232;
};
MatrixTransformer.setRotation = function(m, rotation)
{
    MatrixTransformer.setRotationRadians(m, rotation * 0.017453292519943295);
};
MatrixTransformer.rotateAroundInternalPoint = function(m, x, y, angleDegrees)
{
    var point = new Point(x, y);
    point = m.transformPoint(point);
    m.tx -= point.x;
    m.ty -= point.y;
    m.rotate(angleDegrees * 0.017453292519943295);
    m.tx += point.x;
    m.ty += point.y;
};
MatrixTransformer.rotateAroundExternalPoint = function(m, x, y, angleDegrees)
{
    m.tx -= x;
    m.ty -= y;
    m.rotate(angleDegrees * 0.017453292519943295);
    m.tx += x;
    m.ty += y;
};
MatrixTransformer.matchInternalPointWithExternal = function(m, internalPoint, externalPoint)
{
    var point = m.transformPoint(internalPoint);
    m.tx += externalPoint.x - point.x;
    m.ty += externalPoint.y - point.y;
};
