(function () {
    "use strict";

    var entropy = ENTROPY.random();

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
                    button.addEventListener('click', setupClick(this.players[player]), false);
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
                if (nextMove !== null && nextMove.valid()) {
                    this.game.placeNext(nextMove);
                } else {
                    this.view.startFilling();
                    this.activePlayer = null;
                }
            }
        }
    };

    // Courtesy of http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
    function escapeHtml(unsafe) {
        return unsafe
             .replace(/&/g, "&amp;")
             .replace(/</g, "&lt;")
             .replace(/>/g, "&gt;")
             .replace(/"/g, "&quot;")
             .replace(/'/g, "&#039;");
    }

    function Interpreter(view, env) {
        this.code = document.getElementById("code");
        this.parsed = document.getElementById("codeParsed");
        this.output = document.getElementById("codeOutput");
        this.run = document.getElementById("codeRun");
        this.view = view;
        this.env = env;
        SLUR_PIPES.install(this.env);

        var self = this;

        this.run.addEventListener('click', function (event) { self.execute(event); }, false);
    }

    Interpreter.prototype.execute = function (event) {
        this.env.bind("game", new SLUR_PIPES.Game(this.view.game));

        var parser = new SLUR.Parser(this.code.value),
            parse = null,
            result = null;
        do {
            try {
                parse = parser.parse();
            } catch(e) {
                parse = null;
                this.parsed.innerHTML = escapeHtml(e.toLocaleString());
            }

            if (parse !== null) {
                this.parsed.innerHTML = escapeHtml(parse.toString());
                try {
                    result = parse.eval(this.env);
                    if (result !== null) {
                        this.output.innerHTML = result.toString();
                    }
                } catch(e) {
                    this.output.innerHTML = escapeHtml(e.toLocaleString());
                }
            }
        } while (parse !== null);
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
            interpreter = null,
            update = function () {
                var now = TIMING.now(),
                    elapsed = now - lastTime;
                pointer.update(elapsed);
                aiRunner.update(now, elapsed);
                view.update(now, elapsed, keyboard, pointer);
                if (interpreter === null) {
                    var env = SLUR.defaultEnvironment();
                    if (env !== null) {
                        interpreter = new Interpreter(view, env);
                    }
                }
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
