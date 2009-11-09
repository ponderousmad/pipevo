/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

/**
 * Keep track of compilation errors (ie, errors which occur when optimizing s-expressions)
 */
public class CompileException extends EvalException {
	private static final long serialVersionUID = -1299762129830845968L;

	public CompileException( String message, Environment env ) {
		super( message, env );
	}
}
