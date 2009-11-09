/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import java.util.LinkedList;
import java.util.Random;

/**
 * Keep track of the next pieces to be placed.
 */
public class PieceQueue {
	PieceQueue(int size, Random random ) {
		mQueueSize = size;
		mRandom = random;

		// Fill  the queue with enough pieces to peek.
		for( int i = 0; i < mQueueSize; ++i ) {
			mQueue.add( PieceFactory.randomPiece( mRandom ) );
		}
	}

	Piece nextPiece() {
		Piece next = mQueue.remove();
		mQueue.add( PieceFactory.randomPiece( mRandom ) );
		return next;
	}

	public Piece[] peek()	{
		return mQueue.toArray( new Piece[ mQueue.size() ] );
	}

	public int size() {
		return mQueueSize;

	}

	private LinkedList<Piece> mQueue = new LinkedList<Piece>();
	private int mQueueSize;
	private Random mRandom;
}
