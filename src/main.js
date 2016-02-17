(function () {
    "use strict";
    
    window.onload = function(e) {
        console.log("window.onload", e, Date.now());
        var canvas = document.getElementById("canvas"),
            context = canvas.getContext("2d"),
            pointer = new INPUT.Pointer(canvas),
            keyboard = new INPUT.Keyboard(window),
            view = new PIPES.SubstrateView(PIPES.createDefault(Math.random)),
            lastTime = TIMING.now(),
            update = function () {
                var now = TIMING.now(),
                    elapsed = now - lastTime;
                pointer.update(elapsed);
                view.update(now, elapsed, keyboard, pointer);
                keyboard.postUpdate();
                lastTime = now;
            };
    
        function drawFrame() {
            requestAnimationFrame(drawFrame);
            context.clearRect(0, 0, canvas.width, canvas.height);
            view.draw(context);
        }

        window.setInterval(update, 16);
        
        drawFrame();
    };
}());
