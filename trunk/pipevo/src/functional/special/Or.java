/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.Null;
import functional.Obj;
import functional.SpecialForm;
import functional.True;

public class Or extends SpecialForm {
	public Obj invoke( Environment env, Obj arguments ) {
		while( arguments.isCons() ) {
			Cons args = (Cons)arguments;
			Obj next = args.car().eval( env );
			if( !next.isNull() ) {
				return True.TRUE;
			}
			if( args.cdr().isNull() ) {
				return Null.NULL;
			}
			arguments = args.cdr();
		}
		throw new EvalException("Malformed or", env);
	}

	public String toString() { return "or"; }
}
