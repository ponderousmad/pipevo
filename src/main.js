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
    
/*
public class EvolveProgress {
	private final class ProgressStatus implements Status {
		List<Integer> mTotals = new java.util.ArrayList<Integer>();
		List<Integer> mCurrents = new java.util.ArrayList<Integer>();
		List<String> mNames = new java.util.ArrayList<String>();

		{
			push();
		}

		public void notify(String message) {
			mDiagnostics.append(message + "\n");
		}

		java.util.Map<Type, Integer> mErrorCounts = new java.util.HashMap<Type,Integer>();

		public void onFail(Throwable ex, String context) {
			Class<?> exClass = ex.getClass();
			int prevCount = mErrorCounts.containsKey(exClass) ? mErrorCounts.get(exClass) : 0;
			mErrorCounts.put(exClass, prevCount + 1);
			String description = ex.getMessage();
			if( context != null ) {
				System.out.print(context);
			}
			System.out.println( exClass.getSimpleName() + (description != null ? ": " + description : "") );
		}

		public void pop() {
			mCurrents.remove(mCurrents.size()-1);
			mTotals.remove(mTotals.size()-1);
			mNames.remove(mNames.size()-1);
			updateProgress();
		}

		public void push(String name) {
			mNames.add(name);
			push();
			updateProgress();
		}

		private void push() {
			mCurrents.add(0);
			mTotals.add(1);
		}

		public void updateBest(Evaluation eval) {
			mBestGenome.setText("Score: " + eval.score + "\n" + expression(eval.genome));
		}

		public void updateProgress(int current, int total) {
			mCurrents.set(mCurrents.size() - 1 , current);
			mTotals.set(mTotals.size()-1, total);
			updateProgress();
		}

		private void updateProgress() {
			mProgress.setValue((int)(kProgressTicks * progress(0)));
			mProgressDetail.setValue((int)(kProgressTicks * detailProgress()));
			String detail = "";
			for( String name : mNames ) {
				if( detail.length() > 0 ) {
					detail += " : ";
				}
				detail += name;
			}
			mDetailLabel.setText(detail);
		}

		private double progress(int i) {
			double current = mCurrents.get(i);
			if( i < mCurrents.size() - 1 ) {
				current += progress(i+1);
			}
			return current / mTotals.get(i);
		}

		private double detailProgress() {
			return progress(mCurrents.size() -1);
		}

		public void currentPopulation(List<Evaluation> evaluated) {
			String text = "";
			int count = 5;
			try {
				for(Evaluation eval : evaluated) {
					text += "Score = " + eval.score + "\n" + expression(eval.genome);
					--count;
					if( count == 0) {
						return;
					}
					text += "\n---------------------------\n";
				}
			} finally {
				mTopFive.setText(text);
			}
		}
	}

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
		mProbabilities = probabilities;
		mBest = null;

		mDialog = new JDialog(owner, "Evolve Progress");
		mDialog.setLocationByPlatform(true);
		mDialog.setDefaultCloseOperation(javax.swing.JFrame.DISPOSE_ON_CLOSE);
		mDialog.setLayout(new BoxLayout(mDialog.getContentPane(), BoxLayout.Y_AXIS));
		mDialog.addWindowListener(new WindowAdapter() {
			public void windowClosed(WindowEvent e) {
				abort();
			}
		});

		mProgress = new JProgressBar(0,kProgressTicks);
		mDialog.add(mProgress);

		mDetailLabel = new JLabel();
		mDetailLabel.setAlignmentX(Component.CENTER_ALIGNMENT);
		mDialog.add(mDetailLabel);
		mProgressDetail = new JProgressBar(0,kProgressTicks);
		mDialog.add(mProgressDetail);

		Font font = new Font("Monaco", Font.PLAIN, 12);
		mDiagnostics = createTextOutput( font, 150, "Diagnostics:");
		mBestGenome = createTextOutput( font, 200, "Best Genome:");
		mTopFive = createTextOutput( font, 500, "Current Top Five:");

		mDialog.pack();

		mDiagnostics.setText("seed = " + Long.toString(seed) + "L;\n");

		mDialog.setVisible(true);

		SwingWorker worker = new SwingWorker() {
			public Object construct() {
				mBest = evolve(populationSize, populationPath, generations, seed);
				mReciever.recieve(mBest);
				return mBest;
			}

			public void finished() {
				if( mAborted ) {
					mDiagnostics.append("Aborted.");
				} else if( mFailed ) {
					mDiagnostics.append("Failed.");
				} else {
					if( mBest != null && mBest.score == mRunner.maxScore() ) {
						mDiagnostics.append("Succeeded.");
					} else {
						mDiagnostics.append("Done.");
					}
					mProgress.setValue(kProgressTicks);
				}
			}
		};
		worker.setName("EvolveProgressWorker");
		worker.start();
	}

	private JTextArea createTextOutput(Font font, int height, String title) {
		JTextArea textArea = new JTextArea();
		textArea.setEditable(false);
		textArea.setFont(font);

		JScrollPane scroll = new JScrollPane(textArea);
		scroll.setVerticalScrollBarPolicy(JScrollPane.VERTICAL_SCROLLBAR_ALWAYS);
		scroll.setHorizontalScrollBarPolicy(JScrollPane.HORIZONTAL_SCROLLBAR_AS_NEEDED);

		JPanel panel = new JPanel();
		panel.setLayout(new GridLayout());
		panel.setAlignmentX(Component.CENTER_ALIGNMENT);
		panel.setBorder(BorderFactory.createTitledBorder(title));
		panel.setPreferredSize(new Dimension(1000,height));
		panel.add(scroll);

		mDialog.add(panel);
		return textArea;
	}

	public String expression(Genome genome) {
		Context context = new Context(mRunner.registry());
		List<Phene> expressions = genome.express(context);
		StringBuilder result = new StringBuilder();
		for( Phene expression : expressions ) {
			result.append(expression.name + " = ");
			result.append(expression.expression.toString());
			result.append('\n');
		}
		return result.toString();
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

	private synchronized void setDarwin(Darwin darwin) {
		mDarwin = darwin;
	}

	private synchronized void clearDarwin() {
		if( mDarwin != null && mDarwin.isStopped() ) {
			mAborted = true;
			mProgress.setValue(0);
			mProgressDetail.setValue(0);
		}
		mDarwin = null;
	}

	public synchronized void abort() {
		if( mDarwin != null ) {
			mDarwin.abort();
		}
	}

	public void setPopulationStorePath(String path) {
		mPopPath = path;
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
