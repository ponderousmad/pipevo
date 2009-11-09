/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

public class CompareTypes {
	public static boolean equalModuloParameters( Type first, Type second ) {
		if( first.isParameterized() && second.isParameterized() ) {
			Match match = first.match(second);
			if( !match.matches() ) {
				return false;
			}
			for( ParameterMapping mapping : match.mappings() ) {
				if( !(mapping.type() instanceof Parameter) ) {
					return false;
				}
			}
			first = first.substitute(match.mappings());
		}
		return first.equals(second);
	}
}
