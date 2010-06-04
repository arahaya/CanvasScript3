var URLRequest = new Class(Object, function()
{
    this.__init__ = function(url)
    {
        this.__contentType = null;
        this.__data = null;
        this.__method = URLRequestMethod.GET;
        this.__requestHeaders = [];
        this.__url = (url !== undefined) ? url : null;
    };
    
    /* getters and setters */
    this.getContentType = function()
    {
        return this.__contentType;
    };
    this.setContentType = function(v)
    {
        this.__contentType = v;
    };
    this.getData = function()
    {
        return this.__data;
    };
    this.setData = function(v)
    {
        this.__data = v;
    };
    this.getMethod = function()
    {
        return this.__method;
    };
    this.setMethod = function(v)
    {
        this.__method = v;
    };
    this.getRequestHeaders = function()
    {
        return this.__requestHeaders.slice(0);
    };
    this.setRequestHeaders = function(v)
    {
        this.__requestHeaders = v.slice(0);
    };
    this.getUrl = function()
    {
        return this.__url;
    };
    this.setUrl = function(v)
    {
        this.__url = v;
    };
});
URLRequest.prototype.__defineGetter__("contentType", URLRequest.prototype.getContentType);
URLRequest.prototype.__defineSetter__("contentType", URLRequest.prototype.setContentType);
URLRequest.prototype.__defineGetter__("data", URLRequest.prototype.getData);
URLRequest.prototype.__defineSetter__("data", URLRequest.prototype.setData);
URLRequest.prototype.__defineGetter__("method", URLRequest.prototype.getMethod);
URLRequest.prototype.__defineSetter__("method", URLRequest.prototype.setMethod);
URLRequest.prototype.__defineGetter__("requestHeaders", URLRequest.prototype.getRequestHeaders);
URLRequest.prototype.__defineSetter__("requestHeaders", URLRequest.prototype.setRequestHeaders);
URLRequest.prototype.__defineGetter__("url", URLRequest.prototype.getUrl);
URLRequest.prototype.__defineSetter__("url", URLRequest.prototype.setUrl);
URLRequest.prototype.toString = function()
{
    return '[object URLRequest]';
};
