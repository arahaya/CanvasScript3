var BitmapFilter = new Class(Object, function()
{
    this.__filter = function(displayObject)
    {
    };
    
    this.__filterBitmapData = function(sourceBitmapData, sourceRect, distBitmapData, distPoint)
    {
    };
    
    this.__generateRect = function(sourceRect)
    {
    };
    
    this.clone = function()
    {
        return new BitmapFilter();
    };
    
    this.toString = function()
    {
        return '[object BitmapFilter]';
    };
});
