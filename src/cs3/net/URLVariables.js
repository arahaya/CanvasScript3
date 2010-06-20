var URLVariables = new Class(Object, function()
{
    this.__init__ = function(src)
    {
        this.decode(src);
    };
    this.decode = function(src)
    {
        if (!src) { return; }
        var pairs = src.split('&');
        for (var i = 0, l = pairs.length; i < l; ++i)
        {
            var s = pairs[i];
            if (s.indexOf('=') === -1) {
                throw new Error('The String passed to URLVariables.decode () must be a URL-encoded query strings.');
            }
            
            var p = s.split('=', 2);
            
            if (this.hasOwnProperty(p[0])) {
                throw new ReferenceError('Cannot assign to a method ' + p[0] + ' on URLVariables');
            }
            
            this[p[0]] = decodeURIComponent(p[1]);
        }
    };
    
    this.toString = function()
    {
        var pairs = [];
        for (var p in this)
        {
            if (p != 'constructor' && p != 'decode' && p != 'toString') {
                pairs.push(p + '=' + encodeURIComponent(this[p]));
            }
        }
        return pairs.join('&');
    };
});
