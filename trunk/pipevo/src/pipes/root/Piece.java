/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

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
