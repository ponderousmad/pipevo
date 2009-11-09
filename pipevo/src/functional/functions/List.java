/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.functions;

import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.Function;
import functional.Null;
import functional.Obj;
import functional.True;

public class List {
	static public void install( Environment env ) {
		env.add( new Function( "cons", new String[] {"car","cdr"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return new Cons( env.lookup("car"), env.lookup("cdr") );
			}
		}));

		env.add( new Function( "car", new String[] {"cons"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Obj cons = env.lookup( "cons" );
				if( cons.isCons() ) {
					return ((Cons)cons).car();
				}
				throw new EvalException( "Cons expected.", env );
			}
		}));

		env.add( new Function( "cdr", new String[] {"cons"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Obj cons = env.lookup( "cons" );
				if( cons.isCons() ) {
					return ((Cons)cons).cdr();
				}
				throw new EvalException( "Cons expected.", env );
			}
		}));

		env.add( new Function( "isList?", new String[] {"l"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				Obj l = env.lookup("l");
				if( l.isNull() ) {
					return True.TRUE;
				}
				if( l.isCons() ) {
					Cons list = (Cons)l;
					while( list.cdr().isCons() ) {
						list = (Cons)list.cdr();
					}
					if( list.cdr().isNull() ) {
						return True.TRUE;
					}
				}
				return Null.NULL;
			}
		}));

		env.add( new Function( "list", new String[] {}, "rest", new Function.Body() {
			public Obj invoke(Environment env) {
				return env.lookup( "rest" );
			}
		}));
	}
}
