var MouseEvent = new Class(Event, function()
{
    this.__init__ = function(type, bubbles, cancelable, localX, localY, relatedObject, ctrlKey, altKey, shiftKey, buttonDown, delta)
    {
        Event.call(this, type, bubbles, cancelable);
        this.altKey = (altKey) ? true : false;//not possible?
        this.ctrlKey = (ctrlKey) ? true : false;
        this.shiftKey = (shiftKey) ? true : false;
        this.buttonDown = (buttonDown) ? true : false;//when does this become true?
        this.delta = delta | 0;
        this.__localX = localX | 0;
        this.__localY = localY | 0;
        this.relatedObject = relatedObject || null;
    };
    this.clone = function()
    {
        return new MouseEvent(this.type, this.bubbles, this.cancelable,
            this.__localX, this.__localY, this.relatedObject, this.ctrlKey, this.altKey, this.shiftKey, this.buttonDown, this.delta);
    };
    this.updateAfterEvent = function()
    {
        //todo
    };
    
    this.getLocalX = function()
    {
        if (this.__localX !== null) {
            return this.__localX;
        }
        return this.currentTarget.getMouseX();
    };
    this.getLocalY = function()
    {
        if (this.__localY !== null) {
            return this.__localY;
        }
        return this.currentTarget.getMouseY();
    };
    this.getStageX = function()
    {
        if (this.__localX !== null) {
            return this.currentTarget.localToGlobal(new Point(this.__localX, 0)).x;
        }
        return this.target.__stage.__mouseX;
    };
    this.getStageY = function()
    {
        if (this.__localY !== null) {
            return this.currentTarget.localToGlobal(new Point(this.__localY, 0)).y;
        }
        return this.currentTarget.__stage.__mouseY;
    };
});
MouseEvent.prototype.__defineGetter__("localX", MouseEvent.prototype.getLocalX);
MouseEvent.prototype.__defineGetter__("localY", MouseEvent.prototype.getLocalY);
MouseEvent.prototype.__defineGetter__("stageX", MouseEvent.prototype.getStageX);
MouseEvent.prototype.__defineGetter__("stageY", MouseEvent.prototype.getStageY);
MouseEvent.CLICK = 'click';
MouseEvent.DOUBLE_CLICK = 'doubleClick';
MouseEvent.MOUSE_DOWN = 'mouseDown';
MouseEvent.MOUSE_MOVE = 'mouseMove';
MouseEvent.MOUSE_OUT = 'mouseOut';
MouseEvent.MOUSE_OVER = 'mouseOver';
MouseEvent.MOUSE_UP = 'mouseUp';
MouseEvent.MOUSE_WHEEL = 'mouseWheel';
MouseEvent.ROLL_OUT = 'rollOut';
MouseEvent.ROLL_OVER = 'rollOver';
MouseEvent.prototype.toString = function()
{
    return '[MouseEvent type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable + ']';
};
