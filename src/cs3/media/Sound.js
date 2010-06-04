var Sound = new Class(EventDispatcher, function()
{
    this.__init__ = function(/* source1, source2.. */)
    {
        EventDispatcher.call(this);
        this.__media = null;
        this.__url = null;
        this.__canPlay = false;
        this.__isPlaying = false;
        this.__startTime = 0;
        this.__loops = 0;
        this.__loopCount = 0;
        this.__volume = 1;
        if (arguments.length !== 0) {
            this.load.apply(this, arguments);
        }
    };
    this.__onCanPlay = function()
    {
        this.__canPlay = true;
        if (this.__isPlaying) {
            this.__media.currentTime = this.__startTime;
            this.__media.play();
        }
    };
    this.__onEnded = function()
    {
        if (this.__loops === -1 || this.__loops > this.__loopCount) {
            this.__loopCount++;
            this.__media.currentTime = this.__startTime;
            this.__media.play();
        }
    };
    this.close = function()
    {
        this.__url = null;
        this.__canPlay = false;
        this.__isPlaying = false;
        this.__startTime = 0;
        this.__loops = 0;
        this.__loopCount = 0;
        document.body.removeChild(this.__media);
        cs3.utils.removeAllEventListeners(this.__media);
        this.__media = null;
    };
    this.load = function(/* source1, source2.. */)
    {
        if (arguments.length === 0) {
            throw new ArgumentError("load requires at least one url");
        }
        
        var self = this;
        var media = document.createElement('AUDIO');
        media.autoplay = false;
        media.loop = false;
        media.volume = this.__volume;
        
        for (var i = 0, l = arguments.length; i < l; ++i)
        {
            var request = arguments[i];
            if (typeof request == 'string') {
                request = new URLRequest(request);
            }
            var source = document.createElement('SOURCE');
            source.src = request.__url;
            media.appendChild(source);
        }
        
        cs3.utils.addEventListener(media, 'canplay', function(e)
        {
            self.__onCanPlay();
            cs3.utils.removeEventListener(media, 'canplay', arguments.callee);
        });
        cs3.utils.addEventListener(media, 'ended', function(e)
        {
            self.__onEnded();
        });
        
        media.style.display = "none";
        document.body.appendChild(media);
        
        this.__media = media;
        this.__url = media.currentSrc;
    };
    this.play = function(startTime, loops)
    {
        if (this.__media === null) {
            throw new ArgumentError("Invalid Sound.");
        }
        
        var self = this;
        var media = this.__media;
        this.__isPlaying = true;
        this.__startTime = Number(startTime) || 0;
        this.__loops = loops | 0;
        this.__loopCount = 0;
        
        if (this.__canPlay) {
            media.currentTime = this.__startTime;
            media.play();
        }
    };
    this.pause = function()
    {
        if (this.__media === null) {
            throw new ArgumentError("Invalid Sound.");
        }
        this.__media.pause();
        this.__isPlaying = false;
    };
    
    /* getters and setters */
    this.getLength = function()
    {
        if (this.__media) {
            return this.__media.duration;
        }
        return 0;
    };
    this.getPosition = function()
    {
        if (this.__media) {
            return this.__media.currentTime;
        }
        return 0;
    };
    this.getUrl = function()
    {
        return this.__url;
    };
    this.getVolume = function()
    {
        return this.__volume;
    };
    this.setVolume = function(v)
    {
        this.__volume = v;
        if (this.__media) {
            this.__media.volume = v;
        }
    };
});
Sound.prototype.__defineGetter__("length", Sound.prototype.getLength);
Sound.prototype.__defineGetter__("position", Sound.prototype.getPosition);
Sound.prototype.__defineGetter__("volume", Sound.prototype.getVolume);
Sound.prototype.__defineSetter__("volume", Sound.prototype.setVolume);
Sound.prototype.__defineGetter__("url", Sound.prototype.getUrl);
Sound.prototype.toString = function()
{
    return '[object Sound]';
};
