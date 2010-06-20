var Event = new Class(Object, function()
{
    this.__init__ = function(type, bubbles, cancelable)
    {
        this.type = type;
        this.bubbles = (bubbles) ? true : false;
        this.cancelable = (cancelable) ? true : false;
        this.__preventDefault = false;
        this.__stopImmediatePropagation = false;
        this.__stopPropagation = false;
    };
    this.clone = function()
    {
        return new Event(this.type, this.bubbles, this.cancelable);
    };
    this.isDefaultPrevented = function()
    {
        return this.__preventDefault;
    };
    this.preventDefault = function()
    {
        this.__preventDefault = true;
    };
    this.stopImmediatePropagation = function()
    {
        this.__stopImmediatePropagation = true;
    };
    this.stopPropagation = function()
    {
        this.__stopPropagation = true;
    };
    
    this.toString = function()
    {
        return '[Event type=' + this.type + ' bubbles=' + this.bubbles + ' cancelable=' + this.cancelable + ']';
    };
});
Event.ACTIVATE = 'activate';
Event.ADDED = 'added';
Event.ADDED_TO_STAGE = 'addedToStage';
Event.CANCEL = 'cancel';
Event.CHANGE = 'change';
Event.CLOSE = 'close';
Event.COMPLETE = 'complete';
Event.CONNECT = 'connect';
Event.DEACTIVATE = 'deactivate';
Event.ENTER_FRAME = 'enterFrame';
Event.FULLSCREEN = 'fullScreen';
Event.ID3 = 'id3';
Event.INIT = 'init';
Event.MOUSE_LEAVE = 'mouseLeave';
Event.OPEN = 'open';
Event.REMOVED = 'removed';
Event.REMOVED_FROM_STAGE = 'removedFromStage';
Event.RENDER = 'render';
Event.RESIZE = 'resize';
Event.SCROLL = 'scroll';
Event.SELECT = 'select';
Event.SOUND_COMPLETE = 'soundComplete';
Event.TAB_CHILDREN_CHANGE = 'tabChildrenChange';
Event.TAB_ENABLED_CHANGE = 'tabEnabledChange';
Event.TAB_INDEX_CHANGE = 'tabIndexChange';
Event.UNLOAD = 'unload';
