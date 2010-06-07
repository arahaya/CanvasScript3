//override the trace function
var startTime;
cs3.utils.addOnload(function()
{
    startTime = (new Date()).getTime();
    
    trace = function(msg)
    {
        var panel = document.getElementById('trace-panel');
        if (!panel) {
            panel = document.createElement('textarea');
            panel.id = 'trace-panel';
            panel.readOnly = true;
            document.body.appendChild(panel);
        }
        
        var time = (new Date()).getTime();
        //msg = (time - startTime) + "ms: " + msg;
        panel.value += msg + "\n";
        try {
            console.log(msg);
        }
        catch (e){}
    }
});
