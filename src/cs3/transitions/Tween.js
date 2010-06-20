var Tween;
(function(){

var DH  = 1 / 22;
var D1  = 1 / 11;
var D2  = 2 / 11;
var D3  = 3 / 11;
var D4  = 4 / 11;
var D5  = 5 / 11;
var D7  = 7 / 11;
var IH  = 1 / DH;
var I1  = 1 / D1;
var I2  = 1 / D2;
var I4D = 1 / D4 / D4;

Tween = new Class(EventDispatcher, function()
{
    this.__init__ = function(obj, prop, func, begin, finish, duration, useSeconds)
    {
        EventDispatcher.call(this);
        this.__duration = duration;
        this.__range = finish - begin;
        this.__FPS = undefined;
        this.__position = 0;
        this.__startTime = 0;
        this.__time = 0;
        this.__timer = null;
        this.begin = begin;
        this.func = func;
        this.isPlaying = false;
        this.looping = false;
        this.obj = obj;
        this.prop = prop;
        this.useSeconds = (useSeconds) ? true : false;
        
        this.start();
    };
    this.__start = function()
    {
        this.__stop();
        
        var frameRate;
        if (this.__FPS) {
            //use user specified FPS
            frameRate = this.__FPS;
        }
        else if (this.obj.__stage) {
            //use the objects stage.frameRate
            frameRate = this.obj.__stage.__frameRate;
        }
        else if (cs3.core.stages.length) {
            //use the last created stage.frameRate
            frameRate = cs3.core.stages[cs3.core.stages.length-1].__frameRate;
        }
        else {
            //use the system's default frameRate
            frameRate = cs3.config.DEFAULT_FRAMERATE;
        }
        
        this.__timer = setInterval(cs3.utils.closure(this, this.__enterFrame), 1000 / frameRate);
        this.isPlaying = true;
    };
    this.__stop = function()
    {
        clearInterval(this.__timer);
        this.isPlaying = false;
    };
    this.__dispatchEvent = function(type)
    {
        this.dispatchEvent(new TweenEvent(type, this.__time, this.__position));
    };
    this.__enterFrame = function()
    {
        this.nextFrame();
    };
    this.__restart = function()
    {
        this.__startTime = (new Date()).getTime();
    };
    this.__update = function()
    {
        var durationRatio = this.__time / this.__duration;
        var positionRatio = this.func(durationRatio);
        var newPosition   = this.begin + this.__range * positionRatio;
        this.__set__position(newPosition);
    };
    this.continueTo = function(finish, duration)
    {
        this.begin = this.__position;
        this.__range = finish - this.begin;
        if (duration !== undefined) {
            this.__duration = duration;
        }
        this.start();
    };
    this.fforward = function()
    {
        this.__set__time(this.__duration);
        this.__restart();
    };
    this.nextFrame = function()
    {
        if (this.useSeconds) {
            //update the time
            var elapseTime = (new Date()).getTime() - this.__startTime;
            this.__set__time(elapseTime / 1000);
        }
        else {
            //increase the frame
            this.__set__time(this.__time + 1);
        }
    };
    this.prevFrame = function()
    {
        if (this.useSeconds === false) {
            //decrease the frame
            this.__set__time(this.__time - 1);
        }
    };
    this.resume = function()
    {
        this.__restart();
        this.__start();
        this.__dispatchEvent(TweenEvent.MOTION_RESUME);
    };
    this.rewind = function(t)
    {
        //set the time
        this.__time = t | 0;
        this.__restart();
        this.__update();
    };
    this.start = function()
    {
        this.rewind(0);
        this.__start();
        this.__dispatchEvent(TweenEvent.MOTION_START);
    };
    this.stop = function()
    {
        this.__stop();
        this.__dispatchEvent(TweenEvent.MOTION_STOP);
    };
    this.yoyo = function()
    {
        this.continueTo(this.begin, this.__time);
    };
    
    /* getters and setters */
    this.__get__duration = function()
    {
        return this.__duration;
    };
    this.__set__duration = function(v)
    {
        this.__duration = v;
    };
    this.__get__finish = function()
    {
        return this.begin + this.__range;
    };
    this.__set__finish = function(v)
    {
        this.__range = v - this.begin;
    };
    this.__get__FPS = function()
    {
        return this.__FPS;
    };
    this.__set__FPS = function(v)
    {
        var isPlaying = this.isPlaying;
        this.__stop();
        this.__FPS = v;
        if (isPlaying) {
            //resume with the new FPS
            this.__start();
        }
    };
    this.__get__position = function()
    {
        return this.__position;
    };
    this.__set__position = function(v)
    {
        this.__position = v;
        this.obj[this.prop] = this.__position;
        this.__dispatchEvent(TweenEvent.MOTION_CHANGE);
    };
    this.__get__time = function()
    {
        return this.__time;
    };
    this.__set__time = function(v)
    {
        if (v > this.__duration)
        {
            if (this.looping) {
                this.rewind(v - this.__duration);
                this.__update();
                this.__dispatchEvent(TweenEvent.MOTION_LOOP);
            }
            else {
                if (this.useSeconds) {
                    this.__time = this.__duration;
                    this.__update();
                }
                this.stop();
                this.__dispatchEvent(TweenEvent.MOTION_FINISH);
            }
        }
        else if (v < 0) {
            this.rewind(0);
            this.__update();
        }
        else {
            this.__time = v;
            this.__update();
        }
    };
    
    this.toString = function()
    {
        return '[object Tween]';
    };
});
Tween.Back = {
    easeIn: function(t) {
        return 3 * t * t * t - 2 * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Back.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Back.easeIn(t * 2.0) * 0.5 : 1 - Tween.Back.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Bounce = {
    easeIn: function(t) {
        var s;
        if (t < D1) {
            s = t - DH;
            s = DH - s * s * IH;
        }
        else if (t < D3) {
            s = t - D2;
            s = D1 - s * s * I1;
        }
        else if (t < D7) {
            s = t - D5;
            s = D2 - s * s * I2;
        }
        else {
            s = t - 1;
            s = 1 - s * s * I4D;
        }
        return s;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Bounce.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Bounce.easeIn(t * 2.0) * 0.5 : 1 - Tween.Bounce.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Circ = {
    easeIn: function(t) {
        return 1.0 - Math.sqrt(1.0 - t * t);
    },
    easeOut: function(t) {
        return 1.0 - Tween.Circ.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Circ.easeIn(t * 2.0) * 0.5 : 1 - Tween.Circ.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Cubic = {
    easeIn: function(t) {
        return t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Cubic.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Cubic.easeIn(t * 2.0) * 0.5 : 1 - Tween.Cubic.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Elastic = {
    easeIn: function(t) {
        return 1.0 - Tween.Elastic.easeOut(1.0 - t);
    },
    easeOut: function(t) {
        var s = 1 - t;
        return 1 - Math.pow(s, 8) + Math.sin(t * t * 6 * Math.PI) * s * s;
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Elastic.easeIn(t * 2.0) * 0.5 : 1 - Tween.Elastic.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Linear = {
    easeIn: function(t) {
        return t;
    },
    easeOut: function(t) {
        return t;
    },
    easeInOut: function(t) {
        return t;
    }
};
Tween.Quad = {
    easeIn: function(t) {
        return t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Quad.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Quad.easeIn(t * 2.0) * 0.5 : 1 - Tween.Quad.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Quart = {
    easeIn: function(t) {
        return t * t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Quart.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Quart.easeIn(t * 2.0) * 0.5 : 1 - Tween.Quart.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Quint = {
    easeIn: function(t) {
        return t * t * t * t * t;
    },
    easeOut: function(t) {
        return 1.0 - Tween.Quint.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Quint.easeIn(t * 2.0) * 0.5 : 1 - Tween.Quint.easeIn(2.0 - t * 2.0) * 0.5;
    }
};
Tween.Sine = {
    easeIn: function(t) {
        return 1.0 - Math.cos(t * (Math.PI / 2));
    },
    easeOut: function(t) {
        return 1.0 - Tween.Sine.easeIn(1.0 - t);
    },
    easeInOut: function(t) {
        return (t < 0.5) ? Tween.Sine.easeIn(t * 2.0) * 0.5 : 1 - Tween.Sine.easeIn(2.0 - t * 2.0) * 0.5;
    }
};

})();
