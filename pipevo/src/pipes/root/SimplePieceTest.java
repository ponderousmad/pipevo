/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import pipes.root.PieceType.SingleType;
import junit.framework.TestCase;

public class SimplePieceTest extends TestCase {
	public void singlePieceTest( SingleType type ) {
		Piece piece = new SimplePiece( type );

		assertFalse( piece.isFull(type.start()) );
		assertFalse( piece.isFull(type.end()) );
		assertFalse( piece.isFull(null));
		piece.fill( type.start() );
		assertTrue( piece.isFull(type.start()) );
		assertTrue( piece.isFull(type.end()) );
		assertTrue( piece.isFull(null) );

		assertEquals( piece.getFarSide( type.start() ), type.end() );
		assertEquals( piece.getFarSide( type.end() ), type.start() );
		for( Side side : Side.values() ) {
			if( side != type.start() && side != type.end() ) {
				assertNull( piece.getFarSide(side) );
				assertFalse( piece.isPipeAt(side) );
			}
		}

		assertTrue( piece.isPipeAt( type.start() ) );
		assertTrue( piece.isPipeAt( type.end() ) );
	}

	public void testPieces() {
		singlePieceTest( SingleType.HORIZONTAL );
		singlePieceTest( SingleType.VERTICAL );
		singlePieceTest( SingleType.TOP_LEFT );
		singlePieceTest( SingleType.TOP_RIGHT );
		singlePieceTest( SingleType.BOTTOM_LEFT );
		singlePieceTest( SingleType.BOTTOM_RIGHT );
	}
}
