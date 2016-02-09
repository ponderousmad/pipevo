package pipes.root;

import java.util.LinkedList;
import java.util.Random;

/**
 * Enumerate the sides of pieces/tiles and associated constants.
 */
public enum Side {
	TOP,
	BOTTOM,
	LEFT,
	RIGHT;

	public Side opposite() { return OPPOSITES[ ordinal() ]; }
	public Side clockwise() { return CLOCKWISE[ ordinal() ]; }
	public Side counterClockwise() { return COUNTER_CLOCKWISE[ ordinal() ]; }

	private static final Side[] OPPOSITES = { BOTTOM, TOP, RIGHT, LEFT };
	private static final Side[] CLOCKWISE = { RIGHT, LEFT, TOP, BOTTOM };
	private static final Side[] COUNTER_CLOCKWISE = { LEFT, RIGHT, BOTTOM, TOP };
}

/**
 * Value class to represent the board (substrate) size.
 */
final public class SubstrateSize {
	SubstrateSize( int width, int height ) {
		mWidth = width;
		mHeight = height;
	}

	int width() {
		return mWidth;
	}

	int height() {
		return mHeight;
	}

	private final int mWidth;
	private final int mHeight;
}

/**
 * Keeps track of a position on a given size board.
 */
public class Position {

	/**
	 * Construct a new position and check the coordinates for validity.
	 * @param size The board size.
	 * @param i The zero based horizontal coordinate.
	 * @param j The zero based vertical coordinate.
	 */
	public Position( SubstrateSize size, int i, int j ) {
		mSize = size;
		mI = i >= 0 && i < mSize.width() ? i : INVALID;
		mJ = j >= 0 && j < mSize.height() ? j : INVALID;
	}

	Position( Position other ) {
		if( other != null ) {
			mSize = other.mSize;
			mI = other.mI;
			mJ = other.mJ;
		}
	}

	public int[] coords() {
		assert( valid() );
		return new int[]{ mI, mJ };
	}

	public Position clone() {
		return new Position( this );
	}

	public boolean valid() {
		return mI != INVALID && mJ != INVALID;
	}

	public boolean equals( Position other ) {
		return mI == other.mI && mJ == other.mJ && other.mSize == other.mSize;
	}

	public Position to( Side side ) {
		return clone().moveTo( side );
	}

	/**
	 * Relocate this position to the adjacent position to the specified side.
	 * @param side The direction to move.
	 * @return The new position, which may be invalid if the direction indicated
	 * the edge of the board.
	 */
	public Position moveTo( Side side ) {
		if( !valid() ) {
			return this;
		}
		if( side == null ) {
			mI = mJ = INVALID;
		}
		// If already at left/top, will make invalid: ( 0 - 1 = INVALID )
		if( side == Side.LEFT ) {
			--mI;
		} else if( side == Side.TOP ) {
			--mJ;
		} else if( side == Side.RIGHT ) {
			++mI;
		} else if( side == Side.BOTTOM ) {
			++mJ;
		}
		if( mI >= mSize.width() ) {
			mI = INVALID;
		}
		if( mJ >= mSize.height() ) {
			mJ = INVALID;
		}
		return this;
	}

	/**
	 * Calculate the Manhattan distance between this position and another.
	 */
	public int manhattanDistance(Position other) {
		return ( Math.abs(other.mI - mI) + Math.abs(other.mJ - mJ));
	}

	private static final int INVALID = -1;

	private SubstrateSize mSize;
	int mI = INVALID;
	int mJ = INVALID;
}

/**
 * Enumerate all the types of pieces and provide some mappings to associated constants.
 */
public enum PieceType {
	SIMPLE_HORIZONTAL  ( SingleType.HORIZONTAL ),
	SIMPLE_VERTICAL    ( SingleType.VERTICAL ),
	SIMPLE_TOP_LEFT    ( SingleType.TOP_LEFT ),
	SIMPLE_TOP_RIGHT   ( SingleType.TOP_RIGHT ),
	SIMPLE_BOTTOM_LEFT ( SingleType.BOTTOM_LEFT ),
	SIMPLE_BOTTOM_RIGHT( SingleType.BOTTOM_RIGHT ),
	DUAL_CROSS         ( DualType.CROSS ),
	DUAL_TOP_RIGHT     ( DualType.TOP_LEFT ),
	DUAL_TOP_LEFT      ( DualType.TOP_RIGHT ),
	SOURCE_TOP         ( Side.TOP ),
	SOURCE_BOTTOM      ( Side.BOTTOM ),
	SOURCE_LEFT        ( Side.LEFT ),
	SOURCE_RIGHT       ( Side.RIGHT );

