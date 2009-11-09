/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import functional.CompileException;
import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.Function;
import functional.Obj;
import functional.Tail;

public class Statements implements Function.CompileableBody {
	private Cons mBody;

	public Statements( Cons body ) {
		assert( body != null );
		mBody = body;
	}

	public Function.Body compile(Environment env) {
		mBody = compileStatements(mBody, env);
		return this;
	}

	private Cons compileStatements(Cons statements, Environment env) {
		Obj cdr = statements.cdr();
		if( cdr.isCons() ) {
			cdr = compileStatements((Cons)cdr, env);
		} else if( !cdr.isNull() ) {
			throw new CompileException("Malformed body", env);
		}
		return new Cons(statements.car().compile(env), cdr);
	}

	public Obj invoke(Environment env) {
		Obj result = null;
		Obj body = mBody;
		Tail tail = env.getTail();
		while( body.isCons() ) {
			Cons statements = (Cons)body;
			if( statements.cdr().isNull() && tail != null) {
				if( statements.car().isCons() ) {
					tail.set((Cons)statements.car(), env);
				}
			}
			result = statements.car().eval( env );
			body = statements.cdr();
		}

		if( !body.isNull() || result == null ) {
			throw new EvalException( "Malformed statements.", env );
		}
		return result;
	}
}