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
        this.__x = 0;
        this.__y = 0;
        this.__rect = new Rectangle();
        this.__commands = [];
        this.__modified = false;
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
        this.__commands.push([BEGIN_FILL, color, alpha]);
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
        this.__commands.push([LINE_STYLE, thickness, color, alpha, pixelHinting, scaleMode, caps, joints, miterLimit]);
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
    
    this.__render = function(context, colorTransform)
    {
        //TODO: optimize
        var doFill = false;
        var fillAlpha = 1;
        var doStroke = false;
        var strokeAlpha = 1;
        var hasStroke = false;
        //this is the position where the last graphics.beginFill was called
        //it is used to close stroke path.
        var sx = 0, sy = 0;
        //current anchor position.
        //used for moveTo after any context.beginPath
        var ax = 0, ay = 0;
        
        var commands = this.__commands;
        var commandLength = commands.length;
        
        //a lot of declarations to avoid redeclarations
        var cmd, type, i, ii;
        var thickness, pixelHinting, scaleMode;
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
            type = cmd[0];
            switch (type)
            {
                case LINE_TO:
                    ax = cmd[1];
                    ay = cmd[2];
                    context.lineTo(ax, ay);
                    break;
                case MOVE_TO:
                    ax = cmd[1];
                    ay = cmd[2];
                    context.moveTo(ax, ay);
                    break;
                case BEGIN_FILL:
                    if (doFill) { this.__fill(context, fillAlpha); }
                    doFill = true;
                    fillAlpha = cmd[2];
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.fillStyle = (colorTransform) ?
                            __toRGB(colorTransform.transformColor(cmd[1])) :
                            __toRGB(cmd[1]);
                    break;
                case LINE_STYLE:
                    hasStroke = true;
                    break;
                case CURVE_TO:
                    ax = cmd[3];
                    ay = cmd[4];
                    context.quadraticCurveTo(cmd[1], cmd[2], ax, ay);
                    break;
                case END_FILL:
                    if (doFill) { this.__fill(context, fillAlpha); }
                    doFill = false;
                    break;
                case DRAW_RECT:
                    //anchor at the top left
                    ax = cmd[1];
                    ay = cmd[2];
                    context.rect(ax, ay, cmd[3], cmd[4]);
                    context.moveTo(ax, ay);
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    radius = cmd[3];
                    ax = x + radius;
                    ay = cmd[2];
                    context.moveTo(ax, ay);
                    context.arc(x, ay, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
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
                default:
                    break;
            }
        }
        if (doFill) { this.__fill(context, fillAlpha); }
        
        //stroke phase
        if (!hasStroke) { return; }
        sx = sy = ax = ay = 0;
        context.beginPath();
        context.moveTo(0, 0);
        for (i = 0, l = commandLength; i < l; ++i)
        {
            cmd = commands[i];
            type = cmd[0];
            switch (type)
            {
                case LINE_TO:
                    ax = cmd[1];
                    ay = cmd[2];
                    context.lineTo(ax, ay);
                    break;
                case MOVE_TO:
                    sx = ax = cmd[1];
                    sy = ay = cmd[2];
                    context.moveTo(ax, ay);
                    break;
                case BEGIN_FILL:
                    if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
                    ax = sx;
                    ay = sy;
                    doFill = true;
                    break;
                case LINE_STYLE:
                    if (doStroke) { this.__stroke(context, strokeAlpha); }
                    thickness    = cmd[1];
                    //pixelHinting = cmd[4];
                    //scaleMode    = cmd[5];
                    doStroke = (thickness) ? true : false;
                    strokeAlpha = cmd[3];
                    context.beginPath();
                    context.moveTo(ax, ay);
                    context.lineWidth = thickness;
                    context.strokeStyle = (colorTransform) ?
                            __toRGB(colorTransform.transformColor(cmd[2])) :
                            __toRGB(cmd[2]);
                    context.lineCap = cmd[6];
                    context.lineJoin = cmd[7];
                    context.miterLimit = cmd[8];
                    break;
                case CURVE_TO:
                    ax = cmd[3];
                    ay = cmd[4];
                    context.quadraticCurveTo(cmd[1], cmd[2], ax, ay);
                    break;
                case END_FILL:
                    if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
                    ax = sx;
                    ay = sy;
                    doFill = false;
                    break;
                case DRAW_RECT:
                    //anchor at the top left
                    sx = ax = cmd[1];
                    sy = ay = cmd[2];
                    context.rect(ax, ay, cmd[3], cmd[4]);
                    context.moveTo(ax, ay);
                    break;
                case DRAW_CIRCLE:
                    //anchor at the right edge
                    x = cmd[1];
                    radius = cmd[3];
                    sx = ax = x + radius;
                    sy = ay = cmd[2];
                    context.moveTo(ax, ay);
                    context.arc(x, ay, radius, 0, 6.283185307179586/*Math.PI*2*/, false);
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
                default:
                    break;
            }
        }
        if (doFill) { this.__closeStroke(context, sx, sy, ax, ay); }
        if (doStroke) { this.__stroke(context, strokeAlpha); }
    };
    
    this.toString = function()
    {
        return '[object Graphics]';
    };
});
