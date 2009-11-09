/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Obj;
import functional.True;
import functional.type.BaseType;
import functional.type.Type;

public class TrueGene implements Gene, Serializable {
	private static final long serialVersionUID = 8095791718163656229L;

	public Obj express(Context context) {
		return True.TRUE;
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		return this;
	}

	public Type type() {
		return BaseType.TRUE;
	}

	public Gene copy() {
		return new TrueGene();
	}
}
