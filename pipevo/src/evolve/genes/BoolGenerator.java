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
import functional.Null;
import functional.Obj;
import functional.True;
import functional.type.BaseType;
import functional.type.Type;

public class BoolGenerator extends Generator implements Serializable {
	private static final long serialVersionUID = 7930710939815370656L;

	public BoolGenerator(long seed) {
		super( seed );
	}

	public Obj generate(Context context, long seed) {
		return seed % 2 == 1 ? True.TRUE : Null.NULL;
	}

	public Type type() {
		return BaseType.BOOL;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		if( mutated ) {
			return new BoolGenerator(seed);
		} else {
			return this;
		}
	}
}
