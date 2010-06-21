var Video = new Class(DisplayObject, function()
{
    this.__init__ = function()
    {
        DisplayObject.call(this);
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
    
    //override
    this.__getContentBounds = function()
    {
        //TODO
        if (this.__media) {
            return new Rectangle(0, 0, this.__media.videoWidth, this.__media.videoHeight);
        }
        return new Rectangle();
    };
    
    //override
    this.__getModified = function()
    {
        //return this.__modified;
        if (this.__media && this.__media.paused === false) {
            return true;
        }
        return this.__transform.__modified || this.__modified;
    };
    
    //override
    this.__setModified = function(v)
    {
        this.__transform.__modified = this.__modified = v;
    };
    
    //override
    this.__render = function(context, colorTransform)
    {
        if (this.__media) {
            context.drawImage(this.__media, 0, 0);
        }
    };
    
    //override
    this.__hitTestPoint = function(context, matrix, point)
    {
        if (this.__media) {
            var bounds = this.__getContentBounds();
            
            //convert point to local coords
            var invertedMatrix = matrix.clone();
            invertedMatrix.invert();
            var localPoint = invertedMatrix.transformPoint(point);
            
            if (bounds.containsPoint(localPoint)) {
                return true;
            }
        }
        return false;
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
        var media = document.createElement('VIDEO');
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
            throw new ArgumentError("Invalid Video.");
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
            throw new ArgumentError("Invalid Video.");
        }
        this.__media.pause();
        this.__isPlaying = false;
    };
    
    /* getters and setters */
    this.__get__length = function()
    {
        if (this.__media) {
            return this.__media.duration;
        }
        return 0;
    };
    
    this.__get__position = function()
    {
        if (this.__media) {
            return this.__media.currentTime;
        }
        return 0;
    };
    
    this.__get__url = function()
    {
        return this.__url;
    };
    
    this.__get__volume = function()
    {
        return this.__volume;
    };
    
    this.__set__volume = function(v)
    {
        this.__volume = v;
        if (this.__media) {
            this.__media.volume = v;
        }
    };
    
    this.toString = function()
    {
        return '[object Video]';
    };
});
