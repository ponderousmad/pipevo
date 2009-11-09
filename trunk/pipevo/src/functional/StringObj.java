/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

public class StringObj implements Obj {

	private String mString;

	public StringObj( String string ) {
		mString = string;
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
		return true;
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

	public String value() {
		return mString;
	}

	public String toString() {
		return "\"" + mString + "\"";
	}
}
