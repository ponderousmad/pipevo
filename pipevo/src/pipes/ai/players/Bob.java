/* ---------------------------------------------------------------
 * Copyright © Adrian Smith and Jason Wood
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

import java.util.ArrayList;
import java.util.List;

import pipes.ai.Acetate;
import pipes.ai.FarDiscarder;
import pipes.ai.PipeFollower;
import pipes.ai.Stracetate;
import pipes.ai.SubstrateWrapper;
import pipes.root.GamePlay;
import pipes.root.Piece;
import pipes.root.PieceFactory;
import pipes.root.PieceType;
import pipes.root.Position;


public class Bob implements PipeAI {
	static private class Attempt {
		private Position mPosition = null;

		Attempt( Position target ) {
			mPosition = target;
		}

		void set( int index, Position target ) {
			if(index == 0) {
				mPosition = target;
			}
		}

		Position target() {
			return mPosition;
		}
	};

	private GamePlay mGame;
	private Position mBest;
	private double mBestLength;

	private void updateBest( Position position, double length ) {
		if( length > mBestLength ) {
			mBest = position;
			mBestLength = length;
		}
	}

	private List<Integer> buildPeeks() {
		List<Integer> peek = new ArrayList<Integer>();
		for( int i = 0; i < mGame.peek().length; i++ ) {
			peek.add(i);
		}
		return peek;
	}

	private List<Integer> remainingPeeks(List<Integer> peeks, int toRemove) {
		List<Integer> result = new ArrayList<Integer>();
		for (int peek: peeks) {
			if (peek != toRemove) {
				result.add(peek);
			}
		}
		return result;
	}

	Position discard( Stracetate stracetate ) {
		return new FarDiscarder(mGame, stracetate).discard();
	}

	private class Discard {
		// Optimization to prevent recomputing the discard location if it is needed
		// multiple times at the same recursion depth.
		public Discard( Stracetate stracetate ) { mStracetate = stracetate; }

		public Position position() {
			if( mDiscard == null ) {
				mDiscard = discard(mStracetate);
			}
			return mDiscard;
		}
		private Stracetate mStracetate;
		private Position mDiscard = null;
	}

	private Acetate tryPlace(Stracetate stracetate, int peek, Position target) {
		return new Acetate( stracetate, mGame.peek()[peek], target );
	}

	private void tryPlaces(Stracetate stracetate, List<Integer> peeks, Position first, Position hint) {
		if( !hint.valid() || !stracetate.isEmpty( hint ) ) {
			return;
		}

		Discard discard = new Discard( stracetate );
		Attempt attempt = new Attempt( first );
		for( int peek : peeks ) {
			Position target = hint;
			Stracetate acetate = tryPlace(stracetate, peek, target);
			PipeFollower pipe = PipeFollower.follow( mGame, acetate );

			if( !pipe.isEndOpen() ) {
				target = discard.position();
				acetate = tryPlace(stracetate, peek, target);
				pipe = PipeFollower.follow( mGame, acetate );
			}
			attempt.set(peek,target);
			tryPlaces(acetate, remainingPeeks(peeks, peek), attempt.target(), pipe.outPosition());
			updateBest(attempt.target(),pipe.length());
		}
	}

	private PipeFollower followPipe(Stracetate stracetate, Piece piece, Position position) {
		return PipeFollower.follow( mGame, new Acetate( stracetate, piece, position ) );
	}

	static Piece[] sPiecePrototypes;
	static {
		sPiecePrototypes = new Piece[ PieceType.nonSourceCount() ];
		for( PieceType type : PieceType.values() ) {
			if( !type.isSource() ) {
				sPiecePrototypes[ type.ordinal() ] = PieceFactory.buildPiece( type );
			}
		}
	}

	private int findMaxPipeLength(Stracetate stracetate, Position position) {
		int maxLength = 0;
		for( Piece piece : sPiecePrototypes ) {
			PipeFollower pipe = followPipe(stracetate, piece, position);
			if( pipe.isEndOpen() ) {
				return Integer.MAX_VALUE;
			}
			if( pipe.length() > maxLength ) {
				maxLength = pipe.length();
			}
		}
		return maxLength;
	}

	private boolean isNoPoint( Stracetate stracetate, Piece piece, Position position ) {
		return followPipe(stracetate, piece, position).length() == findMaxPipeLength(stracetate, position);
	}

	////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
	public void setGame( GamePlay game, long seed ) {
		mGame = game;
	}

	public boolean performMove() {
		PipeFollower pipe = PipeFollower.follow( mGame );
		if( !pipe.isEndOpen() ) {
			return false;
		}
		Stracetate stracetate = new SubstrateWrapper(mGame.substrate());
		if( isNoPoint( stracetate, mGame.peek()[0], pipe.outPosition() ) ) {
			return mGame.placeNext( pipe.outPosition() );
		}

		mBestLength = 0;
		mBest = null;
		tryPlaces(stracetate, buildPeeks(), null, pipe.outPosition());

		return mGame.placeNext( mBest != null ? mBest : discard( stracetate ) );
	}

	public Player player() {
		return Player.BOB;
	}
}

