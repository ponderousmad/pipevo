/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

public class SpecialForm implements Obj {

	public boolean isFunction() {
		return false;
	}

	public boolean isSpecialForm() {
		return true;
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

	public Obj compile(Environment env) {
		return this;
	}

	public Obj compile(Environment env, Obj arguments) {
		return Cons.prependList(this, compileArgs(env, arguments));
	}

	public Obj compileArgs(Environment env, Obj arguments) {
		return Cons.compileList(env, arguments);
	}

	public Obj invoke(Environment env, Obj arguments) {
		return Null.NULL;
	}
}
