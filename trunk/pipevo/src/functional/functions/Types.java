/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.functions;

import functional.Environment;
import functional.Function;
import functional.Null;
import functional.Obj;
import functional.True;

public class Types {
	public static void install( Environment env ) {
		env.add( new Function( "isCons?", new String[] {"c"}, null, new Function.Body() {
			public Obj invoke(Environment env) {
				return env.lookup( "c" ).isCons() ? True.TRUE : Null.NULL;
			}
		}));

		env.add( new Function( "isSym?", new String[] { "s" }, null, new Function.Body() {
			public Obj invoke( Environment env ) {
				return env.lookup( "s" ).isSymbol() ? True.TRUE : Null.NULL ;
			}
		}));

		env.add( new Function( "isString?", new String[] { "s" }, null, new Function.Body() {
			public Obj invoke( Environment env ) {
				return env.lookup( "s" ).isString() ? True.TRUE : Null.NULL ;
			}
		}));

		env.add( new Function( "isFn?", new String[] { "f" }, null, new Function.Body() {
			public Obj invoke( Environment env ) {
				return env.lookup( "f" ).isFunction() ? True.TRUE : Null.NULL ;
			}
		}));

		env.add( new Function( "isMacro?", new String[] { "m" }, null, new Function.Body() {
			public Obj invoke( Environment env ) {
				return env.lookup( "m" ).isSpecialForm() ? True.TRUE : Null.NULL ;
			}
		}));

		env.add( new Function( "isNull?", new String[] { "n" }, null, new Function.Body() {
			public Obj invoke( Environment env ) {
				return env.lookup( "n" ).isNull() ? True.TRUE : Null.NULL ;
			}
		}));

		env.add( new Function( "isFixNum?", new String[] { "x" }, null, new Function.Body() {
			public Obj invoke( Environment env ) {
				return env.lookup( "x" ).isFixNum() ? True.TRUE : Null.NULL ;
			}
		}));

		env.add( new Function( "isReal?", new String[] { "x" }, null, new Function.Body() {
			public Obj invoke( Environment env ) {
				return env.lookup( "x" ).isReal() ? True.TRUE : Null.NULL ;
			}
		}));
	}
}
