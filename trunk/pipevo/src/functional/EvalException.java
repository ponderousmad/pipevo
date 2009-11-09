/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional;

import java.util.List;

public class EvalException extends RuntimeException {
	private static final long serialVersionUID = 4855022780860455202L;
	private Environment mEnv;

	public EvalException( String message, Environment env ) {
		super( message );
		mEnv = env;
	}

	public String context() {
		List<String> c = mEnv.context();
		StringBuffer description = new StringBuffer();
		if( c.size() > 0 ) {
			description.append( "In functions " );
			boolean first = true;
			for( String s : c ) {
				if( !first ) {
					description.append( ", " );
				} else {
					first = false;
				}
				description.append( s );

			}
			description.append( ":\n" );
		}
		return description.toString();
	}
}