	/**
	 * Enumerate all the single pipe types. (two straights and four bends).
	 */
	public enum SingleType {
		HORIZONTAL  ( Side.LEFT,   Side.RIGHT ),
		VERTICAL    ( Side.TOP,    Side.BOTTOM ),
		TOP_LEFT    ( Side.TOP,    Side.LEFT ),
		TOP_RIGHT   ( Side.TOP,    Side.RIGHT ),
		BOTTOM_LEFT ( Side.BOTTOM, Side.LEFT ),
		BOTTOM_RIGHT( Side.BOTTOM, Side.RIGHT );

		SingleType( Side start, Side end ) {
			mStart = start;
			mEnd = end;
		}

		/**
		 * Gets the side of the tile where the pipe 'starts'.
		 */
		Side start() { return mStart; }

		/**
		 * Gets the side of the tile where the pipe 'ends'.
		 */
		Side end() { return mEnd; }

		/**
		 * Gets the piece type associated a single pipe type.
		 */
		PieceType type() {
			switch( this ) {
				case HORIZONTAL:   return SIMPLE_HORIZONTAL;
				case VERTICAL:     return SIMPLE_VERTICAL;
				case TOP_LEFT:     return SIMPLE_TOP_LEFT;
				case TOP_RIGHT:    return SIMPLE_TOP_RIGHT;
				case BOTTOM_LEFT:  return SIMPLE_BOTTOM_LEFT;
				case BOTTOM_RIGHT: return SIMPLE_BOTTOM_RIGHT;
			}
			throw new RuntimeException("Null type");
		}

		private Side mStart, mEnd;
	}

	/**
	 * Enumerate all the 2 pipe pieces. (The cross and two double bends).
	 */
	public enum DualType {
		CROSS    ( SingleType.HORIZONTAL, SingleType.VERTICAL ),
		TOP_LEFT ( SingleType.TOP_LEFT,   SingleType.BOTTOM_RIGHT ),
		TOP_RIGHT( SingleType.TOP_RIGHT,  SingleType.BOTTOM_LEFT );

		DualType( SingleType first, SingleType second ) {
			mFirst = first;
			mSecond = second;
		}

		/**
		 * Gets one of the two single pipe types making up this dual.
		 */
		public SingleType first() {
			return mFirst;
		}

		/**
		 * Gets the other of the two single pipe types making up this dual.
		 */

		public SingleType second() {
			return mSecond;
		}

		/**
		 * Gets the piece type associated with the dual type.
		 */
		PieceType type() {
			switch( this ) {
				case CROSS:      return DUAL_CROSS;
				case TOP_LEFT:   return DUAL_TOP_LEFT;
				case TOP_RIGHT:  return DUAL_TOP_RIGHT;
			}
			throw new RuntimeException("Null type");
		}

		private SingleType mFirst, mSecond;
	}

	PieceType( SingleType type ) {
		mSingle = type;
	}
	PieceType( DualType type ) {
		mDual = type;
	}
	PieceType( Side sourceDirection ) {
		mSourceDirection = sourceDirection;
	}

	/**
	 * Gets the number of piece types that are not sources.
	 */
	public static int nonSourceCount() {
		return SingleType.values().length + DualType.values().length;
	}

	/**
	 * Does the piece consist of a single piece of pipe?
	 */
	public boolean isSingle() {
		return mSingle != null;
	}

	/**
	 * Gets the single type associated this piece.
	 * @return The single type, or null if the piece is not a single.
	 */
	public SingleType singleType() {
		return mSingle;
	}

	/**
	 * Does the piece consist of two pipe pieces?
	 */
	public boolean isDual() {
		return mDual != null;
	}

	/**
	 * Gets the dual type associated with this piece.
	 * @return The dual type, or null if the piece is not a dual.
	 */
	public DualType dualType() {
		return mDual;
	}

	/**
	 * Is this a source pipe?
	 */
	public boolean isSource() {
		return mSourceDirection != null;
	}

	/**
	 * Gets the source direction associated with this piece.
	 * @return The source direction, or null if the piece is not a source.
	 */
	public Side sourceDirection() {
		return mSourceDirection;
	}

	private Side mSourceDirection = null;
	private SingleType mSingle = null;
	private DualType mDual = null;
}

/**
 * Defines the properties of game pieces.
 */
public interface Piece {

	/**
	 * Get the side you would emerge from if you entered the piece of
	 * pipe at the specified side.
	 * @param side The side to enter.
	 * @return The side to leave, or null if the piece cannot be
	 * entered from this side.
	 */
	Side getFarSide( Side side );

