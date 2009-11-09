/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.ArrayList;
import java.util.Collections;
import java.util.Comparator;
import java.util.List;
import java.util.Queue;
import java.util.Random;

import evolve.Chromasome.Phene;
import functional.Cons;
import functional.Environment;
import functional.Frame;
import functional.Obj;
import functional.Symbol;
import utils.Pair;

public class Evaluator {
	static class IterationData {
		Environment env;
		Symbol entryPoint;
		Random random;

		IterationData(Environment env, Symbol entryPoint, Random random) {
			this.env = env;
			this.entryPoint = entryPoint;
			this.random = random;
		}
	}

	public static class TimeoutException extends RuntimeException {
		private static final long serialVersionUID = -1793266047279954658L;

		public TimeoutException() {
			super("Timed out.");
		}
	}

	public static class AbortedException extends RuntimeException {
		private static final long serialVersionUID = -2168950614241347034L;

		public AbortedException() {
			super("Aborted.");
		}
	}

	public static class TargetNotFoundException extends RuntimeException {
		private static final long serialVersionUID = -4130995184897392403L;

		public TargetNotFoundException() {
			super("Target not found.");
		}
	}

	static class GenomeView {
		List<Phene> mExpressions;
		GenomeView(List<Phene> expressions) {
			mExpressions = expressions;
		}

		public String toString() {
			StringBuilder result = new StringBuilder();
			for( Phene expression : mExpressions ) {
				result.append(expression.name + " = ");
				result.append(expression.expression.toString());
				result.append('\n');
			}
			return result.toString();
		}
	}

	private static class Task {
		static final int kUnset = -1;

		private Genome mGenome = null;
		private GenomeView mView = null;
		private int mTaskID = kUnset;
		private long mStartTime = kUnset;
		private double mScore = 0;
		private Environment mEnv = null;
		private Symbol mEntryPoint = null;
		private long mSeed;
		private int mIterationCount;
		private int mIterations = 0;
		private Frame mRunFrame = null;
		private List<Pair<Throwable,String>> mErrors = new ArrayList<Pair<Throwable,String>>();

		Task(Genome genome, int taskID, int iterationCount, long seed) {
			mGenome = genome;
			mTaskID = taskID;
			mIterationCount = iterationCount;
			mSeed = seed;
		}

		synchronized int taskID() {
			return mTaskID;
		}

		synchronized Genome genome() {
			return mGenome;
		}

		synchronized void setView(GenomeView view) {
			// mView = view;
		}

		synchronized String view() {
			if( mView != null ) {
				return mGenome.toString() + "\n" + mView.toString();
			}
			return mGenome.toString();
		}

		synchronized void setExpression(Environment env, Symbol entryPoint) {
			mEnv = env;
			mEntryPoint = entryPoint;
		}

		synchronized void failExpress(Throwable ex, String expression ) {
			mErrors.add(new Pair<Throwable,String>(ex, expression));
		}

		synchronized void checkTime(long allowedTime) {
			if( mStartTime != kUnset && ( ( System.currentTimeMillis() - mStartTime ) > allowedTime ) ) {
				mRunFrame.abort(new TimeoutException());
			}
		}

		synchronized void updateScore(double score) {
			if( mStartTime != kUnset ) {
				mRunFrame = null;
				mStartTime = kUnset;
				mScore += score;
				++mIterations;
			}
		}

		synchronized void fail(Throwable ex, String expression) {
			mErrors.add(new Pair<Throwable,String>(ex, expression));
			updateScore(-1);
		}

		synchronized double score() {
			if( mEnv == null ) {
				return -2 * mIterationCount;
			} else if( mIterations > 0 ) {
				return mScore / mIterations;
			}
			return 0;
		}

		synchronized boolean done() {
			return ( expressFailed() ) || mIterations >= mIterationCount;
		}

		private boolean expressFailed() {
			return mEnv == null && !mErrors.isEmpty();
		}

