/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

/**
 * Enumerate all the types of pieces and provide some mappings to associated constants.
 */
public enum PieceType {
	SIMPLE_HORIZONTAL  ( SingleType.HORIZONTAL ),
	SIMPLE_VERTICAL    ( SingleType.VERTICAL ),
	SIMPLE_TOP_LEFT    ( SingleType.TOP_LEFT ),
	SIMPLE_TOP_RIGHT   ( SingleType.TOP_RIGHT ),
	SIMPLE_BOTTOM_LEFT ( SingleType.BOTTOM_LEFT ),
	SIMPLE_BOTTOM_RIGHT( SingleType.BOTTOM_RIGHT ),
	DUAL_CROSS         ( DualType.CROSS ),
	DUAL_TOP_RIGHT     ( DualType.TOP_LEFT ),
	DUAL_TOP_LEFT      ( DualType.TOP_RIGHT ),
	SOURCE_TOP         ( Side.TOP ),
	SOURCE_BOTTOM      ( Side.BOTTOM ),
	SOURCE_LEFT        ( Side.LEFT ),
	SOURCE_RIGHT       ( Side.RIGHT );

	/**
	 * Enumerate all the single pipe types. (two straights and four bends).
	 */
	public enum SingleType {
		HORIZONTAL  ( Side.LEFT,   Side.RIGHT ),
		VERTICAL    ( Side.TOP,    Side.BOTTOM ),
		TOP_LEFT    ( Side.TOP,    Side.LEFT ),
		TOP_RIGHT   ( Side.TOP,    Side.RIGHT ),
		BOTTOM_LEFT ( Side.BOTTOM, Side.LEFT ),
		BOTTOM_RIGHT( Side.BOTTOM, Side.RIGHT );

		SingleType( Side start, Side end ) {
			mStart = start;
			mEnd = end;
		}

		/**
		 * Gets the side of the tile where the pipe 'starts'.
		 */
		Side start() { return mStart; }

		/**
		 * Gets the side of the tile where the pipe 'ends'.
		 */
		Side end() { return mEnd; }

		/**
		 * Gets the piece type associated a single pipe type.
		 */
		PieceType type() {
			switch( this ) {
				case HORIZONTAL:   return SIMPLE_HORIZONTAL;
				case VERTICAL:     return SIMPLE_VERTICAL;
				case TOP_LEFT:     return SIMPLE_TOP_LEFT;
				case TOP_RIGHT:    return SIMPLE_TOP_RIGHT;
				case BOTTOM_LEFT:  return SIMPLE_BOTTOM_LEFT;
				case BOTTOM_RIGHT: return SIMPLE_BOTTOM_RIGHT;
			}
			throw new RuntimeException("Null type");
		}

		private Side mStart, mEnd;
	}

	/**
	 * Enumerate all the 2 pipe pieces. (The cross and two double bends).
	 */
	public enum DualType {
		CROSS    ( SingleType.HORIZONTAL, SingleType.VERTICAL ),
		TOP_LEFT ( SingleType.TOP_LEFT,   SingleType.BOTTOM_RIGHT ),
		TOP_RIGHT( SingleType.TOP_RIGHT,  SingleType.BOTTOM_LEFT );

		DualType( SingleType first, SingleType second ) {
			mFirst = first;
			mSecond = second;
		}

		/**
		 * Gets one of the two single pipe types making up this dual.
		 */
		public SingleType first() {
			return mFirst;
		}

		/**
		 * Gets the other of the two single pipe types making up this dual.
		 */

		public SingleType second() {
			return mSecond;
		}

		/**
		 * Gets the piece type associated with the dual type.
		 */
		PieceType type() {
			switch( this ) {
				case CROSS:      return DUAL_CROSS;
				case TOP_LEFT:   return DUAL_TOP_LEFT;
				case TOP_RIGHT:  return DUAL_TOP_RIGHT;
			}
			throw new RuntimeException("Null type");
		}

		private SingleType mFirst, mSecond;
	}

	PieceType( SingleType type ) {
		mSingle = type;
	}
	PieceType( DualType type ) {
		mDual = type;
	}
	PieceType( Side sourceDirection ) {
		mSourceDirection = sourceDirection;
	}

	/**
	 * Gets the number of piece types that are not sources.
	 */
	public static int nonSourceCount() {
		return SingleType.values().length + DualType.values().length;
	}

	/**
	 * Does the piece consist of a single piece of pipe?
	 */
	public boolean isSingle() {
		return mSingle != null;
	}

	/**
	 * Gets the single type associated this piece.
	 * @return The single type, or null if the piece is not a single.
	 */
	public SingleType singleType() {
		return mSingle;
	}

	/**
	 * Does the piece consist of two pipe pieces?
	 */
	public boolean isDual() {
		return mDual != null;
	}

	/**
	 * Gets the dual type associated with this piece.
	 * @return The dual type, or null if the piece is not a dual.
	 */
	public DualType dualType() {
		return mDual;
	}

	/**
	 * Is this a source pipe?
	 */
	public boolean isSource() {
		return mSourceDirection != null;
	}

	/**
	 * Gets the source direction associated with this piece.
	 * @return The source direction, or null if the piece is not a source.
	 */
	public Side sourceDirection() {
		return mSourceDirection;
	}

	private Side mSourceDirection = null;
	private SingleType mSingle = null;
	private DualType mDual = null;
}