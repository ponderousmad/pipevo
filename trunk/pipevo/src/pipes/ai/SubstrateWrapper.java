/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.ai;

import pipes.root.Piece;
import pipes.root.Position;
import pipes.root.Substrate;

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
