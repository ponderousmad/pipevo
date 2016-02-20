package pipes.ai.players;

import pipes.ai.BorderDiscarder;
import pipes.ai.RandomDiscarder;
import pipes.ai.FarDiscarder;
import pipes.ai.Discarder;
import pipes.ai.PipeFollower;
import pipes.ai.Stracetate;
import pipes.ai.SubstrateWrapper;
import pipes.root.GamePlay;
import pipes.root.Piece;
import pipes.root.PieceFactory;
import pipes.root.PieceType;
import pipes.root.Position;
import pipes.root.Side;
import pipes.root.Substrate;

public enum Player {
	//The number in brackets is the version number of each AI
	HUMAN (1),
	BORDER (1),
	RANDOM (1),
	RANDOM_END (1),
	SUSAN (2),
	BOB (8),
	FAR (1);

	public final int version;

	Player (int ver) {
		version = ver;
	}
}

public interface PipeAI {
	public void setGame( GamePlay game, long seed );
	public boolean performMove();
	public Player player();
}

public class BorderAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		game.setInfiniteTimeToFlow();
		mGame = game;
		mDiscarder = new BorderDiscarder( game );
	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	public Player player() {
		return Player.BORDER;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}

public class FarAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		game.setInfiniteTimeToFlow();
		mGame = game;
		mDiscarder = new FarDiscarder( game );

	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	public Player player() {
		return Player.FAR;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}

public class RandomAI implements PipeAI {
	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mDiscarder = new RandomDiscarder( game, seed );
	}

	public boolean performMove() {
		return mGame.placeNext( mDiscarder.discard() );
	}

	private GamePlay mGame;
	private Discarder mDiscarder;

	public Player player() {
		return Player.RANDOM;
	}
}

public class RandomEndAI implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mRandom.setGame( game, seed );
	}

	public boolean performMove() {
		PipeFollower pipe = new PipeFollower( mGame );

		if( pipe.follow() ) {
			if( mGame.peek()[0].isPipeAt( pipe.outDirection().opposite() ) ) {
				mGame.placeNext( pipe.outPosition() );
			} else {
				return mRandom.performMove();
			}
			return true;
		}
		return false;
	}

	public Player player() {
		return Player.RANDOM_END;
	}

	GamePlay mGame = null;
	RandomAI mRandom = new RandomAI();
}

public class Susan implements PipeAI {

	public void setGame( GamePlay game, long seed ) {
		mGame = game;
		mDiscarder = new BorderDiscarder( game );
	}

	public boolean performMove() {
		PipeFollower pipe = new PipeFollower( mGame );

		if( pipe.follow() ) {
			Piece nextPiece = mGame.peek()[0];
			if( nextPiece.getFarSide( pipe.outDirection().opposite() ) != null ) {
				Side outDirection = nextPiece.getFarSide( pipe.outDirection().opposite() );
				Position nextOut = pipe.outPosition().to( outDirection );
				if( canPlace( nextOut, outDirection ) ) {
					mGame.placeNext( pipe.outPosition() );
				} else {
					return discard();
				}
			} else {
				return discard();
			}
			return true;
		}
		return false;
	}

	private boolean discard()
	{
		return mGame.placeNext( mDiscarder.discard() );
	}

	private boolean canPlace( Position position, Side direction ) {
		if( !position.valid() ) {
			return false;
		}
		Substrate substrate = mGame.substrate();
		return substrate.isEmpty( position ) ||	canFlowInto( substrate.at( position ), direction );
	}



	private boolean canFlowInto(Piece piece, Side fromDirection ) {
		return piece.isPipeAt( fromDirection.opposite() );
	}

	public Player player() {
		return Player.SUSAN;
	}

	private GamePlay mGame;
	private Discarder mDiscarder;
}

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