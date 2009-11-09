/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

public class ParameterUtils {
	public static Set<Parameter> findParameters(Type type) {
		Set<Parameter> result = new HashSet<Parameter>();
		type.findParameters(result);
		return result;
	}

	public static Type uniqueParameters(Type type) {
		Set<Parameter> parameters = findParameters(type);
		if( parameters.isEmpty() ) {
			return type;
		}
		List<ParameterMapping> mappings = new java.util.ArrayList<ParameterMapping>();
		for( Parameter p : parameters ) {
			mappings.add(new ParameterMapping(p, new Parameter()));
		}
		return type.substitute(mappings);
	}
}
