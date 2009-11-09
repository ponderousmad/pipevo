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
import functional.Real;
import functional.type.BaseType;
import functional.type.Type;

public class RealGenerator extends Generator implements Serializable {
	public static class Range implements java.io.Serializable
	{
		private static final long serialVersionUID = -3129409270771848845L;

		public double min;
		public double max;

		public Range( double min, double max ) {
			assert( max >= min );
			this.min = min;
			this.max = max;
		}
	}

	private static final long serialVersionUID = -1780673200901782401L;
	private Range mRange;

	public RealGenerator( long seed, Range range ) {
		super( seed );
		mRange = range;
	}

	public RealGenerator( long seed ) {
		super( seed );
		mRange = new Range(-1e20, 1e20);
	}

	public Obj generate(Context c, long seed) {
		double value = Math.abs(seed) / (double)Long.MAX_VALUE;
		return new Real( mRange.min + (mRange.max - mRange.min) * value );
	}

	public Type type() {
		return BaseType.REAL;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		RealGenerator.Range range = mRange;
		if( mutation.mutateRealRange(random) ) {
			range = mutation.newRange(range, random);
			mutated = true;
		}
		if( mutated ) {
			return new RealGenerator(seed, range);
		} else {
			return this;
		}
	}
}
