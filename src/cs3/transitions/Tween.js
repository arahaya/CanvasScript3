var Tween;
(function()
{
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
            this.__finish = finish;
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
            
            this.__timer = setInterval(__closure(this, this.__enterFrame), 1000 / frameRate);
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
            var positionRange = this.__finish - this.begin;
            var newPosition   = this.begin + positionRange * positionRatio;
            this.setPosition(newPosition);
        };
        this.continueTo = function(finish, duration)
        {
            //TODO:
        };
        this.fforward = function()
        {
            this.setTime(this.__duration);
            this.__restart();
        };
        this.nextFrame = function()
        {
            if (this.useSeconds) {
                //update the time
                var elapseTime = (new Date()).getTime() - this.__startTime;
                this.setTime(elapseTime / 1000);
            }
            else {
                //increase the frame
                this.setTime(this.__time + 1);
            }
        };
        this.prevFrame = function()
        {
            if (this.useSeconds === false) {
                //decrease the frame
                this.setTime(this.__time - 1);
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
            //TODO:
        };
        
        /* getters and setters */
        this.getDuration = function()
        {
            return this.__duration;
        };
        this.setDuration = function(v)
        {
            this.__duration = v;
        };
        this.getFinish = function()
        {
            return this.__finish;
        };
        this.setFinish = function(v)
        {
            this.__finish = v;
        };
        this.getFPS = function()
        {
            return this.__FPS;
        };
        this.setFPS = function(v)
        {
            var isPlaying = this.isPlaying;
            this.__stop();
            this.__FPS = v;
            if (isPlaying) {
                //resume with the new FPS
                this.__start();
            }
        };
        this.getPosition = function()
        {
            return this.__position;
        };
        this.setPosition = function(v)
        {
            this.__position = v;
            this.obj[this.prop] = this.__position;
            this.__dispatchEvent(TweenEvent.MOTION_CHANGE);
        };
        this.getTime = function()
        {
            return this.__time;
        };
        this.setTime = function(v)
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
    });
    Tween.Back = {
        easeIn: function(t) {
            return 3 * t * t * t - 2 * t * t;
        },
        easeOut: function(t) {
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
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
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
        }
    };
    Tween.Circ = {
        easeIn: function(t) {
            return 1.0 - Math.sqrt(1.0 - t * t);
        },
        easeOut: function(t) {
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
        }
    };
    Tween.Cubic = {
        easeIn: function(t) {
            return t * t * t;
        },
        easeOut: function(t) {
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
        }
    };
    Tween.Elastic = {
        easeIn: function(t) {
            return 1.0 - this.easeOut(1.0 - t);
        },
        easeOut: function(t) {
            var s = 1 - t;
            return 1 - Math.pow(s, 8) + Math.sin(t * t * 6 * Math.PI) * s * s;
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
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
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
        }
    };
    Tween.Quart = {
        easeIn: function(t) {
            return t * t * t * t;
        },
        easeOut: function(t) {
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
        }
    };
    Tween.Quint = {
        easeIn: function(t) {
            return t * t * t * t * t;
        },
        easeOut: function(t) {
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
        }
    };
    Tween.Sine = {
        _HALF_PI: Math.PI / 2,
        easeIn: function(t) {
            return 1.0 - Math.cos(t * this._HALF_PI);
        },
        easeOut: function(t) {
            return 1.0 - this.easeIn(1.0 - t);
        },
        easeInOut: function(t) {
            return (t < 0.5) ? this.easeIn(t * 2.0) * 0.5 : 1 - this.easeIn(2.0 - t * 2.0) * 0.5;
        }
    };
    Tween.prototype.__defineGetter__("duration", Tween.prototype.getDuration);
    Tween.prototype.__defineSetter__("duration", Tween.prototype.setDuration);
    Tween.prototype.__defineGetter__("finish", Tween.prototype.getFinish);
    Tween.prototype.__defineSetter__("finish", Tween.prototype.setFinish);
    Tween.prototype.__defineGetter__("FPS", Tween.prototype.getFPS);
    Tween.prototype.__defineSetter__("FPS", Tween.prototype.setFPS);
    Tween.prototype.__defineGetter__("position", Tween.prototype.getPosition);
    Tween.prototype.__defineSetter__("position", Tween.prototype.setPosition);
    Tween.prototype.__defineGetter__("time", Tween.prototype.getTime);
    Tween.prototype.__defineSetter__("time", Tween.prototype.setTime);
    Tween.prototype.toString = function()
    {
        return '[object Tween]';
    };
})();
