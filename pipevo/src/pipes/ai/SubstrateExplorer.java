/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import pipes.root.GamePlay;
import pipes.root.Position;
import pipes.root.Substrate.Corner;

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
