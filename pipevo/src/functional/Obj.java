/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Defines an object that can be compiled or evaluated.
 * Also provides type checking functionality.
 */
public interface Obj {
	public boolean isFunction();
	public boolean isSpecialForm();
	public boolean isFixNum();
	public boolean isReal();
	public boolean isString();
	public boolean isSymbol();
	public boolean isCons();
	public boolean isNull();

	/**
	 * Determine the value of the object given the environment.
	 */
	public Obj eval( Environment env );
	
	/**
	 * Produce an efficent version of this object based on the environment.
	 */
	public Obj compile( Environment env );
}
