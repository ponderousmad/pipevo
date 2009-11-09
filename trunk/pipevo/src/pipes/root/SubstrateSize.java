/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

/**
 * Value class to represent the board (substrate) size.
 */
final public class SubstrateSize {
	SubstrateSize( int width, int height ) {
		mWidth = width;
		mHeight = height;
	}

	int width() {
		return mWidth;
	}

	int height() {
		return mHeight;
	}

	private final int mWidth;
	private final int mHeight;
}