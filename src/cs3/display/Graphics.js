var Graphics = new Class(Object, function()
{
    var BEGIN_BITMAP_FILL = 0;
    var BEGIN_FILL = 1;
    var BIGIN_GRADIENT_FILL = 2;
    var CLEAR = 3;
    var CURVE_TO = 4;
    var DRAW_CIRCLE = 5;
    var DRAW_ELLIPSE = 6;
    var DRAW_RECT = 7;
    var DRAW_ROUND_RECT = 8;
    var END_FILL = 9;
    var LINE_GRADIENT_STYLE = 10;
    var LINE_STYLE = 11;
    var LINE_TO = 12;
    var MOVE_TO = 13;
    this.__init__ = function()
    {
        this.__lineWidth = 0;
        this.__strokeStyle = null;
        this.__fillStyle = null;
        this.__x = 0;
        this.__y = 0;
        this.__rect = new Rectangle();
        this.__commands = [];
        this.__lastCommands = [];
    };
    this.__updateRect = function(x, y, width, height)
    {
        var rect = new Rectangle(x, y, width, height);
        rect.repair();
        //TODO: consider line caps
        rect.inflate(this.__lineWidth * 0.5, this.__lineWidth * 0.5);
        this.__rect = this.__rect.union(rect);
    };
    this.beginBitmapFill = function(bitmap, matrix, repeat, smooth)
    {
        //TODO:
    };
    this.beginFill = function(color, alpha)
    {
        if (alpha === undefined) { alpha = 1; }
        this.__commands.push([BEGIN_FILL, __toRGB(color), alpha]);
    };
    this.beginGradientFill = function(type, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio)
    {
        //TODO:
    };
    this.curveTo = function(controlX, controlY, anchorX, anchorY)
    {
        //TODO: calculate rect
        this.__updateRect(this.__x, this.__y, Math.max(controlX, anchorX) - this.__x, Math.max(controlY, anchorY) - this.__y);
        this.__x = anchorX;
        this.__y = anchorY;
        this.__commands.push([CURVE_TO, controlX, controlY, anchorX, anchorY]);
        this.__modified = true;
    };
    this.drawEllipse = function(x, y, width, height)
    {
        this.__updateRect(x, y, width, height);
        this.__x = x + width;
        this.__y = y + height / 2;
        this.__commands.push([DRAW_ELLIPSE, x, y, width, height]);
        this.__modified = true;
    };
    this.drawCircle = function(x, y, radius)
    {
        this.__updateRect(x - radius, y - radius, radius * 2, radius * 2);
        this.__x = x + radius;
        this.__y = y;
        this.__commands.push([DRAW_CIRCLE, x, y, radius]);
        this.__modified = true;
    };
    this.drawRect = function(x, y, width, height)
    {
        this.__updateRect(x, y, width, height);
        this.__x = x;
        this.__y = y;
        this.__commands.push([DRAW_RECT, x, y, width, height]);
        this.__modified = true;
    };
    this.drawRoundRect = function(x, y, width, height, ellipseWidth, ellipseHeight)
    {
        if (ellipseHeight === undefined) { ellipseHeight = ellipseWidth; }
        this.__updateRect(x, y, width, height);
        this.__x = x + width;
        this.__y = y + height - ellipseHeight / 2;
        this.__commands.push([DRAW_ROUND_RECT, x, y, width, height, ellipseWidth, ellipseHeight]);
        this.__modified = true;
    };
    this.endFill = function()
    {
        this.__commands.push([END_FILL]);
        this.__modified = true;
    };
    this.lineGradientStyle = function(type, colors, alphas, ratios, matrix, spreadMethod, interpolationMethod, focalPointRatio)
    {
        
    };
    this.lineStyle = function(thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit)
    {
        if (color === undefined) { color = 0; }
        if (alpha === undefined) { alpha = 1; }
        if (pixelHinting == undefined) { pixelHinting = true; }
        if (scaleMode === undefined) { scaleMode = 'normal'; }
        if (caps === undefined) { caps = CapsStyle.ROUND; }
        if (joints === undefined) { joints = JointStyle.ROUND; }
        if (miterLimit === undefined) { miterLimit = 3; }
        this.__lineWidth = thickness;
        this.__commands.push([LINE_STYLE, thickness, __toRGB(color), alpha, pixelHinting, scaleMode, caps, joints, miterLimit]);
    };
    this.moveTo = function(x, y)
    {
        this.__x = x;
        this.__y = y;
        this.__commands.push([MOVE_TO, x, y]);
    };
    this.lineTo = function(x, y)
    {
        this.__updateRect(this.__x, this.__y, x - this.__x, y - this.__y);
        this.__x = x;
        this.__y = y;
        this.__commands.push([LINE_TO, x, y]);
        this.__modified = true;
    };
    this.clear = function()
    {
        this.__rect.setEmpty();
        this.__commands = [];
        this.__modified = true;
    };
    this.__fill = function(context, fillAlpha)
    {
        context.closePath();

        if (fillAlpha === 1) {
            context.fill();
        }
        else if (fillAlpha !== 0) {
            var alpha = context.globalAlpha;
            context.globalAlpha *= fillAlpha;
            context.fill();
            context.globalAlpha = alpha;
        }
    };
    this.__stroke = function(context, strokeAlpha)
    {
        if (strokeAlpha === 1) {
            context.stroke();
        }
        else if (strokeAlpha !== 0) {
            var alpha = context.globalAlpha;
            context.globalAlpha *= strokeAlpha;
            context.stroke();
            context.globalAlpha = alpha;
        }
    };
    this.__closeStroke = function(context, sx, sy, ax, ay)
    {
        if (sx !== ax || sy !== ay) {
            context.lineTo(sx, sy);
        }
    };
    this.__render = function(context, matrix, colorTransform)
    {
        //TODO: optimize
        var doFill = false;
        var fillAlpha = 1;
        var doStroke = false;
        var strokeAlpha = 1;
        //this is the position where the last graphics.beginFill was called
        //it is used to close stroke path.
        var sx = 0, sy = 0;
        //current anchor position.
        //used for moveTo after any context.beginPath
        var ax = 0, ay = 0;
        
        var commands = this.__commands;
        var commandLength = commands.length;
        
        //a lot of declarations to avoid redeclarations
        var cmd, i, ii;
        var color, alpha;
        var thickness, pixelHinting, scaleMode, caps, joints, miterLimit;
        var controlX, controlY, anchorX, anchorY;
        var x, y, radius;
        var widht, height;
        var ellipseWidth, ellipseHeight;
        var xRadius, yRadius, centerX, centerY, angleDelta, xCtrlDist, yCtrlDist, rx, ry, angle;
        var right, bottom;
        
        //fill phase
        context.beginPath();
        context.moveTo(0, 0);
        for (i = 0, l = commandLength; i < l; ++i)
        {
            cmd = commands[i];
            switch (cmd[0])
            {
                case BEGIN_FILL:
                    if (doFill) { this.__fill(context, fillAlpha); }
                    color = cmd[1];
                    alpha = cmd[2];
                    doFill = true;
                    fillAlpha = alpha;
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.fillStyle = color;
                    break;
                case CURVE_TO:
                    controlX = cmd[1];
                    controlY = cmd[2];
                    anchorX = cmd[3];
                    anchorY = cmd[4];
                    context.quadraticCurveTo(controlX, controlY, anchorX, anchorY);
                    ax = anchorX;
                    ay = anchorY;
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    radius = cmd[3];
                    context.moveTo(x + radius, y);
                    context.arc(x, y, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
                    ax = x + radius;
                    ay = y;
                    break;
                case DRAW_ELLIPSE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    xRadius = width / 2;
                    yRadius = height / 2;
                    centerX = x + xRadius;
                    centerY = y + yRadius;
                    angleDelta = 0.7853981633974483;/*Math.PI / 4*/
                    xCtrlDist = xRadius / 0.9238795325112867;/*Math.cos(angleDelta/2)*/
                    yCtrlDist = yRadius / 0.9238795325112867;
                    angle = 0;
                    context.moveTo(x + width, y + yRadius);
                    for (ii = 0; ii < 8; ii++)
                    {
                        angle += angleDelta;
                        rx = centerX + Math.cos(angle - 0.39269908169872414) * xCtrlDist;
                        ry = centerY + Math.sin(angle - 0.39269908169872414) * yCtrlDist;
                        ax = centerX + Math.cos(angle) * xRadius;
                        ay = centerY + Math.sin(angle) * yRadius;
                        context.quadraticCurveTo(rx, ry, ax, ay);
                    }
                    break;
                case DRAW_RECT:
                    //anchor at the top left
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    context.rect(x, y, width, height);
                    ax = x;
                    ay = y;
                    context.moveTo(ax, ay);
                    break;
                case DRAW_ROUND_RECT:
                    //anchor at the right bottom corner
                    x = cmd[1];
                    y = cmd[2];
                    width  = cmd[3];
                    height = cmd[4];
                    ellipseWidth  = cmd[5];
                    ellipseHeight = cmd[6];
                    right = x + width;
                    bottom = y + height;
                    ellipseWidth  /= 2;
                    ellipseHeight /= 2;
                    ax = right;
                    ay = bottom - ellipseHeight;
                    context.moveTo(ax, ay);
                    context.quadraticCurveTo(right, bottom, right - ellipseWidth, bottom);
                    context.lineTo(x + ellipseWidth, bottom);
                    context.quadraticCurveTo(x, bottom, x, bottom - ellipseHeight);
                    context.lineTo(x, y + ellipseHeight);
                    context.quadraticCurveTo(x, y, x + ellipseWidth, y);
                    context.lineTo(right - ellipseWidth, y);
                    context.quadraticCurveTo(right, y, right, y + ellipseHeight);
                    context.lineTo(ax, ay);
                    break;
                case END_FILL:
                    if (doFill) { this.__fill(context, fillAlpha); }
                    doFill = false;
                    break;
                case LINE_STYLE:
                    break;
                case LINE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.lineTo(x, y);
                    ax = x;
                    ay = y;
                    break;
                case MOVE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.moveTo(x, y);
                    ax = x;
                    ay = y;
                    break;
                default:
                    break;
            }
        }
        if (doFill) { this.__fill(context, fillAlpha); }
        
        //stroke phase
        sx = sy = ax = ay = 0;
        context.beginPath();
        context.moveTo(0, 0);
        for (i = 0, l = commandLength; i < l; ++i)
        {
            cmd = commands[i];
            switch (cmd[0])
            {
                case BEGIN_FILL:
                    if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
                    ax = sx;
                    ay = sy;
                    doFill = true;
                    break;
                case CURVE_TO:
                    controlX = cmd[1];
                    controlY = cmd[2];
                    anchorX = cmd[3];
                    anchorY = cmd[4];
                    context.quadraticCurveTo(controlX, controlY, anchorX, anchorY);
                    ax = anchorX;
                    ay = anchorY;
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    radius = cmd[3];
                    context.moveTo(x + radius, y);
                    context.arc(x, y, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
                    sx = ax = x + radius;
                    sy = ay = y;
                    break;
                case DRAW_ELLIPSE:
                    //anchor at the right edge
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    xRadius = width / 2;
                    yRadius = height / 2;
                    centerX = x + xRadius;
                    centerY = y + yRadius;
                    angleDelta = 0.7853981633974483;/*Math.PI / 4*/
                    xCtrlDist = xRadius / 0.9238795325112867;/*Math.cos(angleDelta/2)*/
                    yCtrlDist = yRadius / 0.9238795325112867;
                    angle = 0;
                    context.moveTo(x + width, y + yRadius);
                    for (ii = 0; ii < 8; ii++)
                    {
                        angle += angleDelta;
                        rx = centerX + Math.cos(angle - 0.39269908169872414) * xCtrlDist;
                        ry = centerY + Math.sin(angle - 0.39269908169872414) * yCtrlDist;
                        ax = centerX + Math.cos(angle) * xRadius;
                        ay = centerY + Math.sin(angle) * yRadius;
                        context.quadraticCurveTo(rx, ry, ax, ay);
                    }
                    sx = ax;
                    sy = ay;
                    break;
                case DRAW_RECT:
                    //anchor at the top left
                    x = cmd[1];
                    y = cmd[2];
                    width = cmd[3];
                    height = cmd[4];
                    context.rect(x, y, width, height);
                    sx = ax = x;
                    sy = ay = y;
                    context.moveTo(ax, ay);
                    break;
                case DRAW_ROUND_RECT:
                    //anchor at the right bottom corner
                    x = cmd[1];
                    y = cmd[2];
                    width  = cmd[3];
                    height = cmd[4];
                    ellipseWidth  = cmd[5];
                    ellipseHeight = cmd[6];
                    right = x + width;
                    bottom = y + height;
                    ellipseWidth  /= 2;
                    ellipseHeight /= 2;
                    ax = right;
                    ay = bottom - ellipseHeight;
                    context.moveTo(ax, ay);
                    context.quadraticCurveTo(right, bottom, right - ellipseWidth, bottom);
                    context.lineTo(x + ellipseWidth, bottom);
                    context.quadraticCurveTo(x, bottom, x, bottom - ellipseHeight);
                    context.lineTo(x, y + ellipseHeight);
                    context.quadraticCurveTo(x, y, x + ellipseWidth, y);
                    context.lineTo(right - ellipseWidth, y);
                    context.quadraticCurveTo(right, y, right, y + ellipseHeight);
                    context.lineTo(ax, ay);
                    sx = ax;
                    sy = ay;
                    break;
                case END_FILL:
                    if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
                    ax = sx;
                    ay = sy;
                    doFill = false;
                    break;
                case LINE_STYLE:
                    if (doStroke) { this.__stroke(context, strokeAlpha); }
                    thickness    = cmd[1];
                    color        = cmd[2];
                    alpha        = cmd[3];
                    pixelHinting = cmd[4];
                    scaleMode    = cmd[5];
                    caps         = cmd[6];
                    joints       = cmd[7];
                    miterLimit   = cmd[8];
                    doStroke = (thickness) ? true : false;
                    strokeAlpha = alpha;
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.lineWidth = thickness;
                    context.strokeStyle = color;
                    context.lineCap = caps;
                    context.lineJoin = joints;
                    context.miterLimit = miterLimit;
                    break;
                case LINE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.lineTo(x, y);
                    ax = x;
                    ay = y;
                    break;
                case MOVE_TO:
                    x = cmd[1];
                    y = cmd[2];
                    context.moveTo(x, y);
                    sx = ax = x;
                    sy = ay = y;
                    break;
                default:
                    break;
            }
        }
        if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
        if (doStroke) { this.__stroke(context, strokeAlpha); }
    };
});
Graphics.prototype.toString = function()
{
    return '[object Graphics]';
};
