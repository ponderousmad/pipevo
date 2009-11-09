/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.functional;

import pipes.ai.PipeFollower;
import functional.BaseObj;

public class Pipe extends BaseObj {
	public Pipe( PipeFollower follower ) {
		mFollower = follower;
	}

	public PipeFollower value() {
		return mFollower;
	}

	private PipeFollower mFollower;

}
