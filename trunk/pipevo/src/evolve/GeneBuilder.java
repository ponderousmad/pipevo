/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.List;
import java.util.Random;

import util.StringRandom;
import util.WeightedSet;

import evolve.ObjectRegistry.TypedSymbol;
import evolve.genes.ApplicationGene;
import evolve.genes.BoolGenerator;
import evolve.genes.ConsGene;
import evolve.genes.DemaybeGene;
import evolve.genes.FixNumGenerator;
import evolve.genes.FunctionGene;
import evolve.genes.IfGene;
import evolve.genes.ListGene;
import evolve.genes.LookupGene;
import evolve.genes.NullGene;
import evolve.genes.PassMaybeGene;
import evolve.genes.RealGenerator;
import evolve.genes.StringGenerator;
import evolve.genes.SymbolGenerator;
import evolve.genes.TrueGene;
import functional.Symbol;
import functional.type.BaseType;
import functional.type.ConsType;
import functional.type.FunctionType;
import functional.type.ListType;
import functional.type.Maybe;
import functional.type.Parameter;
import functional.type.ParameterUtils;
import functional.type.Type;

public class GeneBuilder {
	public static class GeneBuildException extends RuntimeException {
		public GeneBuildException(String message) {
			super(message);
		}

		private static final long serialVersionUID = -8289351831205023242L;
	}

	private interface Builder
	{
		Gene build(Random random);
	}

	public enum BuildType
	{
		BRANCH,
		APPLICATION,
		LOOKUP,
		CONSTRUCT,
		MAYBE
	}

	private TypeBuilder mTypeBuilder;
	private Context mContext;
	private GeneRandomizer mRandomizer;
	private int mDepthAllowed = 5;

	public GeneBuilder( TypeBuilder typeBuilder, GeneRandomizer randomizer, Context context ) {
		mTypeBuilder = typeBuilder;
		mRandomizer = randomizer;
		mContext = context;
	}

	boolean isConstructable(Type type) {
		return !mTypeBuilder.isConstrained(type);
	}

	public Gene buildItem(final Type geneType, Random random) {
		WeightedSet<Builder> builders = new WeightedSet<Builder>();

		if( canLookup(geneType) ) {
			builders.add(new Builder() {
				public Gene build(Random random) {
					return lookup(geneType, random);
				}},
				mRandomizer.buildTypeWeight(BuildType.LOOKUP)
			);
		}

		if( isConstructable(geneType)) {
			builders.add(new Builder() {
				public Gene build(Random random) {
					return constructItem(geneType, random);
				}},
				mRandomizer.buildTypeWeight(BuildType.CONSTRUCT)
			);
		}

		if( canApply(geneType, mDepthAllowed) ) {
			builders.add(new Builder() {
				public Gene build(Random random) {
					return buildApplication(geneType, random);
				}},
				mRandomizer.buildTypeWeight(BuildType.CONSTRUCT)
			);

			if( geneType instanceof Maybe ) {
				builders.add(new Builder() {
					public Gene build(Random random) {
						return buildPassMaybe((Maybe)geneType, random);
					}},
					mRandomizer.buildTypeWeight(BuildType.MAYBE)
				);
			}
		}

		if( !builders.isEmpty() ) {
			if( mDepthAllowed > 0 ) {
				if( !(geneType instanceof Maybe || geneType.equals(BaseType.NULL)) ) {
					builders.add(new Builder() {
						public Gene build(Random random) {
							return buildDemaybe( geneType, random );
						}},
						mRandomizer.buildTypeWeight(BuildType.MAYBE)
					);
				}
				builders.add(new Builder() {
					public Gene build(Random random) {
						return buildBranch(geneType, random);
					}},
					mRandomizer.buildTypeWeight(BuildType.BRANCH)
				);
			}

			try
			{
				--mDepthAllowed;
				return builders.select(random).build(random);
			}
			finally {
				++mDepthAllowed;
			}
		}
		throw new GeneBuildException("No way to construct gene within allowed depth.");
	}

	private boolean canApply(Type type, int depth) {
		if( depth > 0 ) {
			List<TypedSymbol> matching = mContext.findFunctionTypeReturning(type);
			for(TypedSymbol function : matching) {
				if(canInvoke((FunctionType)function.type, depth)) {
					return true;
				}
			}
		}
		return false;
	}

	private boolean canInvoke(FunctionType type, int depth) {
		for( Type argType : type.argumentTypes()) {
			if(isConstructable(argType)) {
				continue;
			}
			if(canLookup(argType)) {
				continue;
			}
			if(canApply(argType, depth-1)) {
				continue;
			}
		}
		return true;
	}

	private boolean canLookup(Type geneType) {
		return !mContext.findMatching(geneType).isEmpty();
	}

	private Gene buildBranch(Type geneType, Random random) {
		Gene predicate = buildItem( BaseType.BOOL, random );
		Gene thenGene = buildItem( geneType, random );
		Gene elseGene = buildItem( geneType, random );
		return new IfGene(geneType,predicate,thenGene,elseGene);
	}

	private Gene buildDemaybe(Type geneType, Random random) {
		String name = StringRandom.alphaString( random, 3 );
		Gene maybeGene = null;
		// Check if we built a null directly, and if so, reject it.
		do {
			maybeGene = buildItem(new Maybe(geneType), random);
		} while( maybeGene.type().equals( BaseType.NULL ) );
		// If we didn't build a maybe, then just return the gene,
		// rather then forcing the issue.
		if( !(maybeGene.type() instanceof Maybe ) ) {
			return maybeGene;
		}
		Gene concreteGene = buildItem(geneType, random);
		return new DemaybeGene(maybeGene, concreteGene, name);
	}

