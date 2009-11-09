/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * The canonical 'True' value representation.
 */
public class True implements Obj {

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
		return false;
	}

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String toString() {
		return "#t";
	}

	private True() {
	}

	public static True TRUE = new True();
}
