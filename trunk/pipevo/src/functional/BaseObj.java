/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Convienience base class for object types with resonable defaults.
 */
public class BaseObj implements Obj {

	public Obj eval(Environment env) {
		return this;
	}

	public Obj compile(Environment env) {
		return this;
	}

	public boolean isCons() {
		return false;
	}

	public boolean isFixNum() {
		return false;
	}

	public boolean isFunction() {
		return false;
	}

	public boolean isNull() {
		return false;
	}

	public boolean isReal() {
		return false;
	}

	public boolean isSpecialForm() {
		return false;
	}

	public boolean isString() {
		return false;
	}

	public boolean isSymbol() {
		return false;
	}
}