		synchronized Evaluation evaluation() {
			return new Evaluation( score(), mGenome );
		}

		synchronized List<Pair<Throwable,String>> errors() {
			return mErrors;
		}

		synchronized public IterationData iterationData() {
			if( mEnv != null ) {
				Random random = new Random(mSeed);
				mSeed = random.nextLong();
				mRunFrame = new Frame(mEnv, "RunFrame");
				mStartTime = System.currentTimeMillis();

				return new IterationData(mRunFrame, mEntryPoint, random);
			}
			return null;
		}

		synchronized public void abort() {
			if( mRunFrame != null ) {
				mRunFrame.abort(new AbortedException());
			}
		}
	}

	class Worker implements Runnable
	{
		int mWorkerID;
		Thread mThread;

		Queue<Task> mTasks;
		Task mTask;

		public Worker( int workerID ) {
			mWorkerID = workerID;
			constructThread();
			getTask();
		}

		private void constructThread() {
			mThread = new Thread(this);
			mThread.setName("EvaluateWorker" + mWorkerID);
		}

		synchronized void start() {
			mThread.start();
		}

		synchronized boolean checkStatus(long allowedTime) {
			if( mTask != null ) {
				mTask.checkTime(allowedTime);
			}
			return mTask != null;
		}

		synchronized void abort() {
			if( mTask != null ) {
				mTask.abort();
			}
			mTasks = null;
		}

		synchronized boolean getTask() {
			if( mTasks != null && mTask != null && !mTask.done() ) {
				return true;
			}
			mTask = null;
			if( mTasks == null || mTasks.isEmpty() ) {
				mTasks = assignTasks();
				if( mTasks == null ) {
					return false;
				}
			}
			mTask = mTasks.remove();
			return true;
		}

		public void run() {
			while( getTask() ) {
				IterationData data = mTask.iterationData();
				if( data != null ) {
					try {
						double score = mRunner.run(data.env, data.entryPoint, data.random);
						mTask.updateScore(score);
					} catch (Throwable ex) {
						mTask.fail(ex, mTask.view());
					}
				} else {
					express();
				}
			}
		}

		public void express() {
			try {
				Genome genome = mTask.genome();
				Context context = new Context(mRunner.registry());
				List<Phene> phenome = genome.express(context);
				mTask.setView(new GenomeView(phenome));
				Environment env = bind(phenome);
				Symbol entryPoint = genome.findLastMatching(mRunner.targetType());
				if( entryPoint == null ) {
					throw new TargetNotFoundException();
				}
				mTask.setExpression(env, entryPoint);
			} catch( Throwable ex ) {
				mTask.failExpress(ex, mTask.view());
			}
		}

		private Environment bind(List<Phene> phenome) {
			Environment env = new Frame(mRunner.environment(),"expressFrame");
			for( Phene phene : phenome ) {
				Obj result = phene.expression.compile(env);
				result = result.eval(env);
				if( !isDefine(phene.expression) ) {
					env.add(phene.name, result);
				}
			}
			return env;
		}

		private boolean isDefine(Obj expression) {
			if( expression.isCons() ) {
				Obj car = ((Cons)expression).car();
				if( car.isSymbol() ) {
					if( ((Symbol)car).name().equals("define") ) {
						return true;
					}
				}
			}
			return false;
		}

		public void join() {
			try {
				mThread.join();
			} catch (InterruptedException e) {
				mStatus.notify("Unexected interruption.");
				e.printStackTrace(System.out);
			}
		}
	}

	private Runner mRunner;
	private Status mStatus;

	private Random mRandom;
	private Population mPopulation;
	private int mUnassigned = 0;
	private Task[] mTasks;
	Worker[] mWorkers;


	public Evaluator(Runner runner, Status status) {
		mRunner = runner;
		mStatus = status;
	}

