/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;
import java.util.List;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Obj;
import functional.Symbol;
import functional.type.Type;

public class LookupGene implements Gene, Serializable {
	public class LookupException extends RuntimeException {
		private static final long serialVersionUID = -7535861336578339187L;

		public LookupException( String message ) {
			super( message );
		}
	}

	private static final long serialVersionUID = -4519472702016212638L;
	private String mSymbolName;
	private long mSeed;
	private Type mType;

	public LookupGene(Type type, String symbolName, long seed) {
		mType = type;
		mSymbolName = symbolName;
		mSeed = seed;
	}

	public Obj express(Context context) {
		List<Symbol> matching = context.findMatching(mType);
		Symbol result = findSymbol( matching, mSymbolName, mType );
		if( result != null ) {
			return result;
		}
		if( !matching.isEmpty() ) {
			result = matching.get( (int) (Math.abs(mSeed) % matching.size()) );
			mSymbolName = result.name();
			return result;
		}
		throw new LookupException("Lookup type mismatch");
	}

	private Symbol findSymbol(List<Symbol> symbolTypes, String symbolName, Type type) {
		for( Symbol s : symbolTypes ) {
			if( s.name().equals(symbolName) ) {
				return s;
			}
		}
		return null;
	}

	public Type type() {
		return mType;
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		if( mutation.mutateSeed(random) ) {
			return new LookupGene(mType, "", random.nextLong());
		} else {
			return this;
		}
	}

	public Gene copy() {
		return new LookupGene( mType, mSymbolName, mSeed );
	}
}
