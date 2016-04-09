var MAIN = (function () {
    "use strict";

    var entropy = ENTROPY.makeRandom();

    function AIRunner(view) {
        this.view = view;
        this.players = {
            borderAI: function (game) { return new AI.makeDiscarder(game, true, new AI.BorderDiscarder(game)); },
            farAI:    function (game) { return new AI.makeDiscarder(game, true, new AI.FarDiscarder(game)); },
            randomAI: function (game) { return new AI.makeDiscarder(game, true, new AI.RandomDiscarder(game, entropy)); },
            followAI: function (game) { return new AI.makeFollower(game, new AI.RandomDiscarder(game, entropy)); },
            susanAI:  function (game) { return new AI.Susan(game); },
            bobAI:    function (game) { return new AI.Bob(game, false); },
            billAI:   function (game) { return new AI.Bob(game, true); }
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

    function GameRunner() {
        this.registry = new SLUR_TYPES.Registry();
        SLUR_TYPES.registerBuiltins(this.registry, true);
        SLUR_PIPES.register(this.registry);
        this.targetType = new SLUR_TYPES.FunctionType(SLUR_PIPES.GameTypes.POSITION, [SLUR_PIPES.GameTypes.GAME]);
        this.iterationCount = 2;
        this.maxScore = 250.0;
        this.timeoutInterval = 4000;
        this.typeConstraints = SLUR_PIPES.typeConstraints(EVOLVE.Constraint);
    }

    GameRunner.prototype.environment = function () {
        var env = SLUR.defaultEnvironment();
        SLUR_PIPES.install(env);
        return env;
    };
    
    function XsqdPlus2XRunner() {
        this.registry = new SLUR_TYPES.Registry();
        SLUR_TYPES.registerBuiltins(this.registry, true);
        this.targetType = new SLUR_TYPES.FunctionType(SLUR_TYPES.Primitives.FIX_NUM, [SLUR_TYPES.Primitives.FIX_NUM]);
        this.iterationCount = 10;
        this.maxScore = 250.0;
        this.timeoutInterval = 500;
        this.typeConstraints = [];
    }

    XsqdPlus2XRunner.prototype.environment = function () {
        return SLUR.defaultEnvironment();
    };
    
    XsqdPlus2XRunner.prototype.run = function (env, target, entropy) {
        var number = entropy.randomInt(0, 100),
            targetValue = this.evaluate(number),
            application = SLUR.makeList([target, new SLUR.FixNum(number)]),
            result = application.eval(env);
        if (result.value === this.func(number)) {
            return this.maxScore;
        }
        return 1 / Math.abs(targetValue - result.value);
    };
    
    XsqdPlus2XRunner.prototype.evaluate = function (value) {
        return value * value + 2 * value;
    };
    
    function runEvolve(form) {
        var target = form.elements["evoTarget"].value;
        var runner = null;
        if (target === "game") {
            runner = new GameRunner();
        } else {
            runner = new XsqdPlus2XRunner();
        }
    }

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
    
    return {
        runEvolve: runEvolve
    };
}());
