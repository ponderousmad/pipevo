/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Attempt to implement tail call elimination in limited cases.
 */
public class Tail {
	private Cons mCons;
	private Environment mEnv;

	public Tail() {
		mCons = null;
		mEnv = null;
	}

	public void set(Cons cons, Environment env)
	{
		mCons = cons;
		mEnv = env;
	}

	public Cons Cons() {
		return mCons;
	}

	public Environment Environment() {
		return mEnv;
	}

}
