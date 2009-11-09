/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.Random;
import java.util.List;

import util.Pair;
import util.WeightedSet;

import evolve.GeneBuilder.BuildType;
import evolve.genes.RealGenerator;
import evolve.genes.FixNumGenerator;

public class GeneRandomizer {
	public static class Probabilities implements java.io.Serializable {
		private static final long serialVersionUID = -3323802227179728259L;

		public List<Pair<BuildType,Integer>> buildTypeWeights = defaultBuildTypeWeights();
		public int[] stringLengthWeights = new int[] {0,1,3,5,10,20,10,5,3,1,1,1,1,1,1,1,1,1,1,1};
		public int[] listLengthWeights = new int[] {0,10,20,10,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1};
		public int[] chromasomeLengthWeights = new int[] {0,1,2,3,2,1};
		public int[] genomeSizeWeights = new int[] {0,1,2,3,2,1};
		public List<Pair<FixNumGenerator.Range,Integer>> fixnumRangeWeights = defaultFixnumRangeWeights();
		public List<Pair<RealGenerator.Range,Integer>> realRangeWeights = defaultRealRangeWeights();
		public double maybeIsNullProbability = .25;

		public static List<Pair<BuildType,Integer>> defaultBuildTypeWeights() {
			List<Pair<BuildType,Integer>> weights = new java.util.ArrayList<Pair<BuildType,Integer>>();
			weights.add(new Pair<BuildType,Integer>(BuildType.BRANCH, 5));
			weights.add(new Pair<BuildType,Integer>(BuildType.APPLICATION, 20));
			weights.add(new Pair<BuildType,Integer>(BuildType.CONSTRUCT,20));
			weights.add(new Pair<BuildType,Integer>(BuildType.LOOKUP,50));
			weights.add(new Pair<BuildType,Integer>(BuildType.MAYBE,1));
			return weights;
		}

		public static List<Pair<FixNumGenerator.Range,Integer>> defaultFixnumRangeWeights() {
			List<Pair<FixNumGenerator.Range,Integer>> weights = new java.util.ArrayList<Pair<FixNumGenerator.Range,Integer>>();
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,1), 1));
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,2), 2));
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,10), 4));
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(-1,1), 3));
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,20), 4));
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,100), 5));
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,1000), 3));
			weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(Integer.MIN_VALUE, Integer.MAX_VALUE), 1));
			return weights;
		}

		public static List<Pair<RealGenerator.Range,Integer>> defaultRealRangeWeights() {
			List<Pair<RealGenerator.Range,Integer>> weights = new java.util.ArrayList<Pair<RealGenerator.Range,Integer>>();
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,1), 1));
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,2), 2));
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,10), 4));
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(-1,1), 3));
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,20), 4));
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,100), 5));
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,1000), 3));
			weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(Double.MIN_VALUE, Double.MAX_VALUE), 1));
			return weights;
		}
	}

	private Probabilities mProbabilities = null;
	private WeightedSet<Integer> mStringLengthDistribution = null;
	private WeightedSet<Integer> mListLengthDistribution = null;
	private WeightedSet<Integer> mChromasomeLengthDistribution = null;
	private WeightedSet<Integer> mGenomeSizeDistribution = null;
	private WeightedSet<FixNumGenerator.Range> mFixnumRangeDistribution;
	private WeightedSet<RealGenerator.Range> mRealRangeDistribution;

	public GeneRandomizer(Probabilities probabilities) {
		mProbabilities = probabilities;
		mStringLengthDistribution = distribution(mProbabilities.stringLengthWeights);
		mListLengthDistribution = distribution(mProbabilities.listLengthWeights);
		mChromasomeLengthDistribution = distribution(mProbabilities.chromasomeLengthWeights);
		mGenomeSizeDistribution = distribution(mProbabilities.genomeSizeWeights);
		mFixnumRangeDistribution = new Constructor<FixNumGenerator.Range>().distribution(mProbabilities.fixnumRangeWeights);
		mRealRangeDistribution = new Constructor<RealGenerator.Range>().distribution(mProbabilities.realRangeWeights);
	}

	public int buildTypeWeight(BuildType type) {
		for( Pair<BuildType,Integer> entry : mProbabilities.buildTypeWeights) {
 			if( entry.first == type ) {
 				return entry.second;
 			}
		}
		return 0;
	}

	public int selectStringLength(Random random) {
		return mStringLengthDistribution.select(random);
	}

	public int selectListLength(Random random) {
		return mListLengthDistribution.select(random);
	}

	public boolean maybeIsNull(Random random) {
		return util.Probability.select(random, mProbabilities.maybeIsNullProbability);
	}

	public FixNumGenerator.Range selectFixnumRange(Random random) {
		return mFixnumRangeDistribution.select(random);
	}


	public RealGenerator.Range selectRealRange(Random random) {
		return mRealRangeDistribution.select(random);
	}

	public int selectChromasomeLength(Random random) {
		return mChromasomeLengthDistribution.select(random);
	}

	public int selectGenomeSize(Random random) {
		return mGenomeSizeDistribution.select(random);
	}

	static class Constructor<T> {
		public WeightedSet<T> distribution(List<Pair<T,Integer>> weights){
			return distribution(weights,null);
		}

		public WeightedSet<T> distribution(List<Pair<T,Integer>> weights, T skip){
			WeightedSet<T> dist = new WeightedSet<T>();
			for( Pair<T, Integer> entry : weights ) {
				if( entry.first != skip && entry.second > 0) {
					dist.add(entry.first, entry.second);
				}
			}
			return dist;
		}
	}

	private static WeightedSet<Integer> distribution(int[] weights) {
		WeightedSet<Integer> dist = new WeightedSet<Integer>();
		for( int i = 0; i  < weights.length; ++i ) {
			int weight = weights[i];
			if( weight > 0 )  {
				dist.add(i, weight);
			}
		}
		return dist;
	}
}