	/**
	 * Is there pipe attached to the specified side?
	 */
	boolean isPipeAt( Side side );

	/**
	 * Fill the piece from the specified side.
	 * @param side The side to fill from.
	 * @return Returns true if the piece was successfully filled from this side.
	 */
	boolean fill(Side side);

	/**
	 * Check if the pipe at the specified side is full.
	 * @param side The side to check.
	 * @return True if there is a pipe at the side and it contains fluid.
	 */
	boolean isFull(Side side);

	/**
	 * Present the piece information to the visitor.
	 */
	void accept( PieceVisitor viewer );

	/**
	 * Gets the type of this piece.
	 */
	PieceType type();
}


/**
 * Keeps track of a piece of pipe with only a single straight or bent section.
 */
public class SimplePiece implements Piece {
	public SimplePiece( PieceType.SingleType type ) {
		assert( type != null );
		mType = type;
	}

	public Side getFarSide( Side side ) {
		if( mType.start() == side ) {
			return mType.end();
		} else if( mType.end() == side ) {
			return mType.start();
		} else {
			return null;
		}
	}

	public boolean isPipeAt( Side side ) {
		if( side == mType.start() || side == mType.end() ) {
			return true;
		}
		return false;
	}

	public boolean fill(Side side) {
		if( side == mType.start() || side == mType.end() ) {
			mFull = true;
			return true;
		}
		return false;
	}

	public boolean isFull(Side side) {
		if( side == null || side == mType.start() || side == mType.end() ) {
			return mFull;
		}
		return false;
	}

	public void accept(PieceVisitor viewer) {
		viewer.visitSimple( mType, mFull );
	}

	public PieceType type() {
		return mType.type();
	}

	private PieceType.SingleType mType;
	private boolean mFull = false;
}

/**
 * Keeps track of a piece with two bits of pipe.
 */
public class DualPiece implements Piece {

	DualPiece( PieceType.DualType type ) {
		assert( type != null );
		mFirstPiece = new SimplePiece( type.first() );
		mSecondPiece = new SimplePiece( type.second() );
	}

	public Side getFarSide(Side side) {
		Side firstSide = mFirstPiece.getFarSide( side );
		Side secondSide = mSecondPiece.getFarSide( side );
		assert( firstSide == null || secondSide == null );
		if( firstSide != null ) {
			return firstSide;
		} else {
			return secondSide;
		}
	}

	public boolean isPipeAt(Side side) {
		return mFirstPiece.isPipeAt( side ) || mSecondPiece.isPipeAt( side );
	}

	public boolean fill(Side side) {
		// Short circuit is ok since we can only fill one side
		return mFirstPiece.fill( side ) || mSecondPiece.fill( side );
	}

	public boolean isFull(Side side) {
		return mFirstPiece.isFull(side) || mSecondPiece.isFull(side);
	}

	public void accept(PieceVisitor viewer) {
		mFirstPiece.accept( viewer );
		mSecondPiece.accept( viewer );
	}

	public PieceType type() {
		if( mFirstPiece.type() == PieceType.DualType.CROSS.first().type() ) {
			return PieceType.DUAL_CROSS;
		} else if( mFirstPiece.type() == PieceType.DualType.TOP_LEFT.first().type() ) {
			return PieceType.DUAL_TOP_LEFT;
		} else if( mFirstPiece.type() == PieceType.DualType.TOP_RIGHT.first().type() ) {
			return PieceType.DUAL_TOP_RIGHT;
		}
		throw new RuntimeException( "Dual has invalid type" );
	}

	private SimplePiece mFirstPiece;
	private SimplePiece mSecondPiece;
}

public class SourcePiece implements Piece {
	public SourcePiece(Side outSide) {
		mOutSide = outSide;
		mFull = false;
	}

	public Side getFarSide(Side side) {
		return null;
	}

	public boolean isPipeAt(Side side) {
		if( side == mOutSide ) {
			return true;
		}
		return false;
	}

	public boolean fill(Side side) {
		if( side == null ) {
			mFull = true;
			return true;
		}
		return false;
	}

	public boolean isFull(Side side) {
		return mFull;
	}

	public Piece copyPrototype() {
		return null;
	}

	public PieceType type() {
		switch( mOutSide ) {
		case TOP:
			return PieceType.SOURCE_TOP;
		case BOTTOM:
			return PieceType.SOURCE_BOTTOM;
		case LEFT:
			return PieceType.SOURCE_LEFT;
		case RIGHT:
			return PieceType.SOURCE_RIGHT;
		}
		throw new RuntimeException( "Source has invalid type" );
	}

