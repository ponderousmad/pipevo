/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.List;
import java.util.Random;

import evolve.Evaluator.Evaluation;
import functional.type.FunctionType;

public class Darwin {
	public static class SurvivalRatios implements java.io.Serializable {
		private static final long serialVersionUID = 1774113748620858730L;

		public double survivalRatio = 0.1;
		public double mutatedSurvivorRatio = 0.4;
		public double mutantRatio = 0.05;
		public double purebreadRatio = 0.25;
	}

	private TypeBuilder mTypeBuilder;
	private GeneRandomizer mGeneRandomizer;
	private ObjectRegistry mObjectRegistry;
	private Runner mRunner;
	private Evaluator mEvaluator;
	private Status mStatus;
	private Mutator mMutator;
	private String mLastPopulationPath;
	private SurvivalRatios mSurvivalRatios;
	private boolean mStop = false;

	public Darwin( TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator ) {
		initialize(typeBuilder, runner, status, geneRandomizer, mutator, new SurvivalRatios());
	}

	public Darwin( TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator, SurvivalRatios survival ) {
		initialize(typeBuilder, runner, status, geneRandomizer, mutator, survival);
	}

	public void initialize( TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator, SurvivalRatios survival ) {
		mTypeBuilder = typeBuilder;
		mObjectRegistry = runner.registry();
		mRunner = runner;
		mEvaluator = new Evaluator(runner, status);
		mStatus = status;
		mGeneRandomizer = geneRandomizer;
		mSurvivalRatios = survival;
		mMutator = mutator;
	}

	public void setPopulationStorePath(String path) {
		mLastPopulationPath = path;
	}

	private FunctionType target() {
		return mRunner.targetType();
	}

	public Population initialPopulation( int size, Random random ) {
		start();
		Population population = new Population(target());
		GenomeBuilder builder = new GenomeBuilder(mObjectRegistry, mTypeBuilder, mGeneRandomizer);
		GenomeBuilder.ChromasomeStructure[] structure = builder.buildGenomeStructure(target(), random);

		mStatus.push("Generate Population");
		for( int i = 0; i < size && !isStopped(); ++i ) {
			mStatus.updateProgress(i, size);
			try {
				population.add(builder.build(structure, random));
			} catch( StackOverflowError ex ) {
				mStatus.onFail(ex, "Generating population: ");
				--i;
			} catch( GeneBuilder.GeneBuildException ex ) {
				mStatus.onFail(ex, "Generating population: ");
				--i;
			}
		}
		mStatus.pop();

		return population;
	}

	public List<Evaluator.Evaluation> evaluate(Population population, Random random) {
		return mEvaluator.evaluate(population, random);
	}

	public Population nextPopulation(final List<Evaluation> evaluated, final Random random) {
		int count = evaluated.size();

		try {
			int survivors = Math.max((int)(count * mSurvivalRatios.survivalRatio),1);
			int mutatedSurvivors = (int)(count * mSurvivalRatios.mutatedSurvivorRatio);
			int mutants = (int)(count * mSurvivalRatios.mutantRatio);
			final int offspringCount = Math.max(count - ( survivors + mutatedSurvivors + mutants ), 0);

			mStatus.push("Breading/mutating");

			mStatus.updateProgress(0, 4);
			final Population next = breedPopulation(evaluated, offspringCount, survivors, random);

			mStatus.updateProgress(1, 4);
			for( int i = 0; i < survivors; ++i ) {
				next.add(evaluated.get(i).genome);
			}

			mStatus.updateProgress(2, 4);
			try {
				mStatus.push("Mutating Survivors");
				for( int i = 0; i < mutatedSurvivors; ++i ) {
					Genome mutantSurvivor = mutate(evaluated.get(random.nextInt(survivors)).genome, random);
					next.add(mutantSurvivor);
					mStatus.updateProgress(i, mutatedSurvivors);
				}
			} finally {
				mStatus.pop();
			}

			mStatus.updateProgress(3, 4);
			try {
				mStatus.push("Mutating");
				for( int i = 0; i < mutants; ++i ) {
					Genome mutant = mutate(evaluated.get(random.nextInt(evaluated.size())).genome, random);
					next.add(mutant);
					mStatus.updateProgress(i, mutants);
				}
			} finally {
				mStatus.pop();
			}

			return next;
		} finally {
			mStatus.pop();
		}
	}

	private Population breedPopulation(List<Evaluation> evaluated, int count, int selectFrom, Random random) {
		int purebreads = (int)(mSurvivalRatios.purebreadRatio * count);
		Population offspring = new Population(target());
		try {
			mStatus.push("Breeding");
			for( int i = 0; i < count; ++i ) {
				Genome parentA = selectParent(evaluated, selectFrom, random);
				Genome parentB = selectParent(evaluated, selectFrom, random);
				Genome child = Breeder.breed( parentA, parentB, target(), random );
				if( i > purebreads ) {
					child = mutate(child, random);
				}
				offspring.add(child);
			}
		} finally {
			mStatus.pop();
		}
		return offspring;
	}

	boolean mSkipTargetCheck = true;
	private Genome mutate(Genome genome, Random random) {
		Genome mutated = null;
		do {
			try {
				mutated = mMutator.mutate(genome, mObjectRegistry, true, random, target());
				assert( mSkipTargetCheck || mutated.findLastMatching(target()) != null );
			} catch( Throwable ex ) {
				System.out.println("Failure during mutation: " + ex.toString());
				mStatus.notify("Failure during mutation.");
			}
		} while( mutated == null );
		return mutated;
	}

	private Genome selectParent(List<Evaluation> evaluated, int selectFrom, Random random) {
		int selected = random.nextInt(selectFrom);
		Evaluation selection = evaluated.get(selected);
		return selection.genome;
	}

	public Evaluation evolve(Population population, int generations, Random random) {
		if( !population.isTarget(target()) ) {
			mStatus.notify("Incompatible population.");
			return null;
		}
		start();
		Evaluation best = null;
		int i = 0;
		mStatus.updateProgress(0, generations);
		do {
			try {
				mStatus.push("Generation " + i);
				mStatus.updateProgress(0, 2);

				storePopulation(population);

				List<Evaluation> evaluated;
				try {
					mStatus.push("Evaluating");
					evaluated = evaluate(population,random);
					if( isStopped() ) {
						// If we were stopped during evaluation, evaluate will return null
						// So for simplicity, just jump out here.
						return best;
					}
					Evaluation currentBest = evaluated.get(0);
					if( best == null || currentBest.score > best.score ) {
						best = currentBest;
						mStatus.updateBest(best);
					}
					mStatus.currentPopulation(evaluated);
					if( best.score == mRunner.maxScore() ) {
						// If we've hit the max score, we'll never replace it, so stop now.
						return best;
					}
				} finally {
					mStatus.pop();
				}

				mStatus.updateProgress(1, 2);
				do {
					population = nextPopulation(evaluated, random);
				} while( population == null );
			} finally {
				mStatus.pop();
			}
			++i;
			mStatus.updateProgress(i, generations);
		} while( i < generations && !isStopped());
		return best;
	}

	private void storePopulation(Population pop) {
		if( mLastPopulationPath != null) {
			pop.store(mLastPopulationPath);
		}
	}

	synchronized public boolean isStopped() {
		return mStop;
	}

	synchronized public void abort() {
		mStop = true;
		mStatus.notify("Aborting...");
		mEvaluator.stop();
	}

	synchronized public void start() {
		mStop = false;
	}
}
