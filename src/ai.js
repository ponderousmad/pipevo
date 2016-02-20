package pipes.ai;

import pipes.root.Piece;
import pipes.root.Position;
import pipes.root.Side;
import pipes.root.Substrate;
import pipes.root.GamePlay;
import pipes.root.Substrate.Corner;

public interface Stracetate {
	public Piece at( Position position );
	public boolean isEmpty( Position position );
	public int empties();
}

public class SubstrateWrapper implements Stracetate {
	public SubstrateWrapper( Substrate substrate ) {
		mSubstrate = substrate;
	}

	public Piece at(Position position) {
		return mSubstrate.at( position );
	}

	private Substrate mSubstrate;

	public boolean isEmpty( Position position )	{
		return mSubstrate.isEmpty( position );
	}

	public int empties() {
		return mSubstrate.empties();
	}
}

public class Acetate implements Stracetate {
	private Stracetate mStracetate;
	private Piece mPiece;
	private Position mPosition;

	public Acetate( Stracetate stracetate, Piece piece, Position position ) {
		mStracetate = stracetate;
		mPiece = piece;
		mPosition = position;
	}

	public Piece at( Position position ) {
		if( !position.valid() ) {
			return null;
		}
		if( position.equals( mPosition ) ) {
			return mPiece;
		}
		return mStracetate.at( position );
	}

	public boolean isEmpty( Position position ) {
		return at( position ) == null;
	}

	public int empties() {
		return mStracetate.empties() - (isEmpty( mPosition ) ? 1 : 0);
	}
}

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

public class SubstrateExplorer {

	Position findEmptyPosFarFromOutput() {
		Position output = mPipeFollower.outPosition();
		int farDistance = -1;
		Position farPosition=null;

		for (int i=0; i<mGame.width(); i++) {
			for (int j=0; j<mGame.height(); j++) {
				Position thisPosition = mGame.position( i, j );
				if ( mStracetate.at(thisPosition) == null ) {
					int thisDistance = output.manhattanDistance(thisPosition);
					if (thisDistance > farDistance) {
						farPosition = thisPosition;
						farDistance = thisDistance;
					}
				}
			}
		}

		return farPosition;
	}

	Position findFarCorner(Position here) {
		int farDistance = -1;
		Position farCorner = null;

		for ( Corner c : Corner.values() ) {
			Position thisCorner = mGame.substrate().corner(c);
			int thisDistance = here.manhattanDistance(thisCorner);
			if (thisDistance >  farDistance) {
				farCorner = thisCorner;
				farDistance = thisDistance;
			}
		}

		return farCorner;
	}

	static SubstrateExplorer buildExplorer( GamePlay game, Stracetate stracetate ) {
		PipeFollower follower = PipeFollower.follow( game, stracetate );
		if( follower == null ) {
			return null;
		}

		return new SubstrateExplorer( follower, game, stracetate );
	}

	SubstrateExplorer( PipeFollower follower, GamePlay game, Stracetate stracetate  ) {
		mStracetate = stracetate;
		mPipeFollower = follower;
		mGame = game;
	}
    
	PipeFollower mPipeFollower;
	Stracetate mStracetate;
	GamePlay mGame;
}

public interface Discarder {
	public Position discard();
}

public class RandomDiscarder implements Discarder {
	public RandomDiscarder( GamePlay game, long seed ) {
		mGame = game;
		mStracetate = new SubstrateWrapper( game.substrate() );
		mRandom = new Random( seed );
	}

	public Position discard() {
		if( mStracetate.empties() == 0 ) {
			return null;
		}

		for(;;) {
			Position position = mGame.position(
				mRandom.nextInt( mGame.width() ),
				mRandom.nextInt( mGame.height() )
			);
			if( mStracetate.isEmpty( position ) ) {
				return position;
			}
		}
	}

	private GamePlay mGame;
	private Stracetate mStracetate;
	private Random mRandom;
}

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

public class FarDiscarder implements Discarder {
	public FarDiscarder( GamePlay game ) {
		mGame = game;
		mStracetate = new SubstrateWrapper( mGame.substrate() );
	}

	public FarDiscarder( GamePlay game, Stracetate stracetate ) {
		mGame = game;
		mStracetate = stracetate;
	}

	public Position discard() {
		SubstrateExplorer explorer = SubstrateExplorer.buildExplorer( mGame, mStracetate );
		assert( explorer != null );

		return explorer.findEmptyPosFarFromOutput();
	}

	private GamePlay mGame;
	private Stracetate mStracetate;
}
