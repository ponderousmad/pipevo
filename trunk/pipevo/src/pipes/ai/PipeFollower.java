/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import pipes.root.GamePlay;
import pipes.root.Piece;
import pipes.root.Position;
import pipes.root.Side;

public class PipeFollower {
	public PipeFollower( GamePlay game ) {
		setup( game, new SubstrateWrapper( game.substrate() ) );
	}

	public PipeFollower( GamePlay game, Stracetate stracetate ) {
		setup( game, stracetate );
	}

	private void setup( GamePlay game, Stracetate stracetate ) {
		mStracetate = stracetate;
		mOutSide = game.sourceOut();
		mPosition = game.sourcePosition();
		mPosition.moveTo( mOutSide );
		mOpenEnd = false;
		assert( mPosition.valid() );
	}

	public boolean follow() {
		do {
			if( mStracetate.isEmpty( mPosition ) ) {
				mOpenEnd = true;
				return true;
			}
			Piece piece = mStracetate.at( mPosition );
			Side inSide = mOutSide.opposite();
			if( !piece.isPipeAt( inSide ) ) {
				mOpenEnd = false;
				return false;
			}
			++mLength;
			if( piece.isFull( inSide ) ) {
				++mFilled;
			}
			mOutSide = piece.getFarSide( inSide );
			mPosition.moveTo( mOutSide );
		} while( mPosition.valid() );
		mOpenEnd = false;
		return false;
	}

	public Side outDirection() {
		return mOutSide;
	}

	public Position outPosition() {
		return mPosition;
	}

	public boolean isEndOpen() {
		return mOpenEnd;
	}

	public static PipeFollower follow( GamePlay game, Stracetate stracetate ) {
		PipeFollower follower = new PipeFollower( game, stracetate );
		follower.follow();
		return follower;
	}

	public static PipeFollower follow( GamePlay game ) {
		PipeFollower follower = new PipeFollower( game );
		follower.follow();
		return follower;
	}

	public int length() { return mLength; }
	public int filled() { return mFilled; }

	private Stracetate mStracetate;
	private Position mPosition;
	private Side mOutSide;
	private boolean mOpenEnd;

	private int mLength = 0;
	private int mFilled = 0;
}