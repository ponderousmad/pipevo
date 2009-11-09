/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import functional.Environment;

public class Special {
	public static void install(Environment env) {
		env.add( "cond", new Cond() );
		env.add( "if", new If() );
		env.add( "lambda", new Lambda() );
		env.add( "quote", new Quote() );
		env.add( "let", new Let( Let.Type.PARALLEL ) );
		env.add( "let*", new Let( Let.Type.SEQUENTIAL ) );
		env.add( "labels", new Labels() );
		env.add( "define", new Define() );
		env.add( "and", new And() );
		env.add( "or", new Or() );
	}
}
