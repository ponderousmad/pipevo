/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.ArrayList;
import java.util.List;

import functional.Symbol;
import functional.type.FunctionType;
import functional.type.Match;
import functional.type.Type;

public class ObjectRegistry {
	List<TypedSymbol> mRegistry = new ArrayList<TypedSymbol>();

	public void add( Symbol symbol, Type type ) {
		mRegistry.add( new TypedSymbol( symbol, type ) );
	}

	// Class to remined clients that a function requires a type whose parameters are guarenteed to be unique.
	public static class UniqueParameterPromise {}
	public static UniqueParameterPromise PromiseUniqueParameter = new UniqueParameterPromise();

	public List<Symbol> findMatching( Type type, UniqueParameterPromise promise ) {
		List<Symbol> matching = new ArrayList<Symbol>();
		for( TypedSymbol tSym : mRegistry ) {
			if( type.match(tSym.type ).matches() ) {
				matching.add( tSym.symbol );
			}
		}
		return matching;
	}

	public static class TypedSymbol {
		TypedSymbol( Symbol sym, Type itsType ) {
			symbol = sym;
			type = itsType;
		}
		Symbol symbol;
		Type type;
	}

	public List<TypedSymbol> findFunctionTypeReturning(Type returnType, UniqueParameterPromise promise ) {
		List<TypedSymbol> matching = new ArrayList<TypedSymbol>();
		for(TypedSymbol tSym : mRegistry) {
			if(tSym.type instanceof FunctionType) {
				FunctionType funcType = ((FunctionType)tSym.type);
				Match match = returnType.match( funcType.returnType() );
				if(match.matches()) {
					matching.add( new TypedSymbol( tSym.symbol, funcType.substitute( match.mappings() ) ) );
				}
			}
		}
		return matching;
	}
}
