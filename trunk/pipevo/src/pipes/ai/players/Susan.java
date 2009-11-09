/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai.players;

import pipes.ai.BorderDiscarder;
import pipes.ai.Discarder;
import pipes.ai.PipeFollower;
import pipes.root.GamePlay;
import pipes.root.Piece;
import pipes.root.Position;
import pipes.root.Side;
import pipes.root.Substrate;

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
