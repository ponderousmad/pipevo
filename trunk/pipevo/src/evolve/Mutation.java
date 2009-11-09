/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.io.Serializable;
import java.util.Random;

import evolve.genes.FixNumGenerator;
import evolve.genes.RealGenerator;
import functional.type.FunctionType;
import functional.type.Type;
import util.Probability;

public class Mutation {
	public static class Probabilities implements Serializable {
		private static final long serialVersionUID = 7986408705696720856L;

		public double mutateTopLevel = 0.5;
		public double mutateSeed = 1/25.0;
		public double mutateStringLength = 1/25.0;
		public double mutateSymbolLength = 1/25.0;
		public double mutateListLength = 1/25.0;
		public double mutateSwapListItems = 1/25.0;
		public double mutateReorderList = 1/25.0;
		public double mutateFixnumRange = 1/25.0;
		public double mutateRealRange = 1/25.0;
		public double replaceSubgene = 1/25.0;

		public double mutateAddGene = 1/250.0;
		public double mutateSkipChromasome = 1/1000.0;
		public double mutateAddChromasome = 1/1000.0;
		public double mutateAddTargetChromasome = 1/5000.0;
	}

	private Probabilities mProbabilities;
	private GeneRandomizer mGeneRandomizer;
	private TypeBuilder mTypeBuilder;

	public Mutation(Probabilities probabilities, TypeBuilder typeBuilder, GeneRandomizer geneRandomizer) {
		mProbabilities = probabilities;
		mTypeBuilder = typeBuilder;
		mGeneRandomizer = geneRandomizer;
	}

	public TypeBuilder typeBuilder() {
		return mTypeBuilder;
	}

	public GeneRandomizer geneBuilderProbabilities() {
		return mGeneRandomizer;
	}

	public boolean mutateTopLevelGene( Random random ) {
		return Probability.select(random, mProbabilities.mutateTopLevel);
	}

	public boolean mutateSeed(Random random) {
		return Probability.select(random, mProbabilities.mutateSeed);
	}

	public boolean mutateStringLength(Random random) {
		return Probability.select(random, mProbabilities.mutateStringLength);
	}

	public int newStringLength(int length, Random random) {
		int mutateType = random.nextInt(5);
		if( mutateType < 2) {
			return length > 0 ? length - 1 : length;
		}
		if( mutateType < 4 ) {
			return length + 1;
		}
		return mGeneRandomizer.selectStringLength(random);
	}

	public boolean mutateSymbolLength(Random random) {
		return Probability.select(random, mProbabilities.mutateSymbolLength);
	}

	public int newSymbolLength(int length, Random random) {
		int mutateType = random.nextInt(5);
		if( mutateType < 2) {
			return length > 0 ? length - 1 : length;
		}
		if( mutateType < 4 ) {
			return length + 1;
		}
		return mGeneRandomizer.selectStringLength(random);
	}

	public boolean replaceSubgene(Random random) {
		return Probability.select(random, mProbabilities.replaceSubgene);
	}

	public Gene createNewGene( Type type, Context context, Random random ) {
		GeneBuilder builder = new GeneBuilder(typeBuilder(), geneBuilderProbabilities(), context);
		return builder.buildItem(type, random);
	}

	public Gene mutateGene( Type type, Gene gene, Context context, Random random ) {
		if( replaceSubgene(random) ) {
			return createNewGene(type, context, random);
		} else {
			gene.mutate(this, context, random);
			return gene;
		}
	}

	public boolean reorderList(Random random) {
		return Probability.select(random, mProbabilities.mutateReorderList);
	}

	public boolean mutateListLength(Random random) {
		return Probability.select(random, mProbabilities.mutateListLength);
	}

	public int newListLength(int length, Random random) {
		int mutateType = random.nextInt(5);
		if( mutateType < 2) {
			return length > 0 ? length - 1 : length;
		}
		if( mutateType < 4 ) {
			return length + 1;
		}
		return mGeneRandomizer.selectListLength(random);
	}

	public boolean swapListItems(Random random) {
		return Probability.select(random, mProbabilities.mutateSwapListItems);
	}

	public boolean mutateFixnumRange(Random random) {
		return Probability.select(random, mProbabilities.mutateFixnumRange);
	}

