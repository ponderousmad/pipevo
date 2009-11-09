/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.Random;

import functional.Obj;
import functional.type.Type;

public interface Gene {
	public Obj express( Context context );
	public Type type();

	public Gene mutate( Mutation mutation, Context context, Random random );
}
