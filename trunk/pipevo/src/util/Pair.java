/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package util;

import java.io.Serializable;

/**
 * Represents a generic pair.
 */
public class Pair<T,U> implements Serializable {
	private static final long serialVersionUID = 8687404829200552490L;

	public T first;
	public U second;

	public Pair(T first, U second) {
		this.first = first;
		this.second = second;
	}
}