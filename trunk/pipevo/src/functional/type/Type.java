/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.util.List;
import java.util.Set;

public interface Type {
	public Match match( Type other );
	public boolean involves( Parameter parameter );
	public boolean isParameterized();
	public void findParameters( Set<Parameter> result );
	public Type substitute( List<ParameterMapping> mappings );
}
