/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import java.util.Random;

import junit.framework.TestCase;

public class PieceFactoryTest extends TestCase {
	public void testBuildPieceInt() {
		for( int j = 0; j < 10; ++j ) {
			for( PieceType type : PieceType.values() ) {
				Piece piece = PieceFactory.buildPiece( type );
				Piece pieceAgain = PieceFactory.buildPiece( type );
				assertNotNull( piece );
				assertNotNull( pieceAgain );
				assertNotSame( piece, pieceAgain );
				assertSame( piece.type(), type );
			}
		}
	}

	public void testBuildRandom() {
		Random random = new Random();
		for( int j = 0; j < 10; ++j ) {
			Piece piece = PieceFactory.randomPiece(random);
			assertNotNull( piece );
			assertFalse( piece.type().isSource() );
		}
	}
}