	public FixNumGenerator.Range newRange( FixNumGenerator.Range range, Random random) {
		int min = range.min;
		int max = range.max;
		int mutateType = random.nextInt(5);
		int rangeSizeDelta = random.nextInt(20);
		if( mutateType == 0 ) {
			min = min > Integer.MIN_VALUE + rangeSizeDelta ? min - rangeSizeDelta : Integer.MIN_VALUE;
		} else if( mutateType == 1 ) {
			min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
		} else if( mutateType == 2 ) {
			max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
		} else if( mutateType == 3 ) {
			max = max < Integer.MAX_VALUE - rangeSizeDelta ? max + rangeSizeDelta : Integer.MAX_VALUE;
		} else {
			return mGeneRandomizer.selectFixnumRange(random);
		}
		return new FixNumGenerator.Range(min, max);
	}

	public boolean mutateRealRange(Random random) {
		return Probability.select(random, mProbabilities.mutateRealRange);
	}

	public RealGenerator.Range newRange( RealGenerator.Range range, Random random) {
		double min = range.min;
		double max = range.max;
		int mutateType = random.nextInt(5);
		int rangeSizeDelta = random.nextInt(20);
		if( mutateType == 0 ) {
			min = min > Double.MIN_VALUE + rangeSizeDelta ? min - rangeSizeDelta : Integer.MIN_VALUE;
		} else if( mutateType == 1 ) {
			min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
		} else if( mutateType == 2 ) {
			max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
		} else if( mutateType == 3 ) {
			max = max < Double.MAX_VALUE - rangeSizeDelta ? max + rangeSizeDelta : Integer.MAX_VALUE;
		} else {
			return mGeneRandomizer.selectRealRange(random);
		}
		return new RealGenerator.Range(min, max);
	}

	public Long newSeed(Long seed, Random random) {
		int mutateType = random.nextInt(5);
		if( mutateType < 2) {
			return seed > Long.MIN_VALUE ? seed - 1 : Long.MIN_VALUE;
		}
		if( mutateType < 4 ) {
			return seed < Long.MAX_VALUE ? seed + 1 : Long.MAX_VALUE;
		}
		return random.nextLong();
	}

	public boolean skipChromasome(Random random) {
		return Probability.select(random, mProbabilities.mutateSkipChromasome);
	}

	public boolean addChromasome(Random random) {
		return Probability.select(random, mProbabilities.mutateAddChromasome);
	}

	public Chromasome createChromasome(Context context, Random random) {
		TypeBuilder typeBuilder = typeBuilder();
		GeneBuilder builder = new GeneBuilder(typeBuilder, geneBuilderProbabilities(), context);
		int chromasomeLength = mGeneRandomizer.selectChromasomeLength(random);
		Chromasome chromasome = new Chromasome("crA_" + util.StringRandom.alphaString(random, 5));
		context.addChromasome(chromasome);
		for( int i = 0; i < chromasomeLength; ++i ) {
			typeBuilder.allowAllConstrained();
			Type returnType = typeBuilder.createType(random);
			typeBuilder.clearDependentTypes();
			FunctionType function = typeBuilder.createFunction(returnType, random);
			chromasome.addGene(builder.buildFunction(function, chromasome.nextGeneName(), random));
		}
		return chromasome;
	}

	public boolean addTargetChromasome(Random random) {
		return Probability.select(random, mProbabilities.mutateAddTargetChromasome);
	}

	public Chromasome createChromasome(Context context, Random random, FunctionType target) {
		GeneBuilder builder = new GeneBuilder(typeBuilder(), geneBuilderProbabilities(), context);
		Chromasome chromasome = new Chromasome("crT_" + util.StringRandom.alphaString(random, 5));
		chromasome.addGene(builder.buildFunction(target, chromasome.nextGeneName(), random));
		return chromasome;
	}

	public boolean addGene(Random random) {
		return Probability.select(random, mProbabilities.mutateAddGene);
	}

	public Gene createGene(Context context, String name, Random random) {
		TypeBuilder typeBuilder = typeBuilder();
		GeneBuilder builder = new GeneBuilder(typeBuilder, geneBuilderProbabilities(), context);
		typeBuilder.allowDependentTypes(context.findConcreteTypes());
		Type returnType;
		try {
			returnType = typeBuilder.createType(random);
		} finally {
			typeBuilder.clearDependentTypes();
		}
		FunctionType type = typeBuilder.createFunction(returnType, random);
		Gene gene = builder.buildFunction(type, name, random);
		return gene;
	}

}
