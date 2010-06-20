var URLLoader = new Class(EventDispatcher, function()
{
    this.__init__ = function()
    {
        EventDispatcher.call(this);
        this.__request = null;
        this.bytesLoaded = 0;
        this.bytesTotal = 0;
        this.data = null;
        this.dataFormat = URLLoaderDataFormat.TEXT;
    };
    this.close = function()
    {
        this.__request.abort();
    };
    this.load = function(request)
    {
        var self = this;
        var hasStatus = false;
        this.__request = new cs3.utils.createXMLHttpRequest();
        
        if (typeof request == 'string') {
            request = new URLRequest(request);
        }
        
        if (this.dataFormat == URLLoaderDataFormat.BINARY) {
            throw new Error("URLLoaderDataFormat.BINARY is not supported");
        }
        
        this.__request.open(request.__method, request.__url, true);
        this.__request.onreadystatechange = function() {
            if (!hasStatus) {
                try {
                    self.dispatchEvent(new HTTPStatusEvent(HTTPStatusEvent.HTTP_STATUS, false, false, this.status));
                    hasStatus = true;
                } catch (e) {}
            }
            if (this.readyState == 1) {
                self.dispatchEvent(new Event(Event.OPEN, false, false));
            }
            //else if (this.readyState == 2) {
            //}
            else if (this.readyState == 3) {
                var loaded = this.responseText.length;
                var total = this.getResponseHeader('Content-Length') || loaded + 1;
                self.dispatchEvent(new ProgressEvent(ProgressEvent.PROGRESS, false, false, loaded, total));
            }
            else if (this.readyState == 4) {
                if (this.status == 200) {
                    if (self.dataFormat === URLLoaderDataFormat.VARIABLES) {
                        self.data = new URLVariables(this.responseText);
                    }
                    else if (self.dataFormat == URLLoaderDataFormat.XML) {
                        self.data = this.responseXML;
                        if (self.data === null) {
                            throw new TypeError("Could not parse the XML file.");
                        }
                    }
                    else if (self.dataFormat == URLLoaderDataFormat.JSON) {
                        self.data = eval('(' + this.responseText + ')');
                    }
                    else {
                        self.data = this.responseText;
                    }
                    self.dispatchEvent(new Event(Event.COMPLETE, false, false));
                }
                else {
                    self.dispatchEvent(new IOErrorEvent(IOErrorEvent.IO_ERROR, false, false, this.statusText));
                }
                
                this.onreadystatechange = null;
            }
        };
        this.__request.send(null);
    };
    
    this.toString = function()
    {
        return '[object URLLoader]';
    };
});
