/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

import java.util.List;

public interface Environment {
	class AbortRef {
		private RuntimeException mAbort = null;
		synchronized public void abort(RuntimeException ex) {
			mAbort = ex;
		}

		synchronized public RuntimeException abort() {
			return mAbort;
		}
	}

	RuntimeException abort();
	AbortRef getAbort();

	Obj lookup( String name );
	Obj lookup( Symbol symbol );
	Obj tryLookup( String name );
	Obj tryLookup( Symbol symbol );
	Symbol add( String name, Obj value );
	Symbol add( Function function );
	Symbol set( String name, Obj value );
	void shadow( String name );

	List<String> context();

	boolean useTails();
	Tail getTail();
	void setTail(Cons cons, Environment env);
	void setupTail();
	void clearTail();
}