	synchronized Queue<Task> assignTasks() {
		mStatus.updateProgress(mUnassigned > 0 ? mUnassigned-1 : 0, mTasks.length);
		if( mUnassigned == mTasks.length || mWorkers == null) {
			return null;
		}
		Queue<Task> tasks = new java.util.LinkedList<Task>();
		int chunk = Math.max(Math.min(5, mTasks.length / mWorkers.length), 1);
		int end = Math.min(mUnassigned + chunk, mTasks.length);
		for( ; mUnassigned < end; ++mUnassigned ) {
			tasks.add(mTasks[mUnassigned]);
		}
		return tasks;
	}

	public static class Evaluation {
		public double score;
		public Genome genome;

		public Evaluation( double score, Genome genome ) {
			this.score = score;
			this.genome = genome;
		}
	};

	private void setup() {
		mUnassigned = 0;
		mTasks = new Task[mPopulation.size()];
		int i = 0;
		for( Genome genome : mPopulation ) {
			long seed = mRandom.nextLong();
			mTasks[i] = new Task(genome, i, mRunner.iterations(), seed);
			++i;
		}

		int workerCount = java.lang.Runtime.getRuntime().availableProcessors();
		mWorkers = new Worker[workerCount];
		for( i = 0; i < workerCount; ++i ) {
			mWorkers[i] = new Worker(i);
		}
	}

	synchronized void start() {
		for( Worker worker : mWorkers ) {
			worker.start();
		}
	}

	private synchronized Worker[] getWorkers() {
		return mWorkers;
	}

	private boolean checkStatus() {
		Worker[] workers = getWorkers();
		if( workers == null ) {
			return false;
		}
		boolean isActive = false;
		for( Worker worker : workers ) {
			if( worker.checkStatus(mRunner.timeoutInterval()) ) {
				isActive = true;
			}
		}
		return isActive;
	}

	// This method cannot be synchronized, because otherwise it would prevent the worker threads from running.
	public List<Evaluation> evaluate(Population population, Random random) {
		mRandom = random;
		mPopulation = population;

		setup();
		start();

		boolean interruped;
		do {
			interruped = false;
			try {
				Thread.sleep(Math.min(mRunner.timeoutInterval()/2, 5000));
			} catch (InterruptedException e) {
				interruped = true;
				mStatus.notify("Unexected interruption.");
				e.printStackTrace(System.out);
			}
		} while( interruped || checkStatus() );

		return finish();
	}

	synchronized private List<Evaluation> finish() {
		if( mWorkers != null ) {
			for( Worker worker : mWorkers ) {
				worker.join();
			}
			mWorkers = null;

			return processResults();
		}
		return null;
	}

	private List<Evaluation> processResults() {
		List<Evaluation> results = new ArrayList<Evaluation>();
		int i = 0;
		for( Task task : mTasks) {
			if( !task.done() ) {
				throw new RuntimeException("Task not done!");
			}
			List<Pair<Throwable,String>> errors = task.errors();
			boolean seen = false;
			for( Pair<Throwable,String> error : errors ) {
				String description = "";
				if( !seen && error.second != null && error.second.length() > 0) {
					description = "**** Genome " + i + " ****\n" + error.second;
					seen = true;
				}
				mStatus.onFail(error.first, description + "Genome " + i + ": ");

			}
			results.add(task.evaluation());
			++i;
		}

		Collections.sort(results, new Comparator<Evaluation>(){
			public int compare(Evaluation a, Evaluation b) {
				if( a.score == b.score ) {
					return 0;
				}
				return a.score > b.score ? -1 : 1;
			}
		});
		return results;
	}

	private synchronized Worker[] clearWorkers() {
		Worker[] workers = mWorkers;
		mWorkers = null;
		return workers;
	}

	public void stop() {
		Worker[] workers = clearWorkers();
		if( workers != null ) {
			for( Worker worker : workers ) {
				worker.abort();
			}
		}
	}
}
