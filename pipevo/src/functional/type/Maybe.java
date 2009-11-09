/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.io.Serializable;
import java.util.List;
import java.util.Set;

public class Maybe implements Type, Serializable {
	private static final long serialVersionUID = 3375232221561512097L;
	Type mType;

	public Maybe( Type type ) {
		assert( type != null );
		assert( !(type.equals(BaseType.NULL)) );
		if( type instanceof Maybe ) {
			type = ((Maybe)type).mType;
		}
		mType = type;
	}

	public Type type() {
		return mType;
	}

	public Match match(Type other) {
		if( other instanceof Maybe ) {
			return mType.match( ((Maybe)other).mType );
		}
		if( other.equals( BaseType.NULL ) ) {
			return Match.MATCHED;
		}
		return mType.match(other);
	}

	public boolean equals(Object other) {
		return other instanceof Maybe && mType.equals( ((Maybe)other).mType );
	}

	public int hashCode() {
		return 1024 + mType.hashCode();
	}

	public boolean involves(Parameter parameter) {
		return mType.involves(parameter);
	}

	public boolean isParameterized() {
		return mType.isParameterized();
	}

	public Maybe substitute(List<ParameterMapping> mappings) {
		Type newType = mType.substitute(mappings);
		if( newType == mType ) {
			return this;
		}
		return new Maybe( newType );
	}

	public void findParameters(Set<Parameter> result) {
		mType.findParameters(result);
	}

	public String toString() {
		return "Maybe[" + mType.toString() + "]";
	}
}
