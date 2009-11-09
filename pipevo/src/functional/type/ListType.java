/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.io.Serializable;
import java.util.List;
import java.util.Set;

public class ListType implements Type, Serializable {
	private static final long serialVersionUID = -4195417514494815280L;
	Type mElement;

	public ListType( Type elementType ) {
		mElement = elementType;
	}

	public Type elementType() {
		return mElement;
	}

	public Match match( Type other ) {
		if( other instanceof ListType ) {
			return mElement.match( ((ListType)other).mElement );
		}
		return Match.NO_MATCH;
	}

	public boolean equals( Object other ) {
		return other instanceof ListType && mElement.equals( ((ListType)other).mElement );
	}

	public int hashCode() {
		return 262144 + mElement.hashCode();
	}

	public boolean involves(Parameter parameter) {
		return mElement.involves(parameter);
	}

	public boolean isParameterized() {
		return mElement.isParameterized();
	}

	public ListType substitute(List<ParameterMapping> mappings) {
		Type newElement = mElement.substitute(mappings);
		if( newElement == mElement ) {
			return this;
		}
		return new ListType( newElement );
	}

	public void findParameters(Set<Parameter> result) {
		mElement.findParameters(result);
	}

	public String toString() {
		return "List[" + mElement.toString() + "]";
	}
}
