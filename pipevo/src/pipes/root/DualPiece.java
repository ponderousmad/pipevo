/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

/**
 * Keeps track of a piece with two bits of pipe.
 */
public class DualPiece implements Piece {

	DualPiece( PieceType.DualType type ) {
		assert( type != null );
		mFirstPiece = new SimplePiece( type.first() );
		mSecondPiece = new SimplePiece( type.second() );
	}

	public Side getFarSide(Side side) {
		Side firstSide = mFirstPiece.getFarSide( side );
		Side secondSide = mSecondPiece.getFarSide( side );
		assert( firstSide == null || secondSide == null );
		if( firstSide != null ) {
			return firstSide;
		} else {
			return secondSide;
		}
	}

	public boolean isPipeAt(Side side) {
		return mFirstPiece.isPipeAt( side ) || mSecondPiece.isPipeAt( side );
	}

	public boolean fill(Side side) {
		// Short circuit is ok since we can only fill one side
		return mFirstPiece.fill( side ) || mSecondPiece.fill( side );
	}

	public boolean isFull(Side side) {
		return mFirstPiece.isFull(side) || mSecondPiece.isFull(side);
	}

	public void accept(PieceVisitor viewer) {
		mFirstPiece.accept( viewer );
		mSecondPiece.accept( viewer );
	}

	public PieceType type() {
		if( mFirstPiece.type() == PieceType.DualType.CROSS.first().type() ) {
			return PieceType.DUAL_CROSS;
		} else if( mFirstPiece.type() == PieceType.DualType.TOP_LEFT.first().type() ) {
			return PieceType.DUAL_TOP_LEFT;
		} else if( mFirstPiece.type() == PieceType.DualType.TOP_RIGHT.first().type() ) {
			return PieceType.DUAL_TOP_RIGHT;
		}
		throw new RuntimeException( "Dual has invalid type" );
	}

	private SimplePiece mFirstPiece;
	private SimplePiece mSecondPiece;
}
