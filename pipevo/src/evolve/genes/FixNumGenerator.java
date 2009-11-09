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
import functional.FixNum;
import functional.Obj;
import functional.type.Type;
import functional.type.BaseType;

public class FixNumGenerator extends Generator implements Serializable {
	public static class Range implements java.io.Serializable
	{
		private static final long serialVersionUID = -6215911768631332669L;
		public int min;
		public int max;

		public Range( int min, int max ) {
			assert( max >= min );
			this.min = min;
			this.max = max;
		}
	}

	private static final long serialVersionUID = 4778701458495855287L;
	private Range mRange;

	public FixNumGenerator( long seed, Range range ) {
		super( seed );
		mRange = range;
	}

	public FixNumGenerator( long seed, int min, int max ) {
		super( seed );
		mRange = new Range(min, max);
	}

	public FixNumGenerator( long seed ) {
		super( seed );
		mRange = new Range(Integer.MIN_VALUE, Integer.MAX_VALUE);
	}

	public Obj generate(Context c, long seed) {
		long min = mRange.min;
		long max = mRange.max;
		long range = max - min + 1;
		long value = min + Math.abs(seed) % range;

		return new FixNum( (int)value );
	}

	public Type type() {
		return BaseType.FIXNUM;
	}

	public Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		FixNumGenerator.Range range = mRange;
		if( mutation.mutateFixnumRange(random) ) {
			range = mutation.newRange(range, random);
			mutated = true;
		}
		if( mutated ) {
			return new FixNumGenerator(seed, range);
		} else {
			return this;
		}
	}
}
