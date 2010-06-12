var getTimer = function()
{
    return (cs3.core.initialized) ? (new Date()).getTime() - cs3.core.startTime : 0;
};
