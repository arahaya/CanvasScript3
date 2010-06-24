cs3.utils.addOnload(function()
{
    //override the trace function
    trace = function()
    {
        var msg = Array.prototype.join.apply(arguments);
        
        var output = document.getElementById('output');
        if (output) {
            output.value += msg + "\n";
        }
        
        try {
            console.log(msg);
        }
        catch (e) {}
    }
});

function runCode()
{
    var output = document.getElementById('output');
    if (output) {
        output.value = "";
    }
    
    var codePanel = document.getElementById('code');
    if (codePanel) {
        var code = codePanel.value;
        try {
            (function(){
                eval(code);
            }).apply(window);
        }
        catch (e) {
            trace(e);
        }
    }
}
