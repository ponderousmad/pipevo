/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.io.Serializable;
import java.util.List;
import java.util.Set;

public class Parameter implements Type, Serializable {
	private static final long serialVersionUID = -5538960852049349267L;

	public Match match(Type other) {
		if( other == this ) {
			return Match.MATCHED;
		}
		return new Match( this, other );
	}

	public boolean involves(Parameter parameter) {
		return this == parameter;
	}

	public boolean isParameterized() {
		return true;
	}

	public Type substitute(List<ParameterMapping> mappings) {
		for( ParameterMapping map : mappings ) {
			if( map.parameter() == this ) {
				return map.type();
			}
		}
		return this;
	}

	public void findParameters(Set<Parameter> result) {
		result.add(this);
	}

	public String toString() {
		return "P[" + this.hashCode() + "]";
	}
}