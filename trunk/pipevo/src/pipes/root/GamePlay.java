/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import java.util.ArrayList;
import java.util.List;
import java.util.Random;

import pipes.root.GamePlay.GameplayObserver.Event;

/**
 * Core Gameplay logic.
 */
public class GamePlay {
	/**
	 * Create a new default sized game with the given seed.
	 * @param seed Random number generator seed.
	 * @return A new gameplay object.
	 */
	static public GamePlay create( long seed ) {
		return new GamePlay( 12, 12, 5, 15, seed );
	}

	/**
	 * Construct a new game.
	 * @param width The width of the game board in tiles.
	 * @param height The hight of the game board in tiles.
	 * @param queueSize The number of pieces visible in the queue.
	 * @param movesTillFlow How many tiles are placed before the flow begins.
	 * @param seed Random number generator seed.
	 */
	public GamePlay( int width, int height, int queueSize, int movesTillFlow, long seed ) {
		mSize = new SubstrateSize( width, height );
		mSubstrate = new Substrate( mSize );

		mRandom = new Random( seed );
		mQueue = new PieceQueue( queueSize, mRandom );

		mFlowPiece = setupSource();
		mFlowOut = mSourceOut;
		mFlowPosition = sourcePosition();
		mFlowCount = -movesTillFlow;
	}

	private Piece setupSource() {
		Side[] sides = Side.values();
		mSourceOut = sides[mRandom.nextInt(sides.length)];
		Piece source = new SourcePiece( mSourceOut );

		// Don't place the source at the boundry, so we don't
		// have to make sure it doesn't point off the board
		mSourcePosition = new Position( mSize,
			1 + mRandom.nextInt( mSize.width() - 2 ),
			1 + mRandom.nextInt( mSize.height() - 2 )
		);
		mSubstrate.placePiece( mSourcePosition, source );
		return source;
	}

	public boolean placeNext( Position position ) {
		if( isGameOver() ) {
			return false;
		}
		if( position.valid() && mSubstrate.isEmpty( position ) ) {
			Piece nextPiece = mQueue.nextPiece();
			mSubstrate.placePiece( position, nextPiece );
			updateFlow();
			return true;
		}
		return false;
	}

	public boolean isGameOver() {
		if( mFlowPiece == null ) {
			return true;
		}
		Position nextPos = mFlowPosition.to(mFlowOut);
		if( !nextPos.valid() ) {
			return true;
		}
		Piece next = mSubstrate.at(nextPos);
		if( next != null && !next.isPipeAt(mFlowOut.opposite()) ) {
			return true;
		}
		return false;
	}

	public int score() {
		return mFlowCount > 0 ? mFlowCount : 0;
	}

	public Position sourcePosition() {
		return mSourcePosition.clone();
	}

	public Side sourceOut() {
		return mSourceOut;
	}

	public void updateFlow() {
		++mFlowCount;
		// When we fill the source, we don't
		// update the flow in/out
		if( mFlowCount == -1 ) {
			notify( Event.TAP );
		} else if( mFlowCount == 0 ) {
			mFlowPiece.fill( null );
		} else if( mFlowCount > 0 ) {
			// We have to wait till just before we
			// fill the next piece to find out what piece
			// is next, because it might have just
			// been placed.
			mFlowPosition.moveTo( mFlowOut );
			mFlowPiece = mSubstrate.at( mFlowPosition );
			if( mFlowPiece != null ) {
				Side flowIn = mFlowOut.opposite();
				mFlowPiece.fill( flowIn );
				mFlowOut = mFlowPiece.getFarSide( flowIn );
			}
		}
		notify( Event.FILL );
	}

	public interface GameplayObserver {
		public enum Event { TAP, FILL }
		void updateGameplay( Event event );
	}

	public void addObserver( GameplayObserver observer ) {
		if( observer != null ) {
			mObservers.add( observer );
		}
	}

	public void clearObservers() {
		mObservers.clear();
	}

	private void notify( Event event ) {
		for( GameplayObserver observer : mObservers ) {
			observer.updateGameplay( event );
		}
	}

	/**
	 * Get a look at the upcoming pieces.
	 * @return
	 */
	public Piece[] peek() {
		return mQueue.peek();
	}

	/**
	 * Gets the width of the board in tiles.
	 */
	public int width() {
		return mSize.width();
	}

	/**
	 * Gets the height of the board in tiles.
	 */
	public int height() {
		return mSize.height();
	}

	/**
	 * Construct a position object for this game board.
	 * @param i The horizontal tile index (zero based).
	 * @param j The vertial tile index (zero based).
	 * @return A game position, invalid if the i and j are not valid indices.
	 */
	public Position position( int i, int j ) {
		return new Position( mSize, i, j );
	}

	/**
	 * Gets the current game board contents.
	 */
	public Substrate substrate() {
		return mSubstrate;
	}

	/**
	 * Force the time to flow so that the tap never opens.
	 */
	public void setInfiniteTimeToFlow() {
		mFlowCount = -1*(mSize.height()*mSize.width());
	}

	private SubstrateSize mSize;
	private Substrate mSubstrate;
	private PieceQueue mQueue;
	private List<GameplayObserver> mObservers = new ArrayList<GameplayObserver>();

	private int mFlowCount;
	private Piece mFlowPiece;
	private Side mFlowOut;
	private Position mFlowPosition;

	private Side mSourceOut;
	private Position mSourcePosition;
	private Random mRandom;
}
