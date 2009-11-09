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
import functional.True;

public class And extends SpecialForm {
	public Obj invoke( Environment env, Obj arguments ) {
		while( arguments.isCons() ) {
			Cons args = (Cons)arguments;
			Obj next = args.car().eval( env );
			if( next.isNull() ) {
				return next;
			}
			if( args.cdr().isNull() ) {
				return True.TRUE;
			}
			arguments = args.cdr();
		}
		throw new EvalException("Malformed and", env);
	}

	public String toString() { return "and"; }
}
