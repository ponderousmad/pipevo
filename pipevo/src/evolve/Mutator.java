/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.Random;

import functional.type.FunctionType;

public class Mutator {
	private Mutation mMutation;

	public Mutator(Mutation mutation) {
		mMutation = mutation;
	}

	public Genome mutate(Genome genome, ObjectRegistry reg, boolean allowMacroMutation, Random random, FunctionType target ) {
		Context context = new Context(reg);
		boolean isMutated = false;
		Genome mutated = new Genome();

		boolean addChromasome = allowMacroMutation && mMutation.addChromasome(random);
		int i = 0;

		for( Chromasome chromasome : genome.chromasomes() ) {
			++i;
			boolean isLast = i == genome.chromasomes().size();
			boolean skipChromasome = !isLast && allowMacroMutation && mMutation.skipChromasome(random);
			if( isLast && addChromasome ) {
				mutated.add(mMutation.createChromasome(context, random));
				isMutated = true;
			}
			if( !(skipChromasome) ) {
				context.addChromasome(chromasome);
				Chromasome mutatedChromasome = mutate(chromasome, context, isLast, allowMacroMutation, random);
				mutated.add(mutatedChromasome);
				if( mutatedChromasome != chromasome ) {
					isMutated = true;
				}
			} else {
				isMutated = true;
			}
		}
		if( allowMacroMutation && mMutation.addTargetChromasome(random) ) {
			isMutated = true;
			mutated.add(mMutation.createChromasome(context, random, target));
		}

		if( isMutated ) {
			return mutated;
		} else {
			return genome;
		}
	}

	public Chromasome mutate(Chromasome chromasome, Context context, boolean isLast, boolean allowMacroMutation, Random random) {
		boolean isMutated = false;
		Chromasome mutated = new Chromasome(chromasome.name());
		for( Chromasome.NamedGene gene : chromasome.genes() ) {
			if( mMutation.mutateTopLevelGene(random) ) {
				Gene mutatedGene = gene.gene.mutate(mMutation, context, random);
				mutated.addGene(mutatedGene);
				if( gene != mutatedGene ) {
					isMutated = true;
				}
			} else {
				mutated.addGene(gene.gene);
			}
		}
		if( !isLast && allowMacroMutation && mMutation.addGene(random) ) {
			mutated.addGene(mMutation.createGene(context, mutated.nextGeneName(), random));
			isMutated = true;
		}
		if( isMutated ) {
			return mutated;
		} else {
			return chromasome;
		}
	}
}
