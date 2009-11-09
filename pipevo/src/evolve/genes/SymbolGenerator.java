/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;
import java.util.Random;

import utils.StringRandom;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Obj;
import functional.Symbol;
import functional.type.BaseType;
import functional.type.Type;

public class SymbolGenerator extends Generator implements Serializable {
	private static final long serialVersionUID = -1509367746874838812L;
	private int mLength;

	public SymbolGenerator(Long seed, int length) {
		super(seed);
		mLength = length;
	}

	Obj generate(Context context, long seed) {
		Random rand = new Random( seed );

		return new Symbol( StringRandom.alphaString( rand, mLength ) );
	}

	public Type type() {
		return BaseType.SYMBOL;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		int length = mLength;
		if( mutation.mutateSymbolLength( random ) ) {
			length = mutation.newSymbolLength( mLength, random );
			mutated = true;
		}
		if( mutated ) {
			return new SymbolGenerator(seed, length);
		} else {
			return this;
		}
	}

}
