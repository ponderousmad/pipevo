/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import java.io.Serializable;
import java.util.List;
import java.util.Set;

public class FunctionType implements Type, Serializable {
	private static final long serialVersionUID = 4143055832998725038L;
	Type mReturn;
	Type[] mArguments;

	public FunctionType( Type retType, Type[] argTypes ) {
		set( retType, argTypes );
	}

	private void set(Type retType, Type[] argTypes) {
		assert( retType != null );
		assert( argTypes != null );
		mReturn = retType;
		mArguments = argTypes;
	}

	public Type returnType() {
		return mReturn;
	}

	public Type[] argumentTypes() {
		return mArguments;
	}

	public Match match( Type other ) {
		if( other instanceof FunctionType ) {
			FunctionType otherType = (FunctionType)other;
			if( otherType.mArguments.length != mArguments.length ) {
				return Match.NO_MATCH;
			}
			Match result = mReturn.match( otherType.mReturn );
			if( !result.matches() ) {
				return Match.NO_MATCH;
			}
			return result.combine( matchArguments( otherType ) );
		}
		return Match.NO_MATCH;
	}

	public boolean equals( Object other ) {
		if( other instanceof FunctionType ) {
			FunctionType otherType = (FunctionType)other;
			return mArguments.length == otherType.mArguments.length
				&& mReturn.equals( otherType.mReturn )
				&& sameArguments( otherType );
		}
		return false;
	}

	public int hashCode() {
		int code = 32768 + mReturn.hashCode();
		for( Type arg : mArguments ) {
			code += arg.hashCode();
		}
		return code;
	}

	private boolean sameArguments(FunctionType other) {
		assert( mArguments.length == other.mArguments.length );
		for( int i = 0; i < mArguments.length; ++i ) {
			if( !mArguments[i].equals( other.mArguments[i]) ) {
				return false;
			}
		}
		return true;
	}

	private Match matchArguments(FunctionType other) {
		assert( mArguments.length == other.mArguments.length );
		Match result = Match.MATCHED;
		for( int i = 0; i < mArguments.length; ++i ) {
			result = result.combine( mArguments[i].match(other.mArguments[i]) );
			if( !result.matches() ) {
				break;
			}
		}
		return result;
	}

	public boolean involves(Parameter parameter) {
		if( mReturn.involves(parameter) ) {
			return true;
		}
		for( Type arg : mArguments ) {
			if( arg.involves(parameter) ) {
				return true;
			}
		}
		return false;
	}

	public boolean isParameterized() {
		if( mReturn.isParameterized() ) {
			return true;
		}
		for( Type arg : mArguments ) {
			if( arg.isParameterized() ) {
				return true;
			}
		}
		return false;
	}

	public FunctionType substitute(List<ParameterMapping> mappings) {
		Type newReturn = mReturn.substitute(mappings);
		Type[] arguments = new Type[ mArguments.length ];
		boolean useNew = false;
		for( int i = 0; i < mArguments.length; ++i ) {
			arguments[i] = mArguments[i].substitute(mappings);
			if( !useNew && arguments[i] != mArguments[i] ) {
				useNew = true;
			}
		}
		if( newReturn == mReturn && !useNew ) {
			return this;
		}
		return new FunctionType( newReturn, arguments );
	}

	public void findParameters(Set<Parameter> result) {
		mReturn.findParameters(result);
		for( Type arg : mArguments ) {
			arg.findParameters(result);
		}
	}

	public String toString() {
		return "F[" + argumentsString() + "]->[" + mReturn.toString() + "]";
	}

	private String argumentsString() {
		StringBuilder builder = new StringBuilder();
		boolean comma = false;
		for( Type arg : mArguments ) {
			if( comma ) {
				builder.append(", ");
			}
			comma = true;
			builder.append(arg.toString());
		}
		return builder.toString();
	}
}
