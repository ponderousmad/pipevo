GENES = (function () {
    "use strict";
    
/*
public class NullGene implements Gene, Serializable {
	private static final long serialVersionUID = 4062847001468592113L;

	public Obj express(Context context) {
		return Null.NULL;
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		return this;
	}

	public Type type() {
		return BaseType.NULL;
	}

	public Gene copy() {
		return new NullGene();
	}
}

public class TrueGene implements Gene, Serializable {
	private static final long serialVersionUID = 8095791718163656229L;

	public Obj express(Context context) {
		return True.TRUE;
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		return this;
	}

	public Type type() {
		return BaseType.TRUE;
	}

	public Gene copy() {
		return new TrueGene();
	}
}

public abstract class Generator implements Gene, Serializable {
	private static final long serialVersionUID = 5322982214150695657L;

	abstract Obj generate( Context context, long seed );

	private Long mSeed;

	public Generator( Long seed ) {
		mSeed = seed;
	}

	public Obj express( Context context ) {
		return generate(context, mSeed);
	}

	public Gene mutate(Mutation mutation, Context context, Random random) {
		boolean mutateSeed = mutation.mutateSeed(random);
		return mutate(mutation, context, random, mutateSeed ? mutation.newSeed(mSeed, random) : mSeed, mutateSeed);
	}

	abstract protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated);
}


public class FixNumGenerator extends Generator implements Serializable {
	public static class Range implements java.io.Serializable
	{
		private static final long serialVersionUID = -6215911768631332669L;
		public int min;
		public int max;

		public Range( int min, int max ) {
			assert( max >= min );
			this.min = min;
			this.max = max;
		}
	}

	private static final long serialVersionUID = 4778701458495855287L;
	private Range mRange;

	public FixNumGenerator( long seed, Range range ) {
		super( seed );
		mRange = range;
	}

	public FixNumGenerator( long seed, int min, int max ) {
		super( seed );
		mRange = new Range(min, max);
	}

	public FixNumGenerator( long seed ) {
		super( seed );
		mRange = new Range(Integer.MIN_VALUE, Integer.MAX_VALUE);
	}

	public Obj generate(Context c, long seed) {
		long min = mRange.min;
		long max = mRange.max;
		long range = max - min + 1;
		long value = min + Math.abs(seed) % range;

		return new FixNum( (int)value );
	}

	public Type type() {
		return BaseType.FIXNUM;
	}

	public Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		FixNumGenerator.Range range = mRange;
		if( mutation.mutateFixnumRange(random) ) {
			range = mutation.newRange(range, random);
			mutated = true;
		}
		if( mutated ) {
			return new FixNumGenerator(seed, range);
		} else {
			return this;
		}
	}
}

public class RealGenerator extends Generator implements Serializable {
	public static class Range implements java.io.Serializable
	{
		private static final long serialVersionUID = -3129409270771848845L;

		public double min;
		public double max;

		public Range( double min, double max ) {
			assert( max >= min );
			this.min = min;
			this.max = max;
		}
	}

	private static final long serialVersionUID = -1780673200901782401L;
	private Range mRange;

	public RealGenerator( long seed, Range range ) {
		super( seed );
		mRange = range;
	}

	public RealGenerator( long seed ) {
		super( seed );
		mRange = new Range(-1e20, 1e20);
	}

	public Obj generate(Context c, long seed) {
		double value = Math.abs(seed) / (double)Long.MAX_VALUE;
		return new Real( mRange.min + (mRange.max - mRange.min) * value );
	}

	public Type type() {
		return BaseType.REAL;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		RealGenerator.Range range = mRange;
		if( mutation.mutateRealRange(random) ) {
			range = mutation.newRange(range, random);
			mutated = true;
		}
		if( mutated ) {
			return new RealGenerator(seed, range);
		} else {
			return this;
		}
	}
}

public class SymbolGenerator extends Generator implements Serializable {
	private static final long serialVersionUID = -1509367746874838812L;
	private int mLength;

	public SymbolGenerator(Long seed, int length) {
		super(seed);
		mLength = length;
	}

	Obj generate(Context context, long seed) {
		Random rand = new Random( seed );

		return new Symbol( StringRandom.alphaString( rand, mLength ) );
	}

	public Type type() {
		return BaseType.SYMBOL;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		int length = mLength;
		if( mutation.mutateSymbolLength( random ) ) {
			length = mutation.newSymbolLength( mLength, random );
			mutated = true;
		}
		if( mutated ) {
			return new SymbolGenerator(seed, length);
		} else {
			return this;
		}
	}
}

public class StringGenerator extends Generator implements Serializable {
	private static final long serialVersionUID = 812058085772927206L;
	private int mLength;

	public StringGenerator(Long seed, int length) {
		super(seed);
		mLength = length;
	}

	Obj generate(Context context, long seed) {
		Random rand = new Random( seed );
		return new StringObj( StringRandom.asciiString( rand, mLength ) );
	}

	public Type type() {
		return BaseType.STRING;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		int length = mLength;
		if( mutation.mutateStringLength( random ) ) {
			length = mutation.newStringLength( mLength, random );
			mutated = true;
		}
		if( mutated ) {
			return new StringGenerator(seed, length);
		} else {
			return this;
		}
	}
}

public class BoolGenerator extends Generator implements Serializable {
	private static final long serialVersionUID = 7930710939815370656L;

	public BoolGenerator(long seed) {
		super( seed );
	}

	public Obj generate(Context context, long seed) {
		return seed % 2 == 1 ? True.TRUE : Null.NULL;
	}

	public Type type() {
		return BaseType.BOOL;
	}

	protected Gene mutate(Mutation mutation, Context context, Random random, Long seed, boolean mutated) {
		if( mutated ) {
			return new BoolGenerator(seed);
		} else {
			return this;
		}
	}
}

public class ConsGene implements Gene, Serializable {
	private static final long serialVersionUID = 1421679234788666512L;
	private Gene mCarGene;
	private Gene mCdrGene;
	private ConsType mType;

	public ConsGene( ConsType type, Gene carGene, Gene cdrGene ) {
		mType = type;
		assert( mType.carType().match(carGene.type()).matches() );
		assert( mType.cdrType().match(cdrGene.type()).matches() );
		mCarGene = carGene;
		mCdrGene = cdrGene;
	}

	public Obj express(Context context) {
		Obj car = mCarGene.express(context);
		Obj cdr = mCdrGene.express(context);
		return Cons.list(new Symbol("cons"), car, cdr);
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		Gene mutatedCar = mutation.mutateGene(mType.carType(), mCarGene, context, random);
		Gene mutatedCdr = mutation.mutateGene(mType.cdrType(), mCdrGene, context, random);
		if( mutatedCar != mCarGene || mutatedCdr != mCdrGene ) {
			return new ConsGene(mType, mutatedCar, mutatedCdr );
		} else {
			return this;
		}
	}

	public Type type() {
		return mType;
	}
}

public class ListGene implements Gene, Serializable {
	private static final long serialVersionUID = -6581933318180613868L;
	private ListType mType;
	private List<Gene> mItems;

	public ListGene( ListType type ) {
		mType = type;
		mItems = new ArrayList<Gene>();
	}

	public ListGene(ListType type, List<Gene> items) {
		mType = type;
		mItems = items;
		for( Gene item : mItems ) {
			assert( mType.elementType().match(item.type()).matches() );
		}
	}

	public void add(Gene item) {
		assert( mType.elementType().match(item.type()).matches() );
		mItems.add(item);
	}

	public Obj express(Context context) {
		Obj list = Null.NULL;
		for( int i = mItems.size() - 1; i >= 0; --i) {
			list = new Cons( mItems.get(i).express(context), list );
		}
		return Cons.prependList(new Symbol("list"), list);
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		List<Gene> mutatedItems = mItems;
		if( mutation.reorderList(random) ) {
			mutatedItems = new ArrayList<Gene>(mItems);
			for( int i = 0; i < mutatedItems.size(); ++i ) {
				int j = i + random.nextInt( mutatedItems.size() - i );
				swapItems(mutatedItems, i, j);
			}
			mutatedItems = mutateItems(mutation, context, random, mutatedItems);
		} else if( !mItems.isEmpty() && mutation.swapListItems(random) ) {
			mutatedItems = new ArrayList<Gene>(mItems);
			int i = random.nextInt( mItems.size() );
			int j = random.nextInt( mItems.size() );
			swapItems(mutatedItems, i,j);
			mutatedItems = mutateItems(mutation, context, random, mutatedItems);
		} else if( mutation.mutateListLength(random) ) {
			int listLength = mutation.geneBuilderProbabilities().selectListLength(random);
			mutatedItems = mutateItems(mutation, context, random, mItems.subList(0, Math.min(listLength, mItems.size())));
			for( int i = mItems.size(); i < listLength; ++i ) {
				mutatedItems.add( mutation.createNewGene(mType.elementType(), context, random));
			}
		} else {
			mutatedItems = mutateItems(mutation, context, random, mItems);
		}
		if( mutatedItems != mItems ) {
			return new ListGene(mType, mutatedItems);
		} else {
			return this;
		}
	}

	private List<Gene> mutateItems(Mutation mutation, Context context, Random random, List<Gene> items) {
		boolean isMutated = false;
		List<Gene> mutated = new ArrayList<Gene>(items.size());
		for( int i = 0; i < items.size(); ++i ) {
			Gene item = mItems.get(i);
			Gene mutatedItem = mutation.mutateGene(mType.elementType(), item, context, random);
			if( mutatedItem != item ) {
				isMutated = true;
			}
			mutated.add(mutatedItem);
		}
		if( isMutated ) {
			return mutated;
		} else {
			return items;
		}
	}

	private static void swapItems(List<Gene> items, int i, int j) {
		Gene temp = items.get(i);
		items.set(i, items.get(j));
		items.set(j, temp);
	}

	public Type type() {
		return mType;
	}

	public Gene copy() {
		ListGene result = new ListGene( mType );
		for( Gene item : mItems ) {
			result.add(item);
		}
		return result;
	}
}

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

public class IfGene implements Gene, Serializable {
	private static final long serialVersionUID = -5240925814305025173L;
	Type mResultType;
	private Gene mPredicateGene;
	private Gene mThenGene;
	private Gene mElseGene;

	public IfGene( Type resultType, Gene predicateGene, Gene thenGene, Gene elseGene ) {
		assert( resultType != null );
		assert( predicateGene != null );
		assert( thenGene != null );
		assert( elseGene != null );

		mResultType = resultType;
		mPredicateGene = predicateGene;
		mThenGene = thenGene;
		mElseGene = elseGene;
	}

	public Obj express(Context context) {
		return new IfExpression(
			mPredicateGene.express(context),
			mThenGene.express(context),
			mElseGene.express(context)
		);
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		Gene mutatedPredicate = mutation.mutateGene(BaseType.BOOL, mPredicateGene, context, random);
		Gene mutatedThen = mutation.mutateGene(mResultType, mThenGene, context, random);
		Gene mutatedElse = mutation.mutateGene(mResultType, mElseGene, context, random);
		if( mutatedPredicate != mPredicateGene || mutatedThen != mThenGene || mutatedElse != mElseGene ) {
			return new IfGene(mResultType, mutatedPredicate, mutatedThen, mutatedElse);
		} else {
			return this;
		}
	}

	public Type type() {
		return mResultType;
	}
}

public class ApplicationGene implements Gene, Serializable {
	private static final long serialVersionUID = -5034193235992065191L;
	FunctionType mType;
	private Gene mFunction;
	Gene[] mArguments;

	public ApplicationGene( Gene function, Gene[] arguments ) {
		assert( function.type() instanceof FunctionType );
		mType = (FunctionType)function.type();
		setup(function, arguments);
	}

	public ApplicationGene( FunctionType type, Gene function, Gene[] arguments ) {
		assert( type.match(function.type()).matches() );
		mType = type;
		setup(function, arguments);
	}

	private void setup(Gene function, Gene[] arguments) {
		mFunction = function;
		mArguments = arguments;

		// Make sure we have enough argument genes.
		assert( mType.argumentTypes().length <= arguments.length );
	}

	public Obj express(Context context) {
		return new Cons(
			mFunction.express(context),
			generateArguments(context,0)
		);
	}

	private Obj generateArguments( Context context, int offset ) {
		if(offset >= mArguments.length) {
			return Null.NULL;
		}
		return new Cons(mArguments[offset].express(context), generateArguments(context, offset + 1));
	}

	public Type type() {
		return mType.returnType();
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		Gene mutatedFunction = mutation.mutateGene(mType, mFunction, context, random);
		boolean mutated = mutatedFunction != mFunction;
		Gene[] mutatedArgs = new Gene[mArguments.length];
		for( int i = 0; i < mArguments.length; ++i ) {
			mutatedArgs[i] = mutation.mutateGene(mType.argumentTypes()[i], mArguments[i], context, random);
			if( mutatedArgs[i] != mArguments[i] ) {
				mutated = true;
			}
		}
		if( mutated ) {
			return new ApplicationGene(mType, mutatedFunction, mutatedArgs);
		} else {
			return this;
		}
	}
}

public class DemaybeGene implements Gene, Serializable {
	private static final long serialVersionUID = 4908664511966073626L;
	private Maybe mType;
	private Gene mMaybeGene;
	private Gene mConcreteGene;
	private String mVarName;

	public DemaybeGene(Gene maybeGene, Gene concreteGene, String varName) {
		assert( maybeGene.type() instanceof Maybe );
		mType = (Maybe)maybeGene.type();
		mMaybeGene = maybeGene;
		mConcreteGene = concreteGene;
		mVarName = varName;
	}

	public Obj express(Context context) {
		Symbol maybeSym = maybeSymbol();
		Cons binding = Cons.list(maybeSym, mMaybeGene.express(context));
		Obj body = new IfExpression(maybeSym, maybeSym, mConcreteGene.express(context));
		return Cons.list(new Symbol("let"), Cons.list(binding), body);
	}

	private Symbol maybeSymbol() {
		return new Symbol("dm_" + mVarName);
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		Gene mutatedMaybe;
		do {
			mutatedMaybe = mutation.mutateGene(mType, mMaybeGene, context, random);
		} while( !(mutatedMaybe.type() instanceof Maybe) );

		Gene mutatedConcrete = mutation.mutateGene(type(), mConcreteGene, context, random);

		if( mMaybeGene != mutatedMaybe || mConcreteGene != mutatedConcrete ) {
			return new DemaybeGene(mutatedMaybe, mutatedConcrete, mVarName);
		} else {
			return this;
		}
	}

	public Type type() {
		return mType.type();
	}
}

public class PassMaybeGene implements Gene, Serializable {
	private static final long serialVersionUID = 7584683815234892086L;
	private FunctionType mFunctionType;
	private Maybe mType;
	private Gene mFunction;
	private Gene[] mArguments;
	private String mVarName;

	public PassMaybeGene( Type type, Gene function, Gene[] arguments, String varName ) {
		assert( type instanceof Maybe );
		mType = (Maybe)type;
		assert( function.type() instanceof FunctionType );
		mFunctionType = (FunctionType)function.type();
		assert( mType.match(mFunctionType.returnType()).matches() );
		assert( arguments.length == mFunctionType.argumentTypes().length );
		mFunction = function;
		mArguments = arguments;
		mVarName = varName;
	}

	public Obj express(Context context) {
		Obj bindings = buildBindings(context, 0);

		Obj arguments = buildArguments(0);
		Cons application = Cons.prependList(mFunction.express(context), arguments);

		Obj predicate = buildPredicate();
		Cons body;
		if( predicate.isNull() ) {
			body = Cons.list(application);
		} else {
			body = Cons.list(new IfExpression(predicate, application, Null.NULL));
		}

		return Cons.prependList(new Symbol("let"), bindings, body);
	}

	private Obj buildArguments( int index ) {
		if( index >= mArguments.length ) {
			return Null.NULL;
		}
		return Cons.prependList(varSymbol(index), buildArguments(index+1));
	}

	private Symbol varSymbol(int index) {
		return new Symbol("pm_" + mVarName + Integer.toString(index));
	}

	private Obj buildPredicate() {
		Obj checks = buildPredicate(0);
		if( checks.isCons() ) {
			return Cons.prependList(new Symbol("and"), checks);
		}
		return checks;
	}

	private Obj buildPredicate(int index) {
		if( index >= mArguments.length ) {
			return Null.NULL;
		}
		Obj rest = buildPredicate(index + 1);
		if( !check(index) ) {
			return rest;
		}
		Obj self = varSymbol(index);
		if( rest.isNull() ) {
			return self;
		}
		if( !rest.isCons() ) {
			rest = Cons.list(rest);
		}
		return Cons.prependList(self, rest);
	}

	private boolean check(int index) {
		return !(mFunctionType.argumentTypes()[index] instanceof Maybe);
	}

	private Obj buildBindings(Context context, int index) {
		if( index >= mArguments.length ) {
			return Null.NULL;
		}
		return Cons.prependList(buildBinding(context, index), buildBindings(context,index+1));
	}

	private Cons buildBinding(Context context, int index) {
		return Cons.list(varSymbol(index), mArguments[index].express(context));
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		Gene mutatedFunction = mutation.mutateGene(mFunctionType, mFunction, context, random);
		boolean isMutated = mutatedFunction != mFunction;
		Gene[] mutatedArgs = new Gene[mArguments.length];
		for( int i = 0; i < mArguments.length; ++i ) {
			mutatedArgs[i] = mutation.mutateGene(mFunctionType.argumentTypes()[i], mArguments[i], context, random);
			if( mutatedArgs[i] != mArguments[i] ) {
				isMutated = true;
			}
		}
		if( isMutated ) {
			return new PassMaybeGene(mType, mutatedFunction, mutatedArgs, mVarName);
		} else {
			return this;
		}
	}

	public Type type() {
		return mType;
	}
}

public class FunctionGene implements Gene, Serializable {
	private static final long serialVersionUID = -8494109078787886616L;
	private FunctionType mType;
	private String mName;
	private Gene mBody;
	private boolean mIsLambda;

	public FunctionGene( FunctionType type, String name, Gene body ) {
		mType = type;
		mName = name;
		mBody = body;
		mIsLambda = false;
	}

	public FunctionGene( FunctionType type, String name, Gene body, boolean isLambda ) {
		mType = type;
		mName = name;
		mBody = body;
		mIsLambda = isLambda;
	}

	public Type type() {
		return mType;
	}

	public Obj express(Context context) {
		String[] arguments = argumentNames();
		pushArguments( context, arguments );
		Cons body = Cons.list(mBody.express(context));
		popArguments( context );

		if( mIsLambda ) {
			return expressLambda( argumentList(arguments), body );
		} else {
			return expressFunction( mName, argumentList(arguments), body );
		}
	}

	private Obj argumentList( String[] arguments ) {
		Obj list = Null.NULL;
		for( int i = arguments.length - 1; i >=0; --i ) {
			list = new Cons( new Symbol( arguments[i] ), list );
		}
		return list;
	}

	private Obj expressFunction(String name, Obj arguments, Cons body) {
		return Cons.prependList( new Symbol("define"), Cons.prependList(new Symbol(mName), arguments), body);
	}

	private Obj expressLambda(Obj arguments, Cons body) {
		return Cons.prependList(new Symbol("lambda"), arguments, body);
	}

	private void pushArguments(Context context, String[] argumentNames ) {
		for( int i = 0; i < argumentNames.length; ++i ) {
			context.pushSymbol( argumentNames[i], mType.argumentTypes()[i] );
		}
	}

	private void popArguments(Context context) {
		context.popSymbols( mType.argumentTypes().length );
	}

	public static String[] argumentNames( FunctionType functionType, String baseName ) {
		baseName = baseName + "p";
		String[] arguments = new String[ functionType.argumentTypes().length ];
		for( int i = 0; i < arguments.length; ++i ) {
			arguments[i] = baseName + Integer.toString(i);
		}
		return arguments;
	}

	public String[] argumentNames() {
		return argumentNames( mType, mName );
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		pushArguments(context, argumentNames());
		Gene mutatedBody = mutation.mutateGene(mType.returnType(), mBody, context, random);
		popArguments(context);

		if( mutatedBody != mBody ) {
			return new FunctionGene(mType, mName, mutatedBody, mIsLambda);
		} else {
			return this;
		}
	}
}
*/
    return {
    };
}());
