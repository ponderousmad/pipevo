/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.functional;

import functional.type.BaseType;
import functional.type.ConsType;

public class GameType {
	public static final BaseType GAME = new BaseType( Game.class );
	public static final BaseType PIPE = new BaseType( Pipe.class );
	public static final BaseType PIECE = new BaseType( PieceObj.class );
	public static final BaseType STRACETATE = new BaseType( StracetateObj.class );
	public static final ConsType POSITION = new ConsType( BaseType.FIXNUM, BaseType.FIXNUM );
}
