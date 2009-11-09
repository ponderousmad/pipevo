/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import junit.framework.TestCase;
import java.util.Random;

public class PieceQueueTest extends TestCase {
	public void testPeek()
	{
		int testSize = 3;
		PieceQueue queue = new PieceQueue( testSize, new Random() );

		Piece[] pieces = queue.peek();
		Piece[] piecesAgain = queue.peek();

		assertNotNull( pieces );
		assertNotNull( piecesAgain );
		assertEquals( pieces.length, testSize );
		assertEquals( piecesAgain.length, testSize );

		for( int i = 0; i < testSize; ++i ) {
			assertNotNull( pieces[i] );
			assertSame( pieces[i], piecesAgain[i] );
			if( i > 0 ) {
				assertNotSame( pieces[i], pieces[i-1] );
			}
		}
	}

	public void testNextPiece()
	{
		int testSize = 3;
		PieceQueue queue = new PieceQueue( testSize, new Random() );
		Piece[] peekPieces = queue.peek();

		for( int i = 0; i < testSize; ++i ) {
			Piece nextPiece = queue.nextPiece();
			assertNotNull( nextPiece );
			assertSame( nextPiece, peekPieces[i] );
		}
	}

	public void testSize() {
		int testSize = 4;
		PieceQueue queue = new PieceQueue( testSize, new Random() );
		assertNotNull( queue );
		assertEquals( queue.size(), testSize );
	}
}
