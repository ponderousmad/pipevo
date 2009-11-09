/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.List;
import java.util.Random;

import functional.Environment;
import functional.Symbol;
import functional.type.FunctionType;

public interface Runner {
	public ObjectRegistry registry();

	public Environment environment();

	// For efficiency this method should not be 'synchronized', and thus it would be best
	// if it was 'purely functional' - ie, doesn't used any mutable instance or static fields.
	public double run( Environment env, Symbol target, Random random );
	public FunctionType targetType();
	public double maxScore();

	public List<TypeBuilder.Constraint> typeConstraints();

	public long timeoutInterval();

	public int iterations();
}