	private Gene buildPassMaybe(Maybe geneType, Random random) {
		Gene function = buildInvokeable(geneType,random);
		Type argumentTypes[] = ((FunctionType)function.type()).argumentTypes();
		Gene arguments[] = new Gene[argumentTypes.length];
		boolean addedMaybe = false;
		for( int i = 0; i < argumentTypes.length; ++i) {
			Type type = argumentTypes[i];
			if( !(type instanceof Maybe || type.equals(BaseType.NULL)) ) {
				type = new Maybe(type);
				addedMaybe = true;
			}
			arguments[i] = buildItem(type,random);
		}
		if( addedMaybe ) {
			return new PassMaybeGene(geneType, function, arguments, StringRandom.alphaString(random, 3));
		} else {
			return new ApplicationGene(function, arguments);
		}
	}

	private Gene buildApplication(Type geneType, Random random) {
		Gene function = buildInvokeable(geneType, random);
		Type argumentTypes[] = ((FunctionType)function.type()).argumentTypes();
		Gene arguments[] = new Gene[argumentTypes.length];
		for( int i = 0; i < argumentTypes.length; ++i) {
			arguments[i] = buildItem(argumentTypes[i],random);
		}
		return new ApplicationGene( function, arguments );
	}

	private Gene buildInvokeable(Type geneType, Random random) {
		List<TypedSymbol> matching = mContext.findFunctionTypeReturning(geneType);
		assert(!matching.isEmpty());
		TypedSymbol function = matching.get( random.nextInt( matching.size() ) );
		return new LookupGene(ParameterUtils.uniqueParameters(function.type), function.symbol.name(), random.nextLong());
	}

	private Gene lookup(Type geneType, Random random) {
		List<Symbol> matching = mContext.findMatching(geneType);
		if( matching.isEmpty() ) {
			return null;
		}
		Symbol symbol = matching.get( random.nextInt( matching.size() ) );
		return new LookupGene(geneType, symbol.name(), random.nextLong() );
	}

	private Gene constructItem(Type geneType, Random random) {
		while( geneType instanceof Parameter ) {
			geneType = mTypeBuilder.createConstructableType(random);
		}

		if(geneType.equals(BaseType.FIXNUM)) {
			return buildFixNum(random);
		} else if(geneType.equals(BaseType.REAL)) {
			return buildReal(random);
		} else if(geneType.equals(BaseType.BOOL)) {
			return buildBool(random);
		} else if(geneType.equals(BaseType.NULL)) {
			return new NullGene();
		} else if(geneType.equals(BaseType.TRUE)) {
			return new TrueGene();
		} else if(geneType.equals(BaseType.STRING)) {
			return buildString(random);
		} else if(geneType.equals(BaseType.SYMBOL)) {
			return buildSymbol(random);
		} else if(geneType instanceof ConsType) {
			return buildCons((ConsType)geneType,random);
		} else if(geneType instanceof ListType) {
			return buildList(((ListType)geneType),random);
		} else if(geneType instanceof Maybe) {
			return buildMaybe((Maybe)geneType, random);
		} else if(geneType instanceof FunctionType) {
			return buildLambda((FunctionType)geneType, random);
		}
		assert( false ); // Unknown type
		return null;
	}

	private Gene buildMaybe(Maybe maybe, Random random) {
		if( mRandomizer.maybeIsNull(random) ) {
			return new NullGene();
		}
		return buildItem(maybe.type(),random);
	}

	private Gene buildList(ListType listType, Random random) {
		int length = mRandomizer.selectListLength(random);
		ListGene list = new ListGene(listType);
		while(length > 0) {
			list.add(buildItem(listType.elementType(),random));
			--length;
		}
		return list;
	}

	private Gene buildCons(ConsType type, Random random) {
		return new ConsGene( type,
				buildItem(type.carType(),random),
				buildItem(type.cdrType(),random)
		);
	}

	private Gene buildSymbol(Random random) {
		return new SymbolGenerator(random.nextLong(), mRandomizer.selectStringLength(random));
	}

	private Gene buildBool(Random random) {
		return new BoolGenerator(random.nextLong());
	}

	private Gene buildString(Random random) {
		return new StringGenerator(random.nextLong(), mRandomizer.selectStringLength(random));
	}

	private RealGenerator buildReal(Random random) {
		RealGenerator.Range range = mRandomizer.selectRealRange(random);
		return new RealGenerator(random.nextLong(), range);
	}

	private Gene buildFixNum(Random random) {
		FixNumGenerator.Range range = mRandomizer.selectFixnumRange(random);
		return new FixNumGenerator(random.nextLong(), range);
	}

	public Gene buildFunction(FunctionType type, String name, Random random) {
		java.util.Set<Type> allowTypes = new java.util.HashSet<Type>();
		for( Type argType : type.argumentTypes() ) {
			TypeBuilder.findConcreteTypes(argType, allowTypes);
		}
		mTypeBuilder.allowDependentTypes(allowTypes);
		try {
			return buildFunctionGene(type, random, name, false);

		} finally {
			mTypeBuilder.clearDependentTypes();
		}
	}

	private Gene buildFunctionGene(FunctionType type, Random random, String name, boolean isLambda) {
		String names[] = FunctionGene.argumentNames( type, name);
		pushArguments( names, type.argumentTypes() );

		Gene body = buildItem(type.returnType(), random);
		Gene result = new FunctionGene(type, name, body, isLambda);

		mContext.popSymbols(names.length);
		return result;
	}

	private void pushArguments(String[] names, Type[] types) {
		for( int i = 0; i < names.length; ++i ) {
			mContext.pushSymbol(names[i], types[i]);
		}
	}

	private Gene buildLambda(FunctionType type, Random random) {
		return buildFunctionGene(type, random, "l" + StringRandom.alphaString(random, 5), true);
	}
}
