/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.util.ArrayList;
import java.util.List;

public class ParameterMapping {
	private Parameter mParameter;
	private Type mType;

	ParameterMapping( Parameter parameter, Type type ) {
		assert( parameter != null );
		assert( type != null );

		mParameter = parameter;
		mType = type;
	}

	public Parameter parameter() {
		return mParameter;
	}

	Type type() {
		return mType;
	}

	boolean substitute( ParameterMapping other ) {
		if( other.mType.involves(mParameter) ) {
			return false;
		}
		List<ParameterMapping> mappings = new ArrayList<ParameterMapping>();
		mappings.add( other );
		mType = mType.substitute(mappings);
		return true;
	}

	boolean equals( ParameterMapping other ) {
		if( mParameter == other.parameter() && mType.equals(other.type())) {
			return true;
		}
		return false;
	}
}
