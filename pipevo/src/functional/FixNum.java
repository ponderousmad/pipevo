/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Represents the integer primitive. Unlike some lisps, this is limited to a standard java int.
 */
public class FixNum implements Obj {

	public FixNum( int value ) {
		mValue = value;
	}

	public boolean isFunction() {
		return false;
	}

	public boolean isSpecialForm() {
		return false;
	}

	public boolean isFixNum() {
		return true;
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

	public Obj eval( Environment env ) {
		return this;
	}

	public Obj compile( Environment env ) {
		return this;
	}

	public String toString() {
		return Integer.toString( mValue );
	}

	public int value() {
		return mValue;
	}

	private int mValue;
}
