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
    this.__get__contentType = function()
    {
        return this.__contentType;
    };
    this.__set__contentType = function(v)
    {
        this.__contentType = v;
    };
    this.__get__data = function()
    {
        return this.__data;
    };
    this.__set__data = function(v)
    {
        this.__data = v;
    };
    this.__get__method = function()
    {
        return this.__method;
    };
    this.__set__method = function(v)
    {
        this.__method = v;
    };
    this.__get__requestHeaders = function()
    {
        return this.__requestHeaders.slice(0);
    };
    this.__set__requestHeaders = function(v)
    {
        this.__requestHeaders = v.slice(0);
    };
    this.__get__url = function()
    {
        return this.__url;
    };
    this.__set__url = function(v)
    {
        this.__url = v;
    };
    
    this.toString = function()
    {
        return '[object URLRequest]';
    };
});
