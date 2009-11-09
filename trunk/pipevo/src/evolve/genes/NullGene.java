/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Null;
import functional.Obj;
import functional.type.BaseType;
import functional.type.Type;

public class NullGene implements Gene, Serializable {
	private static final long serialVersionUID = 4062847001468592113L;

	public Obj express(Context context) {
		return Null.NULL;
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		return this;
	}

	public Type type() {
		return BaseType.NULL;
	}

	public Gene copy() {
		return new NullGene();
	}
}
