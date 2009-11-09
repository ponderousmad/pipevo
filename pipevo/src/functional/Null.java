/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Explicitly represents null.
 */
public class Null implements Obj {

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
		return false;
	}

	public boolean isCons() {
		return false;
	}

	public boolean isNull() {
		return true;
	}

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String toString() {
		return "()";
	}

	private Null() {
	}

	public static final Null NULL = new Null();
}
