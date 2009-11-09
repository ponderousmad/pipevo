/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import pipes.root.GamePlay;
import pipes.root.Position;
import pipes.root.Side;
import pipes.root.Substrate;

public class BorderDiscarder implements Discarder {

	public BorderDiscarder( GamePlay game ) {
		mStracetate = new SubstrateWrapper( game.substrate() );
		setGame( game );
	}

	public BorderDiscarder( GamePlay game, Stracetate stracetate ) {
		mStracetate = stracetate;
		setGame( game );
	}

	private void setGame( GamePlay game ) {
		mGame = game;
		mCounter = 0;
		mSideLength = game.width() - 1;
		mEdgeNumber = 3;
	}

	public Position discard() {
		return dumpPosition();
	}

	Position moveClockwise( Position position ) {
		Position nextSide = position.to( mDumpNextSide );
		mCounter++;
		if( mCounter == mSideLength ) {
			mCounter = 0;
			mDumpNextSide = mDumpNextSide.clockwise();
			if( mEdgeNumber == 1 ) {
				mEdgeNumber = 2;
				--mSideLength;
				if( mSideLength == 0 ) {
					return null;
				}
			} else {
				--mEdgeNumber;
			}
		}
		return nextSide;
	}

	Position dumpPosition() {
		if( mDump == null ) {
			mDump = findTheDump();
		}
		while( mDump != null && !mStracetate.isEmpty( mDump ) ) {
			mDump = moveClockwise( mDump );
		}
		return mDump;
	}

	private Position findTheDump()
	{
		Position source = mGame.sourcePosition();
		Substrate substrate = mGame.substrate();
		int[] pos = source.coords();
		boolean left = pos[0] > ( mGame.width()  / 2 );
		boolean top  = pos[1] > ( mGame.height() / 2 );
		Position theDump;
		if( top && left ) {
			theDump = substrate.corner( Substrate.Corner.TOP_LEFT );
			mDumpNextSide = Side.RIGHT;
		} else if( top ) {
			theDump = substrate.corner( Substrate.Corner.TOP_RIGHT );
			mDumpNextSide = Side.BOTTOM;
		} else if( left ) {
			theDump = substrate.corner( Substrate.Corner.BOTTOM_LEFT );
			mDumpNextSide = Side.TOP;
		} else {
			theDump = substrate.corner( Substrate.Corner.BOTTOM_RIGHT );
			mDumpNextSide = Side.LEFT;
		}

		return theDump;

	}

	private Stracetate mStracetate;
	private GamePlay mGame;

	private Position mDump;
	private Side mDumpNextSide;
	private int mEdgeNumber;
	private int mSideLength;

	private int mCounter;
}
