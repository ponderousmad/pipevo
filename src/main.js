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

    GameRunner.prototype.run = function (env, target, entropy) {
        var game = PIPES.createDefault(entropy),
            runOnce = SLUR.makeList([target, new SLUR_PIPES.Game(game)]),
            application = SLUR.makeList([new SLUR.Symbol("gamePlace"), new SLUR_PIPES.Game(game), runOnce]),
            plays = 0;
		try {
			var result;
			do {
				result = application.eval(env);
				++plays;
			} while (!(SLUR.isNull(result) || game.isGameOver()));
			while (!game.isGameOver()) {
				game.updateFlow();
			}
		} catch(e) {
            if (e.name === "GameEvalException") {
                // Ignore.
            } else {
                throw e;
            }
		}
		return game.score() + (plays / 100.0);
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

    function ProgressReporter(element, registry) {
        this.bestScore = element.getElementById("best_genome_score");
        this.bestScore.innerHTML = "";
        this.bestGenome = element.getElementById("best_genome");
        this.bestScore.innerHTML = "";
        this.diagnosticsElement = element.getElementById("evolve_diagnostics");
        this.diagnosticsElement.innerHTML = "";
        this.topGenomes = element.getElementById("top_genomes");
        this.topGenomes.innerHTML = "";
        this.progressBar = element.getElementById("evolve_progress");
        this.progressBar.value = 0;
        this.progressDetailBar = element.getElementById("evolve_progress_detail");
        this.progressDetailBar.value = 0;
        this.detailInfo = element.getElementById("progress_details");
        this.detailInfo.innerHTML = "";
        this.registry = registry;
        this.totals = [];
        this.currents = [];
        this.names = [];
        this.errorCounts = {};

        this.pushCounts();
    }

    ProgressReporter.prototype.onFail = function (error, context) {
        console.log(context + " - " + error.toString());
        var count = this.errorCounts[error];
        this.errorCounts[error] = count ? count + 1 : count;
    };

    ProgressReporter.prototype.pushCounts = function () {
        this.currents.push(0);
        this.totals.push(1);
    };

    ProgressReporter.prototype.push = function (name) {
        this.names.push(name);
        this.pushCounts();
        this.showProgress();
    };

    ProgressReporter.prototype.pop = function () {
        this.totals.pop();
        this.currents.pop();
        this.names.pop();
        this.showProgress();
    };

    ProgressReporter.prototype.expression = function (genome) {
        var context = new GENES.Context(this.registry),
            phenes = genome.express(context),
            slur = EVOLVE.phenomeToString(phenes);
        return slur;
    };

    ProgressReporter.prototype.updateBest = function (evaluation) {
        this.bestScore.innerHTML = evaluation.score;
        var context = new GENES.Context(this.registry);
        this.bestGenome.innerHTML = "<pre>" + this.expression(evaluation.genome) + "</pre>";
    };

    ProgressReporter.prototype.updateProgress = function (current, total) {
        this.currents[this.currents.length - 1] = current;
        this.totals[this.totals.length - 1] = total;
        this.showProgress();
    };

    ProgressReporter.prototype.notify = function (message) {
        var div = document.createElement("div");
        div.innerHTML = message;
        this.diagnosticsElement.appendChild(div);
    };

    ProgressReporter.prototype.currentPopulation = function (evaluated) {
        var text = "";
        var count = 5;
        try {
            for (var e = 0; e < evaluated.length && count > 0; ++e, --count) {
                var entry = evaluated[e];
                text += "<div><div>Score = " + entry.score + "</div><pre>" + this.expression(entry.genome) + "</pre></div>";
            }
        } finally {
            this.topGenomes.innerHTML = text;
        }
    };

    ProgressReporter.prototype.progress = function (index) {
        var current = this.currents[index];
        if (index < this.currents.length - 1 ) {
            current += this.progress(index + 1);
        }
        return current / this.totals[index];
    };

    ProgressReporter.prototype.detailProgress = function () {
        return this.progress(this.currents.length - 1);
    };

    ProgressReporter.prototype.showProgress = function () {
        this.progressBar.value = this.progress(0);
        this.progressDetailBar.value = this.detailProgress();
        var detail = "";
        for (var n = 0; n < this.names.length; ++n) {
            if( detail.length > 0 ) {
                detail += " : ";
            }
            detail += name;
        }
        this.detailInfo.innerHTML = detail;
    };

    var evolveRunner = null,
        darwin = null;

    function runEvolve(form) {
        if (darwin !== null) {
            darwin.abort();
            return;
        }

        var target = form.elements.evo_target.value,
            populationSize = form.elements.population_size.value,
            generations = form.elements.generations.value,
            seed = Math.floor(Math.abs(form.elements.seed.value)),
            runner = null;
        if (target === "game") {
            runner = new GameRunner();
        } else {
            runner = new XsqdPlus2XRunner();
        }
        var reporter = new ProgressReporter(document, runner.registry),
            entropy = new ENTROPY.Entropy(seed);

        darwin = EVOLVE.defaultDarwin(runner, reporter, populationSize, entropy);

        evolveRunner = function (now, elapsed) {
            if (darwin.isDone(generations)) {
                reporter.notify("Done!");
                evolveRunner = null;
                darwin = null;
                form.elements.evolve_button.value = "Evolve";
            } else {
                darwin.evolveStep(generations, entropy);
                form.elements.evolve_button.value = "Abort";
            }
        };
    }

/*
public class EvolveProgress {
	public interface Reciever {
		void recieve(Evaluation best);
	}

	private JDialog mDialog;
	private JProgressBar mProgress;
	private JProgressBar mProgressDetail;
	private JLabel mDetailLabel;
	private JTextArea mBestGenome;
	private JTextArea mTopFive;
	private JTextArea mDiagnostics;
	private Runner mRunner;
	private EvolveProbabilities mProbabilities;
	private final int kProgressTicks = 1000;
	private boolean mFailed = false;
	private boolean mAborted = false;
	private Darwin mDarwin;
	private String mPopPath;
	private Reciever mReciever;
	private Evaluation mBest;

	public EvolveProgress(Runner runner, Reciever reciever) {
		mRunner = runner;
		mReciever = reciever;
	}

	public void run(JDialog owner, final Integer populationSize, final String populationPath, final int generations, EvolveProbabilities probabilities, final Long seed) {
		SwingWorker worker = new SwingWorker() {
			public Object construct() {
				mBest = evolve(populationSize, populationPath, generations, seed);
				mReciever.recieve(mBest);
				return mBest;
			}
		};
		worker.setName("EvolveProgressWorker");
		worker.start();
	}

	public Evaluation evolve(int populationSize, String populationPath, int generations, long seed) {
		GeneRandomizer geneRandomizer = new GeneRandomizer(mProbabilities.getGeneProbabilities());
		TypeBuilder builder = new TypeBuilder(
			true,
			mProbabilities.getTypeProbabilities(),
			mRunner.typeConstraints()
		);

		Status status = new ProgressStatus();

		Mutator mutator = new Mutator(new Mutation(mProbabilities.getMutationProbabilities(), builder, geneRandomizer));
		setDarwin(new Darwin(builder, mRunner, status, geneRandomizer, mutator, mProbabilities.getSurvivalRatios()));
		if( mPopPath != null ) {
			mDarwin.setPopulationStorePath(mPopPath);
		}
		java.util.Random random = new java.util.Random(seed);

		try {
			Population initialPopulation;
			if( populationPath != null && populationPath.length() > 0 ) {
				initialPopulation = Population.load(populationPath);
				if( initialPopulation == null ) {
					mFailed = true;
					return null;
				}
			} else {
				initialPopulation = mDarwin.initialPopulation(populationSize, random);
			}
			if( mDarwin.isStopped() ) {
				return null;
			}
			return mDarwin.evolve(initialPopulation, generations, random);
		} catch(Exception ex) {
			ex.printStackTrace(System.out);
			mFailed = true;
			return null;
		} finally {
			clearDarwin();
		}
	}

	public synchronized void abort() {
		if( mDarwin != null ) {
			mDarwin.abort();
		}
	}
}

*/

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
                if (evolveRunner !== null) {
                    evolveRunner(now, elapsed);
                }
                keyboard.postUpdate();
                lastTime = now;
            };

        canvas.width = view.totalWidth();
        canvas.height = view.height();
        document.getElementById("evolve_seed").value = new ENTROPY.makeRandom().randomSeed();

        function drawFrame() {
            requestAnimationFrame(drawFrame);
            context.clearRect(0, 0, canvas.width, canvas.height);
            view.draw(context);
        }

        window.setInterval(update, 16);

        drawFrame();

        // These tests are slow, don't want to run them all the time.
        if (TEST.INCLUDE_SLOW) {
            ENTROPY.testSuite();
        }

        PIPES.testSuite();
        SLUR.testSuite();
        SLUR_TYPES.testSuite();
        SLUR_PIPES.testSuite();
        GENES.testSuite();
        EVOLVE.testSuite();
    };

    return {
        runEvolve: runEvolve
    };
}());
