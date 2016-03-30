var GENES = (function () {
    "use strict";

    var P = SLUR_TYPES.Primitives;

    function NullGene() {
        this.type = P.NULL;
    }

    NullGene.prototype.express = function (context) {
        return SLUR.NULL;
    };

    NullGene.prototype.mutate = function (mutation, context, entropy) {
        return this;
    };

    NullGene.prototype.copy = function () {
        return new NullGene();
    };

    function TrueGene() {
        this.type = P.NULL;
    }

    TrueGene.prototype.express = function (context) {
        return SLUR.TRUE;
    };

    TrueGene.prototype.mutate = function (mutation, context, entropy) {
        return this;
    };

    TrueGene.prototype.copy = function () {
        return new TrueGene();
    };

    function FixNumGenerator(seed, range) {
        this.type = P.FIX_NUM;
        this.seed = seed;
        this.range = range;
    }

    FixNumGenerator.prototype.express = function (context) {
        var seedValue = this.seed / ENTROPY.MAX_SEED,
            min = this.range.min,
            max = this.range.max,
            value = max == min ? min : Math.min(Math.floor(min + seedValue * (max - min)), max - 1);
        return new SLUR.FixNum(value);
    };

    FixNumGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(mutation, entropy);
        var range = null;
        if (mutation.mutateFixnumRange(entropy)) {
            range = mutation.newFixnumRange(this.range, entropy);
        }
        if (this.seed !== seed || range !== null) {
            return new FixNumGenerator(seed, range ? range : this.range);
        }
        return this;
    };

    FixNumGenerator.prototype.copy = function () {
        return new FixNumGenerator(this.seed, this.range);
    };

    function RealGenerator(seed, range) {
        this.type = P.FIX_NUM;
        this.seed = seed;
        this.range = range;
    }

    RealGenerator.prototype.express = function (context) {
        var seedValue = this.seed / ENTROPY.MAX_SEED,
            min = this.range.min,
            max = this.range.max,
            value = min + seedValue * (max - min);
        return new SLUR.Real(value);
    };

    RealGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(mutation, entropy);
        var range = null;
        if (mutation.mutateRealRange(entropy)) {
            range = mutation.newRealRange(this.range, entropy);
        }
        if (this.seed !== seed || range !== null) {
            return new RealGenerator(seed, range ? range : this.range);
        }
        return this;
    };

    RealGenerator.prototype.copy = function () {
        return new RealGenerator(this.seed, this.range);
    };

    function SymbolGenerator(seed, length) {
        this.type = P.STRING;
        this.seed = seed;
        this.length = length;
    }

    SymbolGenerator.prototype.express = function (context) {
        var entropy = new ENTROPY.Entropy(this.seed);
        return entropy.alphaString(this.length);
    };

    SymbolGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(entropy);
        var length = this.length;
        if (mutation.mutateSymbolLength(entropy)) {
            length = mutation.newSymbolLength(length, entropy);
        }
        if (this.seed !== seed || this.length !== length) {
            return new SymbolGenerator(seed, length);
        }
        return this;
    };

    StringGenerator.prototype.copy = function () {
        return new StringGenerator(this.seed, this.length);
    };

    function StringGenerator(seed, length) {
        this.type = P.STRING;
        this.seed = seed;
        this.length = length;
    }

    StringGenerator.prototype.express = function (context) {
        var entropy = new ENTROPY.Entropy(this.seed);
        return entropy.alphaString(this.length);
    };

    StringGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(entropy);
        var length = this.length;
        if (mutation.mutateStringLength(entropy)) {
            length = mutation.newStringLength(length, entropy);
        }
        if (this.seed !== seed || this.length !== length) {
            return new StringGenerator(seed, length);
        }
        return this;
    };

    StringGenerator.prototype.copy = function () {
        return new StringGenerator(this.seed, this.length);
    };

    function BoolGenerator(seed) {
        this.type = P.BOOL;
        this.seed = seed;
    }

    BoolGenerator.prototype.express = function (context) {
		return this.seed % 2 == 1 ? SLUR.TRUE : SLUR.NULL;
    };

    BoolGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(entropy);
        if (this.seed !== seed) {
            return new BoolGenerator(seed);
        }
        return this;
    };

    BoolGenerator.prototype.copy = function () {
        return new BoolGenerator(this.seed);
    };

    function ConsGene(type, car, cdr) {
        this.type = type;
        this.carGene = car;
        this.cdrGene = cdr;
    }

    ConsGene.prototype.express = function (context) {
        var car = this.carGene.express(context),
            cdr = this.cdrGene.express(context);
        return SLUR.makeList([new SLUR.Symbol("cons"), car, cdr]);
    };

    ConsGene.prototype.mutate = function (mutation, context, entropy) {
        var mutantCar = mutation.mutateGene(this.type.carType, this.carGene, context, entropy),
            mutantCdr = mutation.mutateGene(this.type.cdrType, this.cdrGene, context, entropy);
        if (mutantCar != this.carGene || mutantCdr != this.cdrGene) {
            return new ConsGene(this.type, mutantCar, mutantCdr);
        }
        return this;
    };

    ConsGene.prototype.copy = function () {
        return new ConsGene(this.type, this.carGene.copy(), this.cdrGene.copy());
    };

    function ListGene(type, items) {
        this.type = type;
        this.items = items ? items : [];
    }

    ListGene.prototype.express = function  (context) {
		var list = SLUR.NULL;
		for (var i = this.items.length - 1; i >= 0; --i) {
			list = new SLUR.Cons(this.items[i].express(context), list);
		}
		return SLUR.prependList(new SLUR.Symbol("list"), list);
	};

    ListGene.prototype.mutate = function (mutation, context, entropy) {
        function swap(list, a, b) {
            var atA = list[a];
            list[a] = list[b];
            list[b] = atA;
        }

        var mutatedItems = this.items,
            listLength = mutatedItems.length;

		if (mutation.reorderList(entropy)) {
            mutatedItems = mutatedItems.slice();
			for (var i = 0; i < mutatedItems.length; ++i ) {
				var j = i + entropy.randomInt(0, mutatedItems.length - i );
				swap(mutatedItems, i, j);
			}
		} else if ( mutatedItems.length > 0 && mutation.swapListItems(entropy)) {
            mutatedItems = mutatedItems.slice();
			var x = entropy.randomInt(0, mutatedItems.length),
                y = entropy.randomInt(0, mutatedItems.length);
			swap(mutatedItems, x, y);
		} else if (mutation.mutateListLength(entropy)) {
			listLength = mutation.geneBuilderProbabilities().selectListLength(entropy);
            mutatedItems = mutatedItems.slice(0, Math.Min(listLength, mutatedItems.length));
		}
        mutatedItems = this.mutateItems(mutation, context, entropy, mutatedItems);

        for (var n = mutatedItems.length; n < listLength; ++n ) {
            mutatedItems.push(mutation.createNewGene(this.type.elementType, context, entropy));
        }

		if (mutatedItems != this.items) {
			return new ListGene(this.type, mutatedItems);
		}
        return this;
    };

    ListGene.prototype.mutateItems = function (mutation, context, entropy, items) {
		var isMutated = false,
            mutated = [];
		for (var i = 0; i < items.length; ++i) {
			var item = items[i],
                mutatedItem = mutation.mutateGene(this.type.elementType, item, context, entropy);
			if (mutatedItem != item) {
				isMutated = true;
			}
			mutated.push(mutatedItem);
		}
		if (isMutated) {
			return mutated;
		}
        return items;
	};

	ListGene.prototype.copy = function () {
		var items = [];
		for (var i = 0; i < this.items.length; ++i) {
			items.push(this.items[i].copy());
		}
		return new ListGene(this.type, items);
	};

    function LookupGene(type, symbolName, seed) {
        this.type = type;
        this.symbolName = symbolName;
        this.seed = seed;
    }

    LookupGene.prototype.express = function (context) {
        var matching = context.findMatching(this.type),
            result = this.findSymbol(matching, this.symbolName, this.type);
        if (result !== null) {
            return result;
        }

        if (matching.length > 0) {
            result = matching[this.seed % matching.length];
            this.symbolName = result.name;
            return result;
        }
        throw "No symbol matching type.";
    };

    LookupGene.prototype.findSymbol = function (list, symbolName, type) {
        for (var i = 0; i < list.length; ++i) {
            var item = list[i];
            if (item.name === symbolName) {
                return item;
            }
        }
        return null;
    };

    LookupGene.prototype.mutate = function (mutation, context, entropy) {
        if (mutation.mutateSeed(entropy)) {
            return new LookupGene(this.type, null, entropy.randomSeed());
        }
        return this;
    };

    LookupGene.prototype.copy = function () {
        return new LookupGene(this.type, this.symbolName, this.seed);
    };


    function IfGene(type, predicateGene, thenGene, elseGene) {
        this.type = type;
        this.predicateGene = predicateGene;
        this.thenGene = thenGene;
        this.elseGene = elseGene;
    }

    IfGene.prototype.express = function (context) {
        return new SLUR.IfExpression(
            this.predicateGene.express(context),
            this.thenGene.express(context),
            this.elseGene.express(context)
        );
    };

    IfGene.prototype.mutate = function (mutation, context, entropy) {
        var mutatedPredicate = mutation.mutateGene(P.BOOL, this.predicateGene, context, entropy),
            mutatedThen = mutation.mutateGene(this.type, this.thenGene, context, entropy),
            mutatedElse = mutation.mutateGene(this.type, this.elseGene, context, entropy);
        if (this.predicateGene != mutatedPredicate || this.thenGene != mutatedThen || this.elseGene != mutatedElse) {
            return new IfGene(this.type, mutatedPredicate, mutatedThen, mutatedElse);
        }
        return this;
    };

    IfGene.prototype.copy = function () {
        return new IfGene(this.type, this.predicateGene, this.thenGene, this.elseGene);
    };

/*
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
