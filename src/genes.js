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
    
    function ApplicationGene(functionGene, args) {
        this.type = functionGene.type;
        this.functionGene = functionGene;
        this.args = args;
    }
    
    ApplicationGene.prototype.express = function (context) {
        return new SLUR.Cons(
            this.functionGene.express(context),
            this.generateArguments(context, 0)
        );
    };
    
    ApplicationGene.prototype.generateArguments = function (context, offset) {
        if (offset >= this.args.length) {
            return SLUR.NULL;
        }
        return new SLUR.Cons(this.args[offset].express(context), this.generateArguments(context, offset + 1));
    };
    
    ApplicationGene.prototype.mutate = function (mutation, context, entropy) {
        var mutatedFunction = mutation.mutateGene(this.type, this.functionGene, context, entropy),
            mutated = mutatedFunction != this.functionGene,
            mutatedArgs = [];
        for (var i = 0; i < this.args.length; ++i) {
            var arg = this.args[i];
            mutatedArgs.push(mutation.mutateGene(this.type.argumentTypes[i], arg, context, entropy));
            if (mutatedArgs[i] != arg) {
                mutated = true;
            }
        }
        
        if (mutated) {
            return new ApplicationGene(mutatedFunction, mutatedArgs);
        }
        return this;
    };
    
    function DemaybeGene(maybeGene, concreteGene, varName) {
		this.type = maybeGene.type;
		this.maybeGene = maybeGene;
		this.concreteGene = concreteGene;
		this.varName = varName;
    }
    
    DemaybeGene.prototype.express = function (context) {
		var maybeSym = new SLUR.Symbol("dm_" + this.varName),
            binding = SLUR.makeList([maybeSym, this.maybeGene.express(context)]),
            body = new SLUR.IfExpression(maybeSym, maybeSym, this.concreteGene.express(context));
		return SLUR.makeList(new SLUR.Symbol("let"), SLUR.makeList(binding), body);
	};
    
    DemaybeGene.prototype.mutate = function (mutation, context, entropy) {
        var mutatedMaybe = null;
        do {
            mutatedMaybe = mutation.mutateGene(this.type, this.maybeGene, context, entropy);
        } while(!SLUR_TYPES.isMaybe(mutatedMaybe.type));
        
        var mutatedConcrete = mutation.mutateGene(this.type, this.concreteGene, context, entropy);
        if (this.maybeGene != mutatedMaybe || this.concreteGene != mutatedConcrete) {
            return new DemaybeGene(mutatedMaybe, mutatedConcrete, this.varName);
        }
        return this;
    };
    
    DemaybeGene.prototype.copy = function() {
        return new DemaybeGene(this.maybeGene, this.concreteGene, this.varName);
    };
    
    function PassMaybeGene(type, functionGene, argGenes, varName) {
        this.type = type;
        this.functionType = functionGene.type;
        if (!this.type.match(this.functionType.returnType).matches()) {
            throw "Mismatch between type and function type.";
        }
        this.argGenes = argGenes;
        this.varName = varName;
    }
    
    PassMaybeGene.prototype.express = function (context) {
        var bindings = this.buildBindings(context, 0),
            args = this.buildArguments(0),
            application = SLUR.prependList(this.function.express(context), args),
            predicate = this.buildPredicate(),
            body = null;
        if (SLUR.isNull(predicate)) {
            body = SLUR.makeList(application);
        } else {
            body = SLUR.makeList(new SLUR.IfExpression(predicate, application, SLUR.NULL));
        }
        return SLUR.prependList(new SLUR.Symbol("let"), bindings, body);
    };

    PassMaybeGene.prototype.buildArguments = function (index) {
        if (index >= this.argGenes.length) {
            return SLUR.NULL;
        }
        return SLUR.prependList(this.varSymbol(index), this.buildArguments(index + 1));
    };
    
    PassMaybeGene.prototype.varSymbol = function (index) {
		return new SLUR.Symbol("pm_" + this.varName + index);
    };
    
    PassMaybeGene.prototype.buildPredicate = function () {
		var checks = this.buildPredicateN(0);
		if ( SLUR.isCons(checks)) {
			return SLUR.prependList(new SLUR.Symbol("and"), checks);
		}
		return checks;
    };
    
    PassMaybeGene.prototype.buildPredicateN = function (index) {
		if (index >= this.argGenes.length) {
			return SLUR.NULL;
		}
		var rest = this.buildPredicateN(index + 1);
		if (!this.check(index)) {
			return rest;
		}
		var symbol = this.varSymbol(index);
		if (SLUR.isNull(rest)) {
			return symbol;
		}
		if (!SLUR.isCons(rest)) {
			rest = SLUR.makeList(rest);
		}
		return SLUR.prependList(symbol, rest);
    };
    
    PassMaybeGene.prototype.check = function (index) {
		return !(SLUR_TYPES.isMaybe(this.functionType.argumentTypes[index]));
	};
    
    PassMaybeGene.prototype.buildBindings = function (context, index) {
		if (index >= this.argGenes.length) {
			return SLUR.NULL;
		}
		return SLUR.prependList(this.buildBinding(context, index), this.buildBindings(context, index + 1));
    };
    
    PassMaybeGene.prototype.buildBinding = function (context, index) {
		return SLUR.makeList([this.varSymbol(index), this.arguments[index].express(context)]);
    };
    
    PassMaybeGene.prototype.mutate = function (mutation, context, entropy) {
		var mutatedFunction = mutation.mutateGene(this.functionType, this.functionGene, context, entropy),
            isMutated = mutatedFunction != this.functionGene,
            mutatedArgs = [];
		for (var i = 0; i < this.argGenes.length; ++i) {
			mutatedArgs[i] = mutation.mutateGene(this.functionType.argumentTypes[i], this.argGenes[i], context, entropy);
			if (mutatedArgs[i] != this.argGenes[i]) {
				isMutated = true;
			}
		}
		if (isMutated) {
			return new PassMaybeGene(this.type, mutatedFunction, mutatedArgs, this.varName);
		} else {
			return this;
		}
    };
    
    PassMaybeGene.prototype.copy = function () {
        return new PassMaybeGene(this.type, this.functionGene, this.argGenes, this.varName);
    };
    
    function FunctionGene(type, name, body, isLambda) {
        this.type = type;
        this.name = name;
        this.body = body;
        this.isLambda = isLambda ? true : false;
    }
    
    FunctionGene.prototype.express = function (context) {
		var args = this.argumentNames();
		this.pushArguments(context, args);
		var body = SLUR.makeList(this.body.express(context));
		this.popArguments(context);

		if (this.isLambda) {
			return this.expressLambda(this.argumentList(arguments), body);
		} else {
			return this.expressFunction(this.name, this.argumentList(arguments), body);
		}
    };
    
    FunctionGene.prototype.argumentList = function (args) {
		var list = SLUR.NULL;
		for (var i = args.length - 1; i >= 0; --i ) {
			list = new SLUR.Cons(new Symbol(args[i] ), list);
		}
		return list;
	};
    
    FunctionGene.prototype.expressFunction = function (name, args, body) {
		return SLUR.prependList(new SLUR.Symbol("define"), SLUR.prependList(new SLUR.Symbol(this.name), args), body);
	};
    
    FunctionGene.prototype.expressLambda = function (args, body) {
		return SLUR.prependList(new SLUR.Symbol("lambda"), args, body);
	};

    FunctionGene.prototype.pushArguments = function (context, args) {
		for (var i = 0; i < this.args.length; ++i ) {
			context.pushSymbol(args[i], this.type.argumentTypes[i]);
		}
	};

    FunctionGene.prototype.popArguments = function (context) {
		context.popSymbols( this.type.argumentTypes.length );
	};

    function functionArgumentNames(type, baseName) {
        baseName = baseName + "p";
		var names = [];
		for (var i = 0; i < type.argumentTypes.length; ++i) {
			names.push(baseName + i);
		}
		return names;
    }
    
    FunctionGene.prototype.argumentNames = function () {
        return functionArgumentNames(this.type, this.name);
	};
    
    FunctionGene.prototype.mutate = function (mutation, context, entropy) {
		this.pushArguments(context, this.argumentNames());
		var mutatedBody = mutation.mutateGene(this.type.returnType, this.body, context, entropy);
		this.popArguments(context);

		if (mutatedBody != this.body) {
			return new FunctionGene(this.type, this.name, mutatedBody, this.isLambda);
		}
        return this;
    };

    FunctionGene.prototype.copy = function () {
        return new FunctionGene(this.type, this.name, this.body, this.isLambda);
    };
    
    return {
        NullGene: NullGene,
        TrueGene: TrueGene,
        FixNumGenerator: FixNumGenerator,
        RealGenerator: RealGenerator,
        SymbolGenerator: SymbolGenerator,
        StringGenerator: StringGenerator,
        BoolGenerator: BoolGenerator,
        ConsGene: ConsGene,
        ListGene: ListGene,
        LookupGene: LookupGene,
        IfGene: IfGene,
        ApplicationGene: ApplicationGene,
        DemaybeGene: DemaybeGene,
        PassMaybeGene: PassMaybeGene,
        FunctionGene: FunctionGene,
        functionArgumentNames: functionArgumentNames
    };
}());
