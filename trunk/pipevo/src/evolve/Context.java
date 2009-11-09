/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.ArrayList;
import java.util.List;

import evolve.ObjectRegistry.TypedSymbol;
import functional.Symbol;
import functional.type.FunctionType;
import functional.type.Match;
import functional.type.ParameterUtils;
import functional.type.Type;

public class Context {
	private ObjectRegistry mRegistry;
	private List<Chromasome> mChromasomes = new ArrayList<Chromasome>();

	private static class SymbolEntry {
		SymbolEntry( String name, Type type ) {
			mSymbol = new Symbol( name );
			mType = type;
		}
		public Symbol mSymbol;
		public Type mType;
	}

	private ArrayList<SymbolEntry> mSymbolTable = new ArrayList<SymbolEntry>();

	public Context( ObjectRegistry registry ) {
		mRegistry = registry;
	}

	public void addChromasome( Chromasome chromasome ) {
		mChromasomes.add( chromasome );
	}

	public List<Symbol> findMatching(Type type) {
		type = ParameterUtils.uniqueParameters(type);
		List<Symbol> matching = mRegistry.findMatching(type, ObjectRegistry.PromiseUniqueParameter);
		for( Chromasome chromasome : mChromasomes ) {
			for( Chromasome.NamedGene gene : chromasome.genes() ) {
				if( gene.gene.type().match(type).matches() ) {
					matching.add(new Symbol(gene.name));
				}
			}
		}
		for( SymbolEntry entry : mSymbolTable ) {
			if( type.match(entry.mType).matches() ) {
				matching.add(entry.mSymbol);
			}
		}
		return matching;
	}

	public void pushSymbol( String name, Type type )
	{
		mSymbolTable.add(new SymbolEntry(name, type));
	}

	public void popSymbols( final int count ) {
		final int last = mSymbolTable.size() - 1;
		assert( count == 0 || last >= 0 );
		for( int i = last; i > (last - count); --i ) {
			mSymbolTable.remove(i);
		}
	}

	public List<TypedSymbol> findFunctionTypeReturning(Type returnType) {
		returnType = ParameterUtils.uniqueParameters(returnType);
		List<TypedSymbol> matching = mRegistry.findFunctionTypeReturning(returnType, ObjectRegistry.PromiseUniqueParameter);
		for( Chromasome chromasome : mChromasomes ) {
			for( Chromasome.NamedGene gene : chromasome.genes() ) {
				Type type = gene.gene.type();
				if( type instanceof FunctionType ) {
					FunctionType funcType = (FunctionType)type;
					Match match = returnType.match( funcType.returnType() );
					if( match.matches() ) {
						matching.add( new TypedSymbol( new Symbol( gene.name ), funcType.substitute(match.mappings()) ) );
					}
				}
			}
		}
		for( SymbolEntry entry : mSymbolTable ) {
			if( entry.mType instanceof FunctionType ) {
				FunctionType funcType = (FunctionType)entry.mType;
				Match match = returnType.match( funcType.returnType() );
				if( match.matches() ) {
					matching.add( new TypedSymbol( entry.mSymbol, funcType.substitute(match.mappings()) ) );
				}
			}
		}
		return matching;
	}

	public java.util.Set<Type> findConcreteTypes() {
		java.util.Set<Type> result = new java.util.HashSet<Type>();
		for( SymbolEntry entry : mSymbolTable ) {
			TypeBuilder.findConcreteTypes(entry.mType, result);
		}
		return result;
	}
};
