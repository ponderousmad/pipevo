/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

public class Symbol implements Obj {
	private String mName;

	public Symbol( String name ) {
		mName = name;
	}

	public boolean isFunction() {
		return false;
	}

	public boolean isSpecialForm() {
		return false;
	}

	public boolean isFixNum() {
		return false;
	}

	public boolean isReal() {
		return false;
	}

	public boolean isString() {
		return false;
	}

	public boolean isSymbol() {
		return true;
	}

	public boolean isCons() {
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public Obj eval( Environment env ) {
		return env.lookup( this );
	}

	public Obj compile( Environment env ) {
		Obj found = env.tryLookup( this );
		if( found != null ) {
			return found;
		}
		return this;
	}

	public String toString() {
		return mName;
	}

	public String name() {
		return mName;
	}
}
