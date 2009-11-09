/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

/**
 * Keeps track of the pieces on the game board.
 */
public class Substrate {
	/**
	 * Construct with the specified size in tiles.
	 */
	public Substrate( SubstrateSize size ) {
		mSize = size;
		mPieces = new Piece[ mSize.width() ][ mSize.height() ];
	}

	/**
	 * Enumerates the corners of the board.
	 */
	public enum Corner { TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT };

	/**
	 * Get the position at the specified corner.
	 */
	public Position corner( Corner c ) {
		switch( c ) {
		case TOP_LEFT:
			return new Position( mSize, 0, 0 );
		case TOP_RIGHT:
			return new Position( mSize, mSize.width() - 1, 0 );
		case BOTTOM_LEFT:
			return new Position( mSize, 0, mSize.height() - 1 );
		case BOTTOM_RIGHT:
			return new Position( mSize, mSize.width() - 1, mSize.height() - 1 );
		}
		return null;
	}

	/**
	 * Check if there is a piece at the specified position.
	 */
	public boolean isEmpty( Position position ) {
		return at( position ) == null;
	}

	/**
	 * If the position is empty, place specified piece at that position.
	 */
	void placePiece( Position position, Piece piece ) {
		if( isEmpty(position) ) {
			++mPieceCount;
			mPieces[position.mI][position.mJ] = piece;
		}
	}

	/**
	 * Gets the piece at the specified position.
	 * @return The piece at that location, or null if there is none.
	 */
	public Piece at( Position position ) {
		if( position.valid() ) {
			return mPieces[ position.mI ][ position.mJ ];
		}
		return null;
	}

	/**
	 * Gets the number of tiles with no pieces.
	 */
	public int empties() {
		return ( mSize.width() * mSize.height() ) - mPieceCount;
	}

	/**
	 * Gets the size of the board.
	 */
	public SubstrateSize size() {
		return mSize;
	}

	private SubstrateSize mSize;
	private	final Piece[][] mPieces;
	private int mPieceCount = 0;
}
