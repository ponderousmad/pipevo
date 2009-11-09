/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;
import java.util.Random;

import util.StringRandom;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Obj;
import functional.StringObj;
import functional.type.BaseType;
import functional.type.Type;

public class StringGenerator extends Generator implements Serializable {
	private static final long serialVersionUID = 812058085772927206L;
	private int mLength;

	public StringGenerator(Long seed, int length) {
		super(seed);
		mLength = length;
	}

	Obj generate(Context context, long seed) {
		Random rand = new Random( seed );
		return new StringObj( StringRandom.asciiString( rand, mLength ) );
	}

	public Type type() {
		return BaseType.STRING;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		int length = mLength;
		if( mutation.mutateStringLength( random ) ) {
			length = mutation.newStringLength( mLength, random );
			mutated = true;
		}
		if( mutated ) {
			return new StringGenerator(seed, length);
		} else {
			return this;
		}
	}
}
