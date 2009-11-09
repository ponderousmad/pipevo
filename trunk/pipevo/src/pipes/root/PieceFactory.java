/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

import java.util.Random;
import pipes.root.PieceType.SingleType;;

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
			case SIMPLE_HORIZONTAL: return new SimplePiece( SingleType.HORIZONTAL );
			case SIMPLE_VERTICAL: return new SimplePiece( SingleType.VERTICAL );
			case SIMPLE_TOP_LEFT: return new SimplePiece( SingleType.TOP_LEFT );
			case SIMPLE_TOP_RIGHT: return new SimplePiece( SingleType.TOP_RIGHT );
			case SIMPLE_BOTTOM_LEFT: return new SimplePiece( SingleType.BOTTOM_LEFT );
			case SIMPLE_BOTTOM_RIGHT: return new SimplePiece( SingleType.BOTTOM_RIGHT );
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
