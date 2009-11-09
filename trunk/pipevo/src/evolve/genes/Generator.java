/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;
import java.util.Random;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Obj;

public abstract class Generator implements Gene, Serializable {
	private static final long serialVersionUID = 5322982214150695657L;

	abstract Obj generate( Context context, long seed );

	private Long mSeed;

	public Generator( Long seed ) {
		mSeed = seed;
	}

	public Obj express( Context context ) {
		return generate(context, mSeed);
	}

	public Gene mutate(Mutation mutation, Context context, Random random) {
		boolean mutateSeed = mutation.mutateSeed(random);
		return mutate(mutation, context, random, mutateSeed ? mutation.newSeed(mSeed, random) : mSeed, mutateSeed);
	}

	abstract protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated);
}
