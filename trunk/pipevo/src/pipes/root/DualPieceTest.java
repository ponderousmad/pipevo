/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import pipes.root.Side;
import pipes.root.PieceType.DualType;
import junit.framework.TestCase;

public class DualPieceTest extends TestCase {
	public void fullnessTest( DualType type ) {
		DualPiece piece = new DualPiece( type );

		assertFalse(piece.isFull(null));
		assertFalse(piece.isFull(Side.TOP));
		assertFalse(piece.isFull(Side.BOTTOM));
		assertFalse(piece.isFull(Side.LEFT));
		assertFalse(piece.isFull(Side.RIGHT));

		boolean filled = piece.fill( null );
		assertFalse( filled );
		assertFalse(piece.isFull(null));

		filled = piece.fill( type.first().start() );
		assertTrue( filled );

		assertTrue(piece.isFull(null));
		assertTrue(piece.isFull(type.first().start()));
		assertTrue(piece.isFull(type.first().end()));
		assertFalse(piece.isFull(type.second().start()));
		assertFalse(piece.isFull(type.second().end()));

		filled = piece.fill( type.second().end() );
		assertTrue( filled );

		assertTrue(piece.isFull(null));
		assertTrue(piece.isFull(Side.TOP));
		assertTrue(piece.isFull(Side.BOTTOM));
		assertTrue(piece.isFull(Side.LEFT));
		assertTrue(piece.isFull(Side.RIGHT));
	}

	private void sidesTestSingle(DualPiece piece, PieceType.SingleType type) {
		assertTrue( piece.isPipeAt(type.start()) );
		assertTrue( piece.isPipeAt(type.end()) );
		assertEquals( piece.getFarSide( type.start() ), type.end() );
		assertEquals( piece.getFarSide( type.end() ), type.start() );
	}

	public void sidesTest( DualType type ) {
		DualPiece piece = new DualPiece( type );
		sidesTestSingle(piece, type.first());
		sidesTestSingle(piece, type.second());
	}

	public void pieceTests( DualType type ) {
		fullnessTest( type );
		sidesTest( type );
	}

	public void testPieces() {
		for( DualType type : DualType.values() ) {
			pieceTests( type );
		}
	}
}
