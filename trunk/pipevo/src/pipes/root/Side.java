/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

/**
 * Enumerate the sides of pieces/tiles and associated constants.
 */
public enum Side {
	TOP,
	BOTTOM,
	LEFT,
	RIGHT;

	public Side opposite() { return OPPOSITES[ ordinal() ]; }
	public Side clockwise() { return CLOCKWISE[ ordinal() ]; }
	public Side counterClockwise() { return COUNTER_CLOCKWISE[ ordinal() ]; }

	private static final Side[] OPPOSITES = { BOTTOM, TOP, RIGHT, LEFT };
	private static final Side[] CLOCKWISE = { RIGHT, LEFT, TOP, BOTTOM };
	private static final Side[] COUNTER_CLOCKWISE = { LEFT, RIGHT, BOTTOM, TOP };
}
