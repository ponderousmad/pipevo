(function () {
    "use strict";
    
    var entropy = Math.random;
    
    function AIRunner(view) {
        this.view = view;
        this.players = {
            borderAI: function (game) { return new AI.makeDiscarder(game, true, new AI.BorderDiscarder(game)); },
            farAI:    function (game) { return new AI.makeDiscarder(game, true, new AI.FarDiscarder(game)); },
            randomAI: function (game) { return new AI.makeDiscarder(game, true, new AI.RandomDiscarder(game, entropy)); },
            followAI: function (game) { return new AI.makeFollower(game, new AI.RandomDiscarder(game, entropy)); },
            susanAI:  function (game) { return new AI.Susan(game); },
            bobAI:    function (game) { return new AI.Bob(game); }
        };
        this.activePlayer = null;
        this.game = null;
        this.playTime = 0;
        this.moveTime = 100;
        
        var self = this;
        
        function setupClick(constructor) {
            return function(event) {
                self.game = PIPES.createDefault(entropy);
                self.activePlayer = constructor(self.game);
                self.playTime = 0;
                self.view.setGame(self.game, false);
            };
        }
        
        for (var player in this.players) {
            if (this.players.hasOwnProperty(player)) {
                var button = document.getElementById(player);
                if (button) {
                    button.addEventListener('click', setupClick(this.players[player]), false)
                }
            }
        }
    }
    
    AIRunner.prototype.update = function (now, elapsed) {
        if (this.activePlayer !== null) {
            this.playTime += elapsed;
            if (this.playTime > this.moveTime) {
                this.playTime -= this.moveTime;
                
                var nextMove = this.activePlayer.nextMove();
                if (nextMove != null && nextMove.valid()) {
                    this.game.placeNext(nextMove);
                } else {
                    this.view.startFilling();
                    this.activePlayer = null;
                }
            }
        }
    };
    
    window.onload = function(e) {
        console.log("window.onload", e, Date.now());
        var canvas = document.getElementById("canvas"),
            context = canvas.getContext("2d"),
            pointer = new INPUT.Pointer(canvas),
            keyboard = new INPUT.Keyboard(window),
            view = new PIPES.SubstrateView(PIPES.createDefault(entropy)),
            lastTime = TIMING.now(),
            aiRunner = new AIRunner(view),
            update = function () {
                var now = TIMING.now(),
                    elapsed = now - lastTime;
                pointer.update(elapsed);
                aiRunner.update(now, elapsed);
                view.update(now, elapsed, keyboard, pointer);
                keyboard.postUpdate();
                lastTime = now;
            };
            
        canvas.width = view.totalWidth();
        canvas.height = view.height();
    
        function drawFrame() {
            requestAnimationFrame(drawFrame);
            context.clearRect(0, 0, canvas.width, canvas.height);
            view.draw(context);
        }

        window.setInterval(update, 16);
        
        drawFrame();
    };
}());
