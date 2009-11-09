/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.io.Serializable;
import java.util.List;
import java.util.Set;

import functional.FixNum;
import functional.Null;
import functional.Real;
import functional.StringObj;
import functional.Symbol;
import functional.True;

public class BaseType implements Type, Serializable {
	private static final long serialVersionUID = 9078691212359745187L;

	private String mType;

	public static final BaseType FIXNUM = new BaseType( FixNum.class );
	public static final BaseType REAL = new BaseType( Real.class );
	public static final BaseType SYMBOL = new BaseType( Symbol.class );
	public static final BaseType STRING = new BaseType( StringObj.class );
	public static final BaseType TRUE = new BaseType( True.class );
	public static final BaseType NULL = new BaseType( Null.class );
	public static final Type     BOOL = new Maybe( TRUE );

	public static final Type[] values = new Type[] { FIXNUM, REAL, SYMBOL, STRING, TRUE, NULL, BOOL	};

	public BaseType( Class<?> type ) {
		assert( type != null );
		mType = type.getCanonicalName();
	}

	public Match match( Type other ) {
		if( other instanceof BaseType ) {
			return Match.result( mType.equals( ((BaseType)other).mType ) );
		}
		return Match.NO_MATCH;
	}

	public boolean equals(Object other) {
		return other instanceof BaseType && ((BaseType)other).mType.equals( mType );
	}

	public int hashCode() {
		return mType.hashCode() % 1024;
	}

	public boolean involves(Parameter parameter) {
		return false;
	}

	public boolean isParameterized() {
		return false;
	}

	public BaseType substitute(List<ParameterMapping> mappings) {
		return this;
	}

	public void findParameters(Set<Parameter> result) {
	}

	public String toString() {
		return mType;
	}
}
