/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.io.Serializable;
import java.util.List;
import java.util.Set;

public class ConsType implements Type, Serializable {
	private static final long serialVersionUID = -7906385904240937058L;
	private Type mCar;
	private Type mCdr;

	public ConsType( Type carType, Type cdrType ) {
		mCar = carType;
		mCdr = cdrType;
	}

	public Type carType() {
		return mCar;
	}

	public Type cdrType() {
		return mCdr;
	}

	public boolean equals( Object other ) {
		if( other instanceof ConsType ) {
			ConsType cons = (ConsType)other;
			return mCar.equals( cons.mCar ) && mCdr.equals( cons.mCdr );
		}
		return false;
	}

	public int hashCode() {
		return 4096 + mCar.hashCode() + mCdr.hashCode();
	}

	public Match match(Type other) {
		if( other instanceof ConsType ) {
			ConsType cons = (ConsType)other;
			Match match = mCar.match( cons.mCar );
			if( !match.matches() ) {
				return match;
			}
			Match cdrMatch = mCdr.match( cons.mCdr );
			if( !cdrMatch.matches() ) {
				return cdrMatch;
			}
			return match.combine( cdrMatch );
		}
		return Match.NO_MATCH;
	}

	public boolean involves(Parameter parameter) {
		return mCar.involves(parameter) || mCdr.involves(parameter);
	}

	public boolean isParameterized() {
		return mCar.isParameterized() || mCdr.isParameterized();
	}

	public ConsType substitute(List<ParameterMapping> mappings) {
		Type newCar = mCar.substitute(mappings);
		Type newCdr = mCdr.substitute(mappings);
		if( newCar == mCar && newCdr == mCdr ) {
			return this;
		}
		return new ConsType( newCar, newCdr );
	}

	public void findParameters(Set<Parameter> result) {
		mCar.findParameters(result);
		mCdr.findParameters(result);
	}

	public String toString() {
		return "Cons[" + mCar.toString() + ", " + mCdr.toString() + "]";
	}
}
