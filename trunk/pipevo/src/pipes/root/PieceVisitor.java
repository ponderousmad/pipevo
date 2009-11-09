/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.root;

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
