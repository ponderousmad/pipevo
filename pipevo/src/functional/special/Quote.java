/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.Obj;
import functional.SpecialForm;

public class Quote extends SpecialForm {
	public Obj invoke( Environment env, Obj arguments ) {
		if( !arguments.isCons() ) {
			throw new EvalException( "Cons expected.", env );
		}
		return ((Cons)arguments).car();
	}

	public Obj compileArgs(Environment env, Obj arguments) {
		return arguments;
	}

	public String toString() { return "quote"; }
}
