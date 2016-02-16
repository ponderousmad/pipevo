(function () {
    "use strict";
    
    window.onload = function(e) {
        console.log("window.onload", e, Date.now());
        var canvas = document.getElementById("canvas"),
            context = canvas.getContext("2d"),
            pointer = new INPUT.Pointer(canvas),
            view = new PIPES.SubstrateView(PIPES.createDefault(Math.random)),
            lastTime = TIMING.now(),
            update = function () {
                var now = TIMING.now(),
                    elapsed = now - lastTime;
                pointer.update(elapsed);
                view.update(now, elapsed, pointer);
            };
    
        function drawFrame() {
            requestAnimationFrame(drawFrame);
            view.draw(context);
        }

        window.setInterval(update, 16);
        
        drawFrame();
    };
}());
