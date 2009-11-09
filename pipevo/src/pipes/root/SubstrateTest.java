/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import junit.framework.TestCase;
import pipes.root.PieceType.SingleType;

public class SubstrateTest extends TestCase {
	public static void testPlace() {
		final int WIDTH = 3;
		final int HEIGHT = 4;
		SubstrateSize size = new SubstrateSize( WIDTH, HEIGHT );
		Substrate substrate = new Substrate( size );

		// Remember, this is an array of 3 "columns".
		Piece[][] pieces =
		{ {
			new SimplePiece( SingleType.BOTTOM_RIGHT ),
			new SimplePiece( SingleType.TOP_RIGHT ),
			new SimplePiece( SingleType.HORIZONTAL ),
			new SimplePiece( SingleType.HORIZONTAL )
		  }, {
			new SimplePiece( SingleType.HORIZONTAL ),
			new SimplePiece( SingleType.BOTTOM_LEFT ),
			PieceFactory.buildPiece( PieceType.DUAL_TOP_RIGHT ),
			PieceFactory.buildPiece( PieceType.DUAL_CROSS )
		  }, {
			new SimplePiece( SingleType.BOTTOM_LEFT ),
			new SimplePiece( SingleType.VERTICAL ),
			new SimplePiece( SingleType.TOP_LEFT ),
			new SimplePiece( SingleType.VERTICAL )
		} };

		for( int i = 0; i < WIDTH; ++i ) {
			for( int j = 0; j < HEIGHT; ++j ) {
				Position position = new Position( size, i, j );
				assertTrue( substrate.isEmpty( position ) );
				substrate.placePiece( position, pieces[i][j] );
				assertFalse( substrate.isEmpty( position ) );
				assertSame( substrate.at( position ), pieces[i][j] );
			}
		}
	}
}
