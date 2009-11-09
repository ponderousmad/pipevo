/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

/**
 * Keeps track of a position on a given size board.
 */
public class Position {

	/**
	 * Construct a new position and check the coordinates for validity.
	 * @param size The board size.
	 * @param i The zero based horizontal coordinate.
	 * @param j The zero based vertical coordinate.
	 */
	public Position( SubstrateSize size, int i, int j ) {
		mSize = size;
		mI = i >= 0 && i < mSize.width() ? i : INVALID;
		mJ = j >= 0 && j < mSize.height() ? j : INVALID;
	}

	Position( Position other ) {
		if( other != null ) {
			mSize = other.mSize;
			mI = other.mI;
			mJ = other.mJ;
		}
	}

	public int[] coords() {
		assert( valid() );
		return new int[]{ mI, mJ };
	}

	public Position clone() {
		return new Position( this );
	}

	public boolean valid() {
		return mI != INVALID && mJ != INVALID;
	}

	public boolean equals( Position other ) {
		return mI == other.mI && mJ == other.mJ && other.mSize == other.mSize;
	}

	public Position to( Side side ) {
		return clone().moveTo( side );
	}

	/**
	 * Relocate this position to the adjacent position to the specified side.
	 * @param side The direction to move.
	 * @return The new position, which may be invalid if the direction indicated
	 * the edge of the board.
	 */
	public Position moveTo( Side side ) {
		if( !valid() ) {
			return this;
		}
		if( side == null ) {
			mI = mJ = INVALID;
		}
		// If already at left/top, will make invalid: ( 0 - 1 = INVALID )
		if( side == Side.LEFT ) {
			--mI;
		} else if( side == Side.TOP ) {
			--mJ;
		} else if( side == Side.RIGHT ) {
			++mI;
		} else if( side == Side.BOTTOM ) {
			++mJ;
		}
		if( mI >= mSize.width() ) {
			mI = INVALID;
		}
		if( mJ >= mSize.height() ) {
			mJ = INVALID;
		}
		return this;
	}

	/**
	 * Calculate the Manhattan distance between this position and another.
	 */
	public int manhattanDistance(Position other) {
		return ( Math.abs(other.mI - mI) + Math.abs(other.mJ - mJ));
	}

	private static final int INVALID = -1;

	private SubstrateSize mSize;
	int mI = INVALID;
	int mJ = INVALID;
}