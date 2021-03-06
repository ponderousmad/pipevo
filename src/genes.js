var GENES = (function () {
    "use strict";

    function Context(registry) {
        this.registry = registry;
        this.chromosomes = [];
        this.symbolTable = [];
    }

    Context.prototype.addChromosome = function (chromosome) {
        this.chromosomes.push(chromosome);
    };

    Context.prototype.findMatching = function (type, allowTarget) {
        type = SLUR_TYPES.makeParametersUnique(type);
        var matching = this.registry.findMatch(type);
        for (var c = 0; c < (this.chromosomes.length - (allowTarget ? 0 : 1)); ++c) {
            var genes = this.chromosomes[c].namedGenes();
            for (var g = 0; g < genes.length; ++g) {
                var gene = genes[g];
                if (gene.gene.type.match(type).matches) {
                    matching.push(new SLUR.Symbol(gene.name));
                }
            }
        }
        for (var s = 0; s < this.symbolTable.length; ++s) {
            var entry = this.symbolTable[s];
            if (type.match(entry.type).matches) {
                matching.push(entry.symbol);
            }
        }
        return matching;
    };

    Context.prototype.pushSymbol = function (name, type) {
        this.symbolTable.push({symbol: new SLUR.Symbol(name), type: type});
    };

    Context.prototype.popSymbols = function (count) {
        this.symbolTable.splice(this.symbolTable.length - count, count);
    };

    Context.prototype.findFunctionReturning = function (returnType, allowTarget) {
        returnType = SLUR_TYPES.makeParametersUnique(returnType);
        var matching = this.registry.findFunctionReturning(returnType);
        for (var c = 0; c < (this.chromosomes.length - (allowTarget ? 0 : 1)); ++c) {
            var genes = this.chromosomes[c].namedGenes();
            for (var g = 0; g < genes.length; ++g) {
                var gene = genes[g];
                if (SLUR_TYPES.isFunctionType(gene.gene.type)) {
                    var match = returnType.match(gene.gene.type.returnType);
                    if(match.matches) {
                        matching.push({symbol: new SLUR.Symbol(gene.name), type: gene.gene.type.substitute(match.mappings)});
                    }
                }
            }
        }
        for (var s = 0; s < this.symbolTable.length; ++s) {
            var entry = this.symbolTable[s];
            if (SLUR_TYPES.isFunctionType(entry.type)) {
                var entryMatch = returnType.match(entry.type.returnType);
                if (entryMatch.matches) {
                    matching.push({symbol: entry.symbol, type: entry.type.substitute(entryMatch.mappings)});
                }
            }
        }
        return matching;
    };

    Context.prototype.findConcreteTypes = function() {
        var result = [];
        for (var s = 0; s < this.symbolTable.length; ++s) {
            var entry = this.symbolTable[s];
            entry.type.findConcrete(result);
        }
        return result;
    };

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
        this.type = P.BOOLEAN;
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
        // This produces biased results, when the max seed is not a muliple of
        // the range size, but makes the mutation have nice properties.
        var min = this.range.min,
            max = this.range.max,
            value = max == min ? min : min + this.seed % (max - min + 1);
        return new SLUR.FixNum(value);
    };

    FixNumGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(this.seed, entropy);
        var range = null;
        if (mutation.mutateFixnumRange(entropy)) {
            range = mutation.newFixnumRange(this.range, entropy);
        }
        if (this.seed !== seed || range !== null) {
            return new FixNumGenerator(seed, range !== null ? range : this.range);
        }
        return this;
    };

    FixNumGenerator.prototype.copy = function () {
        return new FixNumGenerator(this.seed, this.range);
    };

    function RealGenerator(seed, range) {
        this.type = P.REAL;
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
        var seed = mutation.mutateSeed(this.seed, entropy);
        var range = null;
        if (mutation.mutateRealRange(entropy)) {
            range = mutation.newRealRange(this.range, entropy);
        }
        if (this.seed !== seed || range !== null) {
            return new RealGenerator(seed, range !== null ? range : this.range);
        }
        return this;
    };

    RealGenerator.prototype.copy = function () {
        return new RealGenerator(this.seed, this.range);
    };

    function SymbolGenerator(seed, length) {
        this.type = P.SYMBOL;
        this.seed = seed;
        this.length = length;
    }

    SymbolGenerator.prototype.express = function (context) {
        var entropy = new ENTROPY.Entropy(this.seed);
        return new SLUR.Symbol(entropy.alphaString(this.length));
    };

    SymbolGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(this.seed, entropy);
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
        return new SLUR.StringValue(entropy.alphaString(this.length));
    };

    StringGenerator.prototype.mutate = function (mutation, context, entropy) {
        var seed = mutation.mutateSeed(this.seed, entropy);
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
        var seed = mutation.mutateSeed(this.seed, entropy);
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
		return new SLUR.Cons(new SLUR.Symbol("list"), list);
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
			listLength = mutation.randomizer.selectListLength(entropy);
            mutatedItems = mutatedItems.slice(0, Math.min(listLength, mutatedItems.length));
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
        var seed = mutation.mutateSeed(this.seed, entropy);
        if (this.seed != seed) {
            return new LookupGene(this.type, null, seed);
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
        this.functionType = functionGene.type;
        this.type = this.functionType.returnType;
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
        var mutatedFunction = mutation.mutateGene(this.functionType, this.functionGene, context, entropy),
            mutated = mutatedFunction != this.functionGene,
            mutatedArgs = [];
        for (var i = 0; i < this.args.length; ++i) {
            var arg = this.args[i];
            mutatedArgs.push(mutation.mutateGene(this.functionType.argumentTypes[i], arg, context, entropy));
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
        this.maybeType = maybeGene.type;
        if (!this.maybeType.maybeType) {
            throw "Maybe expected.";
        }
		this.type = this.maybeType.maybeType;
		this.maybeGene = maybeGene;
		this.concreteGene = concreteGene;
		this.varName = varName;
    }

    DemaybeGene.prototype.express = function (context) {
		var maybeSym = new SLUR.Symbol("dm_" + this.varName),
            binding = SLUR.makeList([maybeSym, this.maybeGene.express(context)]),
            body = new SLUR.IfExpression(maybeSym, maybeSym, this.concreteGene.express(context));
		return SLUR.makeList([new SLUR.Symbol("let"), SLUR.makeList(binding), body]);
	};

    DemaybeGene.prototype.mutate = function (mutation, context, entropy) {
        var mutatedMaybe = null;
        do {
            mutatedMaybe = mutation.mutateGene(this.maybeType, this.maybeGene, context, entropy);
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
        if (!this.type.match(this.functionType.returnType).matches) {
            throw "Mismatch between type and function type.";
        }
        this.functionGene = functionGene;
        this.argGenes = argGenes;
        this.varName = varName;
    }

    PassMaybeGene.prototype.express = function (context) {
        var bindings = this.buildBindings(context, 0),
            args = this.buildArguments(0),
            application = new SLUR.Cons(this.functionGene.express(context), args),
            predicate = this.buildPredicate(),
            body = null;
        if (SLUR.isNull(predicate)) {
            body = SLUR.makeList(application);
        } else {
            body = SLUR.makeList(new SLUR.IfExpression(predicate, application, SLUR.NULL));
        }
        return new SLUR.Cons(new SLUR.Symbol("let"), new SLUR.Cons(bindings, body));
    };

    PassMaybeGene.prototype.buildArguments = function (index) {
        if (index >= this.argGenes.length) {
            return SLUR.NULL;
        }
        return new SLUR.Cons(this.varSymbol(index), this.buildArguments(index + 1));
    };

    PassMaybeGene.prototype.varSymbol = function (index) {
		return new SLUR.Symbol("pm_" + this.varName + index);
    };

    PassMaybeGene.prototype.buildPredicate = function () {
		var checks = this.buildPredicateN(0);
		if ( SLUR.isCons(checks)) {
			return new SLUR.Cons(new SLUR.Symbol("and"), checks);
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
		return new SLUR.Cons(symbol, rest);
    };

    PassMaybeGene.prototype.check = function (index) {
		return !(SLUR_TYPES.isMaybe(this.functionType.argumentTypes[index]));
	};

    PassMaybeGene.prototype.buildBindings = function (context, index) {
		if (index >= this.argGenes.length) {
			return SLUR.NULL;
		}
		return new SLUR.Cons(this.buildBinding(context, index), this.buildBindings(context, index + 1));
    };

    PassMaybeGene.prototype.buildBinding = function (context, index) {
		return SLUR.makeList([this.varSymbol(index), this.argGenes[index].express(context)]);
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
        if (!body || !name || !type) {
            throw "Invalid parameters";
        }
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
			return this.expressLambda(this.argumentList(args), body);
		} else {
			return this.expressFunction(this.name, this.argumentList(args), body);
		}
    };

    FunctionGene.prototype.argumentList = function (args) {
		var list = SLUR.NULL;
		for (var i = args.length - 1; i >= 0; --i ) {
			list = new SLUR.Cons(new SLUR.Symbol(args[i]), list);
		}
		return list;
	};

    FunctionGene.prototype.expressFunction = function (name, args, body) {
		return new SLUR.Cons(new SLUR.Symbol("define"), new SLUR.Cons(new SLUR.Cons(new SLUR.Symbol(this.name), args), body));
	};

    FunctionGene.prototype.expressLambda = function (args, body) {
		return new SLUR.Cons(new SLUR.Symbol("lambda"), new SLUR.Cons(args, body));
	};

    FunctionGene.prototype.pushArguments = function (context, args) {
		for (var i = 0; i < args.length; ++i) {
			context.pushSymbol(args[i], this.type.argumentTypes[i]);
		}
	};

    FunctionGene.prototype.popArguments = function (context) {
		context.popSymbols(this.type.argumentTypes.length);
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

    function testSuite() {
        var nullGeneTests = [
            function testType() {
                var gene = new NullGene();
                TEST.isTrue(gene.type.equals(P.NULL));
            },
            function testExpress() {
                var gene = new NullGene(),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.isTrue(SLUR.isNull(phene));
            }
        ];

        var trueGeneTests = [
            function testType() {
                var gene = new TrueGene();
                TEST.isTrue(gene.type.equals(P.BOOLEAN));
            },
            function testExpress() {
                var gene = new TrueGene(),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.isFalse(SLUR.isNull(phene));
                TEST.equals(phene.value, true);
            }
        ];

        var generatorTests = [
            function testFixnumType() {
                var gene = new FixNumGenerator(1, { min: 0, max: 100 });
                TEST.isTrue(gene.type.equals(P.FIX_NUM));
            },
            function testFixnumExpress() {
                var range = { min: 0, max: 100 },
                    gene = new FixNumGenerator(102, range),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.isTrue(SLUR.isInt(phene));
                TEST.equals(phene.value, 1);
            },
            function testRealType() {
                var gene = new RealGenerator(1, { min: 0, max: 100 });
                TEST.isTrue(gene.type.equals(P.REAL));
            },
            function testRealExpress() {
                var range = { min: 0, max: 100 },
                    gene = new RealGenerator(102, range),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.isTrue(SLUR.isReal(phene));
                TEST.isTrue(range.min <= phene.value);
                TEST.isTrue(phene.value <= range.max);
            },
            function testSymbolType() {
                var gene = new SymbolGenerator(1, 5);
                TEST.equals(gene.type, P.SYMBOL);
            },
            function testSymbolExpress() {
                var gene = new SymbolGenerator(1, 5),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.isTrue(SLUR.isSymbol(phene));
                TEST.equals(5, phene.name.length);
            },
            function testStringType() {
                var gene = new StringGenerator(1, 5);
                TEST.equals(gene.type, P.STRING);
            },
            function testStringExpress() {
                var gene = new StringGenerator(1, 5),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.isTrue(SLUR.isString(phene));
                TEST.equals(5, phene.value.length);
            },
            function testBoolType() {
                var gene = new BoolGenerator(1);
                TEST.isTrue(gene.type.equals(P.BOOL));
            },
            function testBoolExpress() {
                var gene = new BoolGenerator(1),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.value, true);
            }
        ];

        var containerTests = [
            function testConsType() {
                var gene = new ConsGene(new SLUR_TYPES.ConsType(P.NULL, P.NULL), new NullGene(), new NullGene());
                TEST.isTrue(gene.type.equals(new SLUR_TYPES.ConsType(P.NULL,P.NULL)));
            },
            function testConsExpress() {
                var gene = new ConsGene(new SLUR_TYPES.ConsType(P.NULL, P.NULL), new NullGene(), new NullGene()),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(),"(cons () ())");
            },
            function testListType() {
                var gene = new ListGene(new SLUR_TYPES.ListType(P.FIX_NUM));
                TEST.isTrue(gene.type.equals(new SLUR_TYPES.ListType(P.FIX_NUM)));
            },
            function testListExpress() {
                var gene = new ListGene(new SLUR_TYPES.ListType(P.FIX_NUM)),
                    c = new Context(new SLUR_TYPES.Registry()),
                    phene = gene.express(c);
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "(list)");

                var items = [new FixNumGenerator(0, { min: 0, max: 2 })];
                gene = new ListGene(new SLUR_TYPES.ListType(P.FIX_NUM), items);
                phene = gene.express(c);
                TEST.notNull(phene);
                TEST.equals(phene.toString(),"(list 0)");

                items.push(new FixNumGenerator(1, { min: 0, max: 2 }));
                gene = new ListGene(new SLUR_TYPES.ListType(P.FIX_NUM), items);
                phene = gene.express(c);
                TEST.notNull(phene);
                TEST.equals(phene.toString(),"(list 0 1)");

                items.push(new FixNumGenerator(2, { min: 0, max: 2 }));
                gene = new ListGene(new SLUR_TYPES.ListType(P.FIX_NUM), items);
                phene = gene.express(c);
                TEST.notNull(phene);
                TEST.equals(phene.toString(),"(list 0 1 2)");
            },
            function testCopy() {
                var gene = new ListGene(new SLUR_TYPES.ListType(P.FIX_NUM), [
                        new FixNumGenerator(0, { min: 0, max: 2 }),
                        new FixNumGenerator(1, { min: 0, max: 2 }),
                        new FixNumGenerator(2, { min: 0, max: 2 })
                    ]),
                    copy = gene.copy();
                TEST.notSame(gene, copy);

                var c = new Context(new SLUR_TYPES.Registry()),
                    phene = gene.express(c),
                    copyPhene = copy.express(c);
                TEST.equals(phene.toString(), copyPhene.toString());
            }
        ];

        function buildContext() {
            var reg = new SLUR_TYPES.Registry();
            SLUR_TYPES.registerBuiltins(reg);
            return new Context(reg);
        }

        function buildLookupGene() {
            var p = new SLUR_TYPES.Parameter();
            return new LookupGene(new SLUR_TYPES.FunctionType(new SLUR_TYPES.ConsType(p, p), [p, p]), "cons", 0);
        }


        var lookupTests = [
            function testLookupType() {
                var gene = buildLookupGene(),
                    q = new SLUR_TYPES.Parameter();
                TEST.isTrue(gene.type.match(new SLUR_TYPES.FunctionType(new SLUR_TYPES.ConsType(q,q), [q, q])).matches);
            },
            function testExpress() {
                var gene = buildLookupGene(),
                    c = buildContext(),
                    phene = gene.express(c);
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "cons");
            }
        ];

        var fixZero = new FixNumGenerator(0, { min: 0, max: 1 }),
            fixOne = new FixNumGenerator(1, { min: 0, max: 1 });

        var ifTests = [
            function testIfType() {
                var ifGene = new IfGene(P.FIX_NUM, new NullGene(), fixZero, fixOne);
                TEST.isTrue(ifGene.type.equals(P.FIX_NUM));
            },
            function testIfExpress() {
                var c = new Context(new SLUR_TYPES.Registry());

                var gene = new IfGene(P.FIX_NUM, new NullGene(), fixZero, fixOne);

                var phene = gene.express(c);
                TEST.notNull(phene);
                TEST.equals("(if () 0 1)", phene.toString());
            }
        ];

        var FuncType = SLUR_TYPES.FunctionType;

        var functionTests = [
        	function testType() {
                var gene = new FunctionGene(new FuncType(P.FIX_NUM, [P.FIX_NUM]), "fn", fixOne);
                TEST.isTrue(gene.type.equals(new FuncType(P.FIX_NUM, [P.FIX_NUM])));
            },
            function testExpressNoArgs() {
                var gene = new FunctionGene(new FuncType(P.FIX_NUM, []), "fn", fixOne),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "(define (fn) 1)");
            },
            function testExpressOneArg() {
                var gene = new FunctionGene(new FuncType(P.FIX_NUM, [P.FIX_NUM]), "fn", fixOne),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "(define (fn fnp0) 1)");
            },
            function testExpressTwoArgs() {
                var gene = new FunctionGene(new FuncType(P.FIX_NUM, [P.FIX_NUM, P.BOOL]), "fn", new TrueGene()),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "(define (fn fnp0 fnp1) #t)");
            },
            function testExpressLambda() {
                var gene = new FunctionGene(new FuncType(P.FIX_NUM, [P.FIX_NUM]), "fn", new BoolGenerator(1), true),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "(lambda (fnp0) #t)");
            }
        ];

        var appTests = [
            function testType() {
                var type = new FuncType(P.FIX_NUM, [P.FIX_NUM]),
                    gene = new ApplicationGene(new FunctionGene(type, "l", fixOne, true), [fixZero]);
                TEST.isTrue(gene.type.equals(P.FIX_NUM));
            },
            function testExpress() {
                var type = new FuncType(P.FIX_NUM, [P.FIX_NUM]),
                    gene = new ApplicationGene(new FunctionGene(type, "l", fixOne, true), [fixZero]),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "((lambda (lp0) 1) 0)");
            }
        ];

        function buildPassMaybeGene() {
            var type = new FuncType(new SLUR_TYPES.Maybe(P.FIX_NUM), [P.FIX_NUM]),
                func = new FunctionGene(type, "l", fixOne, true),
                ifGene = new IfGene(new SLUR_TYPES.Maybe(P.FIX_NUM), new TrueGene(), fixZero, new NullGene()),
                gene = new PassMaybeGene(new SLUR_TYPES.Maybe(P.FIX_NUM), func, [ifGene], "a");
            return gene;
        }

        var maybeTests = [
        	function testDemaybeType() {
                var ifGene = new IfGene(new SLUR_TYPES.Maybe(P.FIX_NUM), new NullGene(), fixOne, new NullGene()),
                    gene = new DemaybeGene(ifGene, fixZero, "a");
                TEST.isTrue(gene.type.equals(P.FIX_NUM));
            },
            function testDemaybeExpress() {
                var ifGene = new IfGene(new SLUR_TYPES.Maybe(P.FIX_NUM), new NullGene(), fixOne, new NullGene()),
                    gene = new DemaybeGene(ifGene, fixZero, "a"),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "(let ((dm_a (if () 1 ()))) (if dm_a dm_a 0))");
            },
            function testPassMaybeType() {
                var gene = buildPassMaybeGene();
                TEST.isTrue(gene.type.equals(new SLUR_TYPES.Maybe(P.FIX_NUM)));
            },
            function testPassMaybeExpress() {
                var gene = buildPassMaybeGene(),
                    phene = gene.express(new Context(new SLUR_TYPES.Registry()));
                TEST.notNull(phene);
                TEST.equals(phene.toString(), "(let ((pm_a0 (if #t 0 ()))) (if pm_a0 ((lambda (lp0) 1) pm_a0) ()))");
            }
        ];

        TEST.run("NullGene", nullGeneTests);
        TEST.run("TrueGene", trueGeneTests);
        TEST.run("Generator", generatorTests);
        TEST.run("ContainerGene", containerTests);
        TEST.run("LookupGene", lookupTests);
        TEST.run("IfGene", ifTests);
        TEST.run("FunctionGene", functionTests);
        TEST.run("ApplicationGene", appTests);
        TEST.run("MaybeGenes", maybeTests);
    }

    return {
        Context: Context,
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
        functionArgumentNames: functionArgumentNames,
        testSuite: testSuite
    };
}());