	public void accept(PieceVisitor viewer) {
		viewer.visitSource(mOutSide, mFull);
	}

	private Side mOutSide;
	private boolean mFull;
}

/**
 * Keeps track of the pieces on the game board.
 */
public class Substrate {
	/**
	 * Construct with the specified size in tiles.
	 */
	public Substrate( SubstrateSize size ) {
		mSize = size;
		mPieces = new Piece[ mSize.width() ][ mSize.height() ];
	}

	/**
	 * Enumerates the corners of the board.
	 */
	public enum Corner { TOP_LEFT, TOP_RIGHT, BOTTOM_LEFT, BOTTOM_RIGHT };

	/**
	 * Get the position at the specified corner.
	 */
	public Position corner( Corner c ) {
		switch( c ) {
		case TOP_LEFT:
			return new Position( mSize, 0, 0 );
		case TOP_RIGHT:
			return new Position( mSize, mSize.width() - 1, 0 );
		case BOTTOM_LEFT:
			return new Position( mSize, 0, mSize.height() - 1 );
		case BOTTOM_RIGHT:
			return new Position( mSize, mSize.width() - 1, mSize.height() - 1 );
		}
		return null;
	}

	/**
	 * Check if there is a piece at the specified position.
	 */
	public boolean isEmpty( Position position ) {
		return at( position ) == null;
	}

	/**
	 * If the position is empty, place specified piece at that position.
	 */
	void placePiece( Position position, Piece piece ) {
		if( isEmpty(position) ) {
			++mPieceCount;
			mPieces[position.mI][position.mJ] = piece;
		}
	}

	/**
	 * Gets the piece at the specified position.
	 * @return The piece at that location, or null if there is none.
	 */
	public Piece at( Position position ) {
		if( position.valid() ) {
			return mPieces[ position.mI ][ position.mJ ];
		}
		return null;
	}

	/**
	 * Gets the number of tiles with no pieces.
	 */
	public int empties() {
		return ( mSize.width() * mSize.height() ) - mPieceCount;
	}

	/**
	 * Gets the size of the board.
	 */
	public SubstrateSize size() {
		return mSize;
	}

	private SubstrateSize mSize;
	private	final Piece[][] mPieces;
	private int mPieceCount = 0;
}

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

/**
 * Allows for visior style display of the pieces in a container.
 * The container (for example the substrate or the queue), passes the viewer
 * to each piece, which in turn calls the visitor back for each bit of pipe or
 * source in the piece.
 */
public interface PieceVisitor {
	void visitSimple( PieceType.SingleType type, boolean isFull );
	void visitSource( Side side, boolean isFull );
}

/**
 * Construct pieces of a given type or random pieces.
 */
public class PieceFactory {

	/**
	 * Contruct any of the non source pieces at random.
	 * @param random The source of entropy.
	 */
	public static Piece randomPiece( Random random ) {
		PieceType[] types = PieceType.values();
		return buildPiece( types[ random.nextInt( PieceType.nonSourceCount() ) ] );
	}

	/**
	 * Construct a new piece of the specified type.
	 */
	public static Piece buildPiece( PieceType type ) {
		switch( type ) {
			case SIMPLE_HORIZONTAL: return new SimplePiece( PieceType.SingleType.HORIZONTAL );
			case SIMPLE_VERTICAL: return new SimplePiece( PieceType.SingleType.VERTICAL );
			case SIMPLE_TOP_LEFT: return new SimplePiece( PieceType.SingleType.TOP_LEFT );
			case SIMPLE_TOP_RIGHT: return new SimplePiece( PieceType.SingleType.TOP_RIGHT );
			case SIMPLE_BOTTOM_LEFT: return new SimplePiece( PieceType.SingleType.BOTTOM_LEFT );
			case SIMPLE_BOTTOM_RIGHT: return new SimplePiece( PieceType.SingleType.BOTTOM_RIGHT );
			case DUAL_CROSS: return new DualPiece( PieceType.DualType.CROSS );
			case DUAL_TOP_RIGHT: return new DualPiece( PieceType.DualType.TOP_RIGHT );
			case DUAL_TOP_LEFT: return new DualPiece( PieceType.DualType.TOP_LEFT );
			case SOURCE_TOP: return new SourcePiece( Side.TOP );
			case SOURCE_BOTTOM: return new SourcePiece( Side.BOTTOM );
			case SOURCE_LEFT: return new SourcePiece( Side.LEFT );
			case SOURCE_RIGHT: return new SourcePiece( Side.RIGHT );
		}
		return null;
	}
}

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
