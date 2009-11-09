/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Represent the floating point primitive (double precision).
 */
public class Real implements Obj {

	public Real( double value ) {
		mValue = value;
	}

	public boolean isReal() {
		return true;
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
		return Double.toString( mValue );
	}

	public double value() {
		return mValue;
	}

	private double mValue;
}
