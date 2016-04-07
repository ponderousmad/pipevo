var EVOLVE = (function () {
    "use strict";

    function Gene(type, express, mutate) {
        this.type = type;
        this.express = express;
        this.mutate = mutate;
    }

    function Chromosome(name) {
        this.name = name;
        this.genes = [];
    }

    Chromosome.prototype.size = function () {
        return this.genes.length;
    };

    Chromosome.prototype.nextGeneName = function () {
        return this.geneName(this.size());
    };

    Chromosome.prototype.geneName = function (i) {
        return this.name + i;
    };

    Chromosome.prototype.namedGenes = function () {
        var named = [];
        for (var g = 0; g < this.genes.length; ++g) {
            named.push({ name: this.geneName(g), gene: this.genes[g] });
        }
        return named;
    };

    Chromosome.prototype.add = function (gene) {
        this.genes.push(gene);
    };

    Chromosome.prototype.express = function (context) {
        var phenes = [];
        for (var g = 0; g < this.genes.length; ++g) {
            phenes.push({ name: this.geneName(g), gene: this.genes[g].express(context) });
        }
        return phenes;
    };

    Chromosome.prototype.findLastMatching = function (type) {
        for (var g = this.genes.length - 1; g >= 0; --g) {
            var gene = this.genes[g];
            if (gene.type.equals(type)) {
                return { name: this.geneName(g), gene: gene };
            }
        }
        return null;
    };

    function Genome() {
        this.chromosomes = [];
    }

    Genome.prototype.add = function (chromosome) {
        this.chromosomes.push(chromosome);
    };

    Genome.prototype.express = function (context) {
        var phenome = [];
        for (var c = 0; c < this.chromosomes.length; ++c) {
            var chromosome = this.chromosomes[c];
            context.addChromosome(chromosome);
            phenome = phenome.concat(chromosome.express(context));
        }
        return phenome;
    };

    Genome.prototype.findLastMatching = function (type) {
        for (var c = this.chromosomes.length - 1; c >= 0; --c) {
            var matching = this.chromosomes[c].findLastMatching(type);
            if (matching !== null) {
                return new SLUR.Symbol(matching.name);
            }
        }
        return null;
    };

    function Constraint(type, sources) {
        this.type = type;
        this.sources = sources;
    }

    Constraint.prototype.available = function (inContext) {
        for (var c = 0; c < inContext.length; ++c) {
            var contextType = inContext[c];
            if (contextType.equals(this.type)) {
                return true;
            }

            for (var s = 0; s < this.sources.length; ++s) {
                if (this.sources[s].equals(contextType)) {
                    return true;
                }
            }
        }
        return false;
    };

    function TypeProbabilities() {
        this.functionWeight = 1;
        this.listWeight = 10;
        this.maybeWeight = 50;
        this.consWeight = 1;
        this.parameterWeight = 1;
        this.newParameterProbability = 0.2;

        this.argCountDistribution = [10, 10, 5, 2, 1, 1, 1];

        this.concreteWeights = this.setupDefault();
    }

    function weightType(type, weight) { return { type: type, weight: weight }; }

    TypeProbabilities.prototype.setupDefault = function () {
        var P = SLUR_TYPES.Primitives,
            weights = [];
        weights.push(weightType(P.FIX_NUM, 100));
        weights.push(weightType(P.REAL, 100));
        weights.push(weightType(P.NULL, 100));
        weights.push(weightType(P.BOOLEAN, 100));
        weights.push(weightType(P.BOOL, 100));
        weights.push(weightType(P.STRING, 100));
        return weights;
    };

    TypeProbabilities.prototype.functionArgCountDistribution = function () {
        var dist = new ENTROPY.WeightedSet();
        for (var i = 0; i < this.argCountDistribution.length; ++i) {
            dist.add(i, this.argCountDistribution[i]);
        }
        return dist;
    };

    function TypeBuilder(allowParameterized, probabilities, constraints) {
        this.probabilities = probabilities;
        this.allowParameterized = allowParameterized;
        this.parameters = [];

        this.constraints = {};
        this.allowances = null;
        this.constrainedStack = [];
        if (constraints) {
            for (var c = 0; c < constraints.length; ++c) {
                var constraint = constraints[c];
                this.constraints[constraint.type] = constraint;
                if (this.allowances === null) {
                    this.allowances = {};
                }

                for (var s = 0; s < constraint.sources.length; ++s) {
                    var sourceType = constraint.sources[s],
                        allowed = this.allowances[sourceType];
                    if (!allowed) {
                        allowed = [];
                    }
                    allowed.push(constraint.type);
                    this.allowances[sourceType] = allowed;
                }
            }
        }

        var builders = new ENTROPY.WeightedSet(),
            self = this;

        function addConcreteBuilder(type, weight) {
            if (weight > 0) {
                builders.add(function (entropy) { return type; }, weight);
            }
        }

        for (var w = 0; w < this.probabilities.concreteWeights.length; ++w) {
            var entry = this.probabilities.concreteWeights[w];
            if (!this.isConstrained(entry.type)) {
                addConcreteBuilder(entry.type, entry.weight);
            }
        }

        if (this.probabilities.functionWeight > 0) {
            builders.add(function (entropy) {
                return self.createFunction(self.createType(entropy), entropy); }, this.probabilities.functionWeight);
        }
        if (this.probabilities.listWeight > 0) {
            builders.add(function (entropy) { return self.createList(entropy); }, this.probabilities.listWeight);
        }
        if (this.probabilities.maybeWeight > 0) {
            builders.add(function (entropy) { return self.createMaybe(entropy); }, this.probabilities.maybeWeight);
        }
        if (this.probabilities.consWeight > 0) {
            builders.add(function (entropy) { return self.createCons(entropy); }, this.probabilities.consWeight);
        }

        if (this.allowParameterized && this.probabilities.parameterWeight > 0) {
            builders.add(function (entropy) { return self.createParameter(entropy); }, this.probabilities.parameterWeight);
        }
        this.builders = new ENTROPY.ReweightedSet(builders);

        this.sourceStack = [];
        this.constraintedStack = [];
        this.nesting = 0;

        this.functionArgCountDist = this.probabilities.functionArgCountDistribution();
    }

    TypeBuilder.prototype.isConstrained = function (type) {
        return this.constraints.hasOwnProperty(type);
    };

    TypeBuilder.prototype.allowDependentTypes = function (sources) {
        if (this.sourceStack.length > 0) {
            throw "Source stack already present";
        }

        if (this.allowances === null) {
            return;
        }

        for (var s = 0; s < this.sources.length; ++s) {
            var type = this.sources[s],
                dependents = this.allowances[type];
            this.sourceStack.push(type);
            this.addConstrained(type);
            if (dependents) {
                for (var d = 0; d < dependents.length; ++d) {
                    this.addConstrained(dependents[d]);
                }
            }
        }
    };

    TypeBuilder.prototype.addConstrained = function (constrained) {
        if (!this.onConstrainedStack(constrained)) {
            var builder = this.addConstrainedBuilder(constrained);
            if (builder !== null) {
                this.constrainedStack.push({type:constrained, builder: builder});
            }
        }
    };

    TypeBuilder.prototype.onConstrainedStack = function (constrained) {
        for (var e = 0; e < this.constrainedStack.length; ++e) {
            var entry = this.constrainedStack[e];
            if (entry.type.equals(constrained)) {
                return true;
            }
        }
        return false;
    };

    TypeBuilder.prototype.addConstrainedBuilder = function (constrained) {
        var weight = null;
        for (var p = 0; p < this.probabilities.concreteWeights.length; ++p) {
            var entry = this.probabilities.concreteWeights[p];
            if (entry.type.equals(constrained)) {
                weight = entry.weight;
                break;
            }
        }
        if (weight !== null) {
            var builder = function (entropy) { return constrained; };
            this.builders.add(builder, weight);
            return builder;
        }
        return null;
    };

    TypeBuilder.prototype.allowAllConstrained = function () {
        if (this.allowances !== null) {
            var types = [];
            for (var type in this.allowances) {
                if (this.allowances.hasOwnProperty(type)) {
                    types.push(type);
                }
            }
            this.allowDependentTypes(types);
        }
    };

    TypeBuilder.prototype.clearDependentTypes = function () {
        this.sourceStack = [];
        for (var e = 0; e < this.constrainedStack.length; ++e) {
            this.builders.remove(this.constrainedStack[e].builder);
        }
        // TODO: Shouldn't this also clear constraintedStack ?
    };

    TypeBuilder.prototype.createType = function (entropy) {
        this.nesting += 1;
        try {
            var builder = this.builders.select(entropy);
            return builder(entropy);
        } finally {
            this.nesting -= 1;
            if (this.nesting === 0) {
                this.parameters = [];
            }
        }
    };

    TypeBuilder.prototype.createFunction = function (returnType, entropy) {
        var clearParameters = false;
        try {
            if (this.parameters.length === 0 && SLUR_TYPES.isParameter(returnType)) {
                clearParameters = true;
                this.parameters.push(returnType);
            }
            var argCount = this.functionArgCountDist.select(entropy),
                argTypes = [];
            for (var c = 0; c < argCount; ++c) {
                argTypes[c] = this.createType(entropy);
            }

            if (this.isConstrained(returnType)) {
                var satisfied = false,
                    constraint = this.constraints[returnType];
                for (var a = 0; a < argCount && !satisfied; ++a) {
                    var argType = argTypes[a];
                    if (argType.equals(returnType)) {
                        statisfied = true;
                        break;
                    }
                    for (var s = 0; s < constraint.sources.length; ++s) {
                        if (constraint.sources[s].equals(argType)) {
                            satisfied = true;
                            break;
                        }
                    }
                }
                // If we don't have one of the source types for this constrained type, then force the issue.
                if (!satisfied) {
                    if (argCount === 0) {
                        argCount = 1;
                    }
                    var source = returnType,
                        index = entropy.randomInt(constraint.sources.length + 1);
                    if (index < constraint.sources.length) {
                        source = constraint.sources[index];
                    }
                    argTypes[entropy.randomInt(0, argTypes.length)] = source;
                }
            }
            return new SLUR_TYPES.FunctionType(returnType, argTypes);
        } finally {
            if (clearParameters) {
                this.parameters = [];
            }
        }
    };

    TypeBuilder.prototype.createList = function (entropy) {
        return new SLUR_TYPES.ListType(this.createType(entropy));
    };

    TypeBuilder.prototype.createMaybe = function (entropy) {
        var type = this.createType(entropy);
        if (type.equals(SLUR_TYPES.Primitives.NULL)) {
            // Won't hurt anything to force to NULL, avoids potential (but extremely unlikely) infinite loop.
            return type;
        }
        return new SLUR_TYPES.Maybe(type);
    };

    TypeBuilder.prototype.createCons = function (entropy) {
        return new SLUR_TYPES.ConsType(this.createType(entropy), this.createType(entropy));
    };

    TypeBuilder.prototype.createParameter = function (entropy) {
        if (this.parameters.length === 0 || entropy.select(this.probabilities.newParameterProbability)) {
            var p = new SLUR_TYPES.Parameter();
            this.parameters.push(p);
            return p;
        }
        return this.parameters[entropy.randomInt(0, this.parameters.length)];
    };

    TypeBuilder.prototype.createConstructableType = function (entropy) {
        var result = null;
        do {
            result = this.createType(entropy);
        } while(this.isConstrained(result));
        return result;
    };

    function Population(target) {
        this.target = target;
        this.crowd = [];
    }

    Population.prototype.isTarget = function (target) {
        return SLUR_TYPES.typesEqualModuloParameters(this.target, target);
    };

    Population.prototype.add = function (genome) {
        this.crowd.push(genome);
    };

    Population.prototype.serialize = function () {
        return JSON.stringify(this);
    };

    function loadPopulation(serialization) {
        var data = JSON.parse(serialization),
            population = new Population(data.target);
        population.crowd = data.crowd;
        return population;
    }

    var BuildType = {
        BRANCH: 1,
        APPLICATION: 2,
        LOOKUP: 3,
        CONSTRUCT: 4,
        MAYBE: 5
    };

    function weightRange(min, max, weight) { return { min: min, max: max, weight: weight}; }

    function GeneProbabilities() {
        this.stringLengthWeights = [0,1,3,5,10,20,10,5,3,1,1,1,1,1,1,1,1,1,1,1];
        this.listLengthWeights = [0,10,20,10,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];
        this.chromosomeLengthWeights = [0,1,2,3,2,1];
        this.genomeSizeWeights = [0,1,2,3,2,1];
        this.maybeIsNullProbability = 0.25;
        this.buildTypeWeights = [
            weightType(BuildType.BRANCH, 5),
            weightType(BuildType.APPLICATION, 20),
            weightType(BuildType.CONSTRUCT, 20),
            weightType(BuildType.LOOKUP, 50),
            weightType(BuildType.MAYBE, 1),
        ];
        this.fixnumRangeWeights = [
            weightRange(0, 1, 1),
            weightRange(0, 2, 2),
            weightRange(0, 10, 4),
            weightRange(-1, 1, 3),
            weightRange(0, 20, 4),
            weightRange(0, 100, 5),
            weightRange(0, 1000, 3),
            weightRange(-2147483648, 2147483647, 1)
        ];
        this.realRangeWeights = [
            weightRange(0, 1, 1),
            weightRange(0, 2, 2),
            weightRange(0, 10, 4),
            weightRange(-1, 1, 3),
            weightRange(0, 20, 4),
            weightRange(0, 100, 5),
            weightRange(0, 1000, 3),
            weightRange(-1e100, 1e100, 1)
        ];
    }

    function GeneRandomizer(probabilities) {
        this.probabilities = probabilities;

        function distribution(weights, itemBuilder, weightLookup, skipFunction) {
            var set = new ENTROPY.WeightedSet();
            for (var i = 0; i < weights.length; ++i) {
                if (!skipFunction || !skipFunction(weights, i)) {
                    set.add(itemBuilder(weights, i), weightLookup(weights, i));
                }
            }
            return set;
        }
        function returnIndex(weights, index) { return index; }
        function returnAtIndex(weights, index) { return weights[index]; }
        function returnWeight(weights, index) { return weights[index].weight; }
        function returnRange(weights, index) {
            var item = weights[index];
            return { min: item.min, max: item.max };
        }

        this.stringLengthDistribution = distribution(probabilities.stringLengthWeights, returnIndex, returnAtIndex);
        this.listLengthDistribution = distribution(probabilities.listLengthWeights, returnIndex, returnAtIndex);
        this.chromosomeLengthDistribution = distribution(probabilities.chromosomeLengthWeights, returnIndex, returnAtIndex);
        this.genomeSizeDistribution = distribution(probabilities.genomeSizeWeights, returnIndex, returnAtIndex);
        this.fixnumRangeDistribution = distribution(probabilities.fixnumRangeWeights, returnRange, returnWeight);
        this.realRangeDistribution = distribution(probabilities.realRangeWeights, returnRange, returnWeight);
    }

    GeneRandomizer.prototype.buildTypeWeight = function (type) {
        for (var i = 0; i < this.probabilities.buildTypeWeights.length; ++i) {
            var entry = this.probabilities.buildTypeWeights[i];
            if (entry.type === type) {
                return entry.weight;
            }
        }
        return 0;
    };

    GeneRandomizer.prototype.selectStringLength = function (entropy) {
        return this.stringLengthDistribution.select(entropy);
    };

    GeneRandomizer.prototype.selectListLength = function (entropy) {
        return this.listLengthDistribution.select(entropy);
    };

    GeneRandomizer.prototype.maybeIsNull = function (entropy) {
        return entropy.select(this.probabilities.maybeIsNullProbability);
    };

    GeneRandomizer.prototype.selectFixnumRange = function (entropy) {
        return this.fixnumRangeDistribution.select(entropy);
    };

    GeneRandomizer.prototype.selectRealRange = function (entropy) {
        return this.realRangeDistribution.select(entropy);
    };

    GeneRandomizer.prototype.selectChromosomeLength = function (entropy) {
        return this.chromosomeLengthDistribution.select(entropy);
    };

    GeneRandomizer.prototype.selectGenomeSize = function (entropy) {
        return this.genomeSizeDistribution.select(entropy);
    };

    function GeneBuilder(typeBuilder, randomizer, context) {
        this.typeBuilder = typeBuilder;
        this.randomizer = randomizer;
        this.context = context;
        this.depthAllowed = 5;
    }

    GeneBuilder.prototype.canConstruct = function (type) {
        return !this.typeBuilder.isConstrained(type);
    };

    GeneBuilder.prototype.buildItem = function (geneType, entropy) {
        var builders = new ENTROPY.WeightedSet(),
            self = this;

        if (this.canLookup(geneType)) {
            builders.add(
                function () { return self.lookup(geneType, entropy); },
                this.randomizer.buildTypeWeight(BuildType.LOOKUP)
            );
        }

        if (this.canConstruct(geneType)) {
            builders.add(
                function () { return self.constructItem(geneType, entropy); },
                this.randomizer.buildTypeWeight(BuildType.CONSTRUCT)
            );
        }

        if (this.canApply(geneType, this.depthAllowed)) {
            builders.add(
                function () { return self.buildApplication(geneType, entropy); },
                this.randomizer.buildTypeWeight(BuildType.APPLICATION)
            );
            if (SLUR_TYPES.isMaybe(geneType)) {
                builders.add(
                    function () { return self.buildPassMaybe(geneType, entropy); },
                    this.randomizer.buildTypeWeight(BuildType.MAYBE)
                );
            }
        }

        if (!builders.isEmpty()) {
            if (this.depthAllowed > 0) {
                if (!(SLUR_TYPES.isMaybe(geneType) || geneType.equals(SLUR_TYPES.Primitives.NULL))) {
                    builders.add(
                        function () { return self.buildDemaybe(geneType, entropy); },
                        this.randomizer.buildTypeWeight(BuildType.MAYBE)
                    );
                }
                builders.add(
                    function () { return self.buildBranch(geneType, entropy); },
                    this.randomizer.buildTypeWeight(BuildType.BRANCH)
                );
            }

            try {
                this.depthAllowed -= 1;
                return builders.select(entropy)();
            } finally {
                this.depthAllowed += 1;
            }
        }
        throw "No way to construct gene within allowed depth.";
    };

    GeneBuilder.prototype.canApply = function(type, depth) {
        if (depth > 0) {
            var matching = this.context.findFunctionReturning(type);
            for (var m = 0; m < matching.length; ++m) {
                var match = matching[m];
                if (this.canInvoke(match.type, depth)) {
                    return true;
                }
            }
        }
        return false;
    };

    GeneBuilder.prototype.canInvoke = function (type, depth) {
        for (var a = 0; a < type.argumentTypes.length; ++a) {
            var argType = type.argumentTypes[a];
            if (this.canConstruct(argType)) {
                continue;
            }
            if (this.canLookup(argType)) {
                continue;
            }
            if (this.canApply(argType, depth-1)) {
                continue;
            }
        }
    };

    GeneBuilder.prototype.canLookup = function (geneType) {
        return this.context.findMatching(geneType).length > 0;
    };

    GeneBuilder.prototype.buildBranch = function (geneType, entropy) {
        var predicate = this.buildItem(SLUR_TYPES.Primitives.BOOL, entropy),
            thenGene = this.buildItem(geneType, entropy),
            elseGene = this.buildItem(geneType, entropy);
        return new GENES.IfGene(geneType, predicate, thenGene, elseGene);
    };

    GeneBuilder.prototype.buildDemaybe = function (geneType, entropy) {
        var name = entropy.alphaString(3),
            maybeGene = null;
        // Check if we built a null directly, and if so, reject it.
        do {
            maybeGene = this.buildItem(new SLUR_TYPES.Maybe(geneType), entropy);
        } while(maybeGene.type.equals(SLUR_TYPES.Primitives.NULL));
        // If we didn't build a maybe, then just return the gene,
        // rather then forcing the issue.
        if (!(SLUR_TYPES.isMaybe(maybeGene.type))) {
            return maybeGene;
        }
        var concreteGene = this.buildItem(geneType, entropy);
        return new GENES.DemaybeGene(maybeGene, concreteGene, name);
    };

    GeneBuilder.prototype.buildPassMaybe = function (geneType, entropy) {
        var func = this.buildInvokeable(geneType, entropy),
            args = [],
            addedMaybe = false;
        for (var i = 0; i < func.argumentTypes.length; ++i) {
            var type = argumentTypes[i];
            if (!(SLUR_TYPES.isMaybe(type) || type.equals(SLUR_TYPES.Primitives.NULL))) {
                type = new SLUR_TYPES.Maybe(type);
                addedMaybe = true;
            }
            args[i] = this.buildItem(type, entropy);
        }
        if (addedMaybe) {
            return new GENES.PassMaybeGene(geneType, func, args, entropy.alphaString(3));
        } else {
            return new GENES.ApplicationGene(func, args);
        }
    };

    GeneBuilder.prototype.buildApplication = function (geneType, entropy) {
        var func = this.buildInvokeable(geneType, entropy),
            args = [];
        for (var i = 0; i < func.argumentTypes.length; ++i) {
            args[i] = this.buildItem(func.argumentTypes[i], entropy);
        }
        return new GENES.ApplicationGene(func, args);
    };

    GeneBuilder.prototype.buildInvokeable = function (geneType, entropy) {
        var matching = this.context.findFunctionReturning(geneType);
        if (matching.length === 0) {
            throw "Expected matching";
        }
        var func = entropy.randomElement(matching);
        return new GENES.LookupGene(SLUR_TYPES.makeParametersUnique(func.type), func.symbol.name, entropy.randomSeed());
    };

    GeneBuilder.prototype.lookup = function (geneType, entropy) {
        var matching = this.context.findMatching(geneType);
        if (matching.length === 0) {
            return null;
        }
        var symbol = entropy.randomElement(matching);
        return new GENES.LookupGene(geneType, symbol.name, entropy.randomSeed());
    };

    GeneBuilder.prototype.constructItem = function (geneType, entropy) {
        while (SLUR_TYPES.isParameter(geneType)) {
            geneType = this.typeBuilder.createConstructableType(entropy);
        }

        var P = SLUR_TYPES.Primitives;

        if (geneType.equals(P.FIX_NUM)) {
            return this.buildFixnum(entropy);
        } else if (geneType.equals(P.REAL)) {
            return this.buildReal(entropy);
        } else if (geneType.equals(P.BOOL)) {
            return this.buildBool(entropy);
        } else if (geneType.equals(P.NULL)) {
            return new GENES.NullGene();
        } else if (geneType.equals(P.BOOLEAN)) {
            return new GENES.TrueGene();
        } else if (geneType.equals(P.STRING)) {
            return this.buildString(entropy);
        } else if (geneType.equals(P.SYMBOL)) {
            return this.buildSymbol(entropy);
        } else if (SLUR_TYPES.isConsType(geneType)) {
            return this.buildCons(geneType,entropy);
        } else if (SLUR_TYPES.isListType(geneType)) {
            return this.buildList(geneType,entropy);
        } else if (SLUR_TYPES.isMaybe(geneType)) {
            return this.buildMaybe(geneType, entropy);
        } else if (SLUR_TYPES.isFunctionType(geneType)) {
            return this.buildLambda(geneType, entropy);
        }
        throw "No matching type.";
    };

    GeneBuilder.prototype.buildMaybe = function (maybe, entropy) {
        if (this.randomizer.maybeIsNull(entropy)) {
            return new GENES.NullGene();
        }
        return this.buildItem(maybe.maybeType, entropy);
    };

    GeneBuilder.prototype.buildList = function (listType, entropy) {
        var length = this.randomizer.selectListLength(entropy),
            list = [];
        while (length > 0) {
            list.push(this.buildItem(listType.elementType, entropy));
            length -= 1;
        }
        return new GENES.ListGene(listType, list);
    };

    GeneBuilder.prototype.buildCons = function (type, entropy) {
        return new GENES.ConsGene(type, this.buildItem(type.carType, entropy), this.buildItem(type.cdrType, entropy));
    };

    GeneBuilder.prototype.buildSymbol = function (entropy) {
        return new GENES.SymbolGenerator(entropy.randomSeed(), this.randomizer.selectStringLength(entropy));
    };

    GeneBuilder.prototype.buildBool = function (entropy) {
        return new GENES.BoolGenerator(entropy.randomSeed());
    };

    GeneBuilder.prototype.buildString = function (entropy) {
        return new GENES.StringGenerator(entropy.randomSeed(), this.randomizer.selectStringLength(entropy));
    };

    GeneBuilder.prototype.buildReal = function (entropy) {
        var range = this.randomizer.selectRealRange(entropy);
        return new GENES.RealGenerator(entropy.randomSeed(),  range);
    };

    GeneBuilder.prototype.buildFixnum = function (entropy) {
        var range = this.randomizer.selectFixnumRange(entropy);
        return new GENES.RealGenerator(entropy.randomSeed(),  range);
    };

    GeneBuilder.prototype.buildFunction = function (type, name, entropy) {
        var allowTypes = [];
        for (var a = 0; a < type.argumentTypes.length; ++a) {
            type.argumentTypes[a].findConcrete(allowTypes);
        }
        this.typeBuilder.allowDependentTypes(allowTypes);
        try {
            return this.buildFunctionGene(type, entropy, name, false);
        } finally {
            this.typeBuilder.clearDependentTypes();
        }
    };

    GeneBuilder.prototype.pushArguments = function (names, types) {
        for (var i = 0; i < names.length; ++i) {
            this.context.pushSymbol(names[i], types[i]);
        }
    };

    GeneBuilder.prototype.buildFunctionGene = function (type, entropy, name, isLambda) {
        var names = GENES.functionArgumentNames(type, name);
        this.pushArguments(names, type.argumentTypes);

        var body = this.buildItem(type.returnType, entropy),
            result = new GENES.FunctionGene(type, name, body, isLambda);

        this.context.popSymbols(names.length);
        return result;
    };

    GeneBuilder.prototype.buildLambda = function (type, entropy) {
        return this.buildFunctionGene(type, entropy, "l" + entropy.alphaString(5), true);
    };

    function GenomeBuilder(registry, typeBuilder, randomizer) {
        this.registry = registry;
        this.typeBuilder = typeBuilder;
        this.randomizer = randomizer;
    }

    GenomeBuilder.prototype.buildGenomeStructure = function (target, entropy) {
        this.typeBuilder.allowAllConstrained();
        try {
            var structureSize = this.randomizer.selectGenomeSize(entropy),
                structure = [];
            for (var i = 0; i < structureSize - 1; ++i) {
                structure[i] = this.buildChromosomeStructure(entropy);
            }

            structure.push({ name: "crTarget", geneTypes: [target] });
            return structure;
        } finally {
            this.typeBuilder.clearDependentTypes();
        }
    };

    GenomeBuilder.prototype.build = function (genomeStructure, entropy) {
        var genome = new Genome(),
            context = new GENES.Context(this.registry),
            geneBuilder = new GeneBuilder(this.typeBuilder, this.randomizer, context);
        for (var c = 0; c < genomeStructure.length; ++c) {
            genome.add(this.buildChromosome(context, geneBuilder, genomeStructure[c], entropy));
        }
        return genome;
    };

    GenomeBuilder.prototype.buildChromosomeStructure = function (entropy) {
        var structure = {
                name: "cr" + entropy.alphaString(5),
                geneTypes: []
            },
            length = this.randomizer.selectChromosomeLength(entropy);
        for (var i = 0; i < length; ++i) {
            var returnType = this.typeBuilder.createType(entropy);
            structure.geneTypes[i] = this.typeBuilder.createFunction(returnType, entropy);
        }
        return structure;
    };

    GenomeBuilder.prototype.buildChromosome = function (context, geneBuilder, structure, entropy) {
        var chromosome = new Chromosome(structure.name);
        context.addChromosome(chromosome);
        for (var g = 0; g < structure.geneTypes.length; ++g) {
            chromosome.add(geneBuilder.buildFunction(structure.geneTypes[g], chromosome.nextGeneName(), entropy));
        }
        return chromosome;
    };

    function MutationProbabilities() {
        this.mutateTopLevel = 0.5;
        this.mutateSeed = 1/25.0;
        this.mutateStringLength = 1/25.0;
        this.mutateSymbolLength = 1/25.0;
        this.mutateListLength = 1/25.0;
        this.mutateSwapListItems = 1/25.0;
        this.mutateReorderList = 1/25.0;
        this.mutateFixnumRange = 1/25.0;
        this.mutateRealRange = 1/25.0;
        this.replaceSubgene = 1/25.0;

        this.mutateAddGene = 1/250.0;
        this.mutateSkipChromosome = 1/1000.0;
        this.mutateAddChromosome = 1/1000.0;
        this.mutateAddTargetChromosome = 1/5000.0;
    }

    function Mutation(probabilities, typeBuilder, randomizer) {
        this.probabilities = probabilities;
        this.typeBuilder = typeBuilder;
        this.randomizer = randomizer;
    }

    Mutation.prototype.mutateTopLevelGene = function (entropy) {
        return entropy.select(this.probabilities.mutateTopLevel);
    };

    Mutation.prototype.mutateSeed = function (entropy) {
        return entropy.select(this.probabilities.mutateSeed);
    };

    Mutation.prototype.mutateStringLength = function (entropy) {
        return entropy.select(this.probabilities.mutateStringLength);
    };

    Mutation.prototype.newStringLength = function (length, entropy) {
        var mutateType = entropy.randomInt(0, 5);
        if (mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if (mutateType < 4) {
            return length + 1;
        }
        return this.randomizer.selectStringLength(entropy);
    };

    Mutation.prototype.mutateStringLength = function (entropy) {
        return entropy.select(this.probabilities.mutateSymbolLength);
    };

    Mutation.prototype.newSymbolLength = function (length, entropy) {
        var mutateType = entropy.randomInt(0, 5);
        if (mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if (mutateType < 4) {
            return length + 1;
        }
        return this.randomizer.selectStringLength(entropy);
    };

    Mutation.prototype.replaceSubgene = function (entropy) {
        return entropy.select(this.probabilities.replaceSubgene);
    };

    Mutation.prototype.createNewGene = function (type, context, entropy) {
        var builder = new GeneBuilder(this.typeBuilder, this.randomizer, context);
        return builder.buildItem(type, entropy);
    };

    Mutation.prototype.mutateGene = function (type, gene, context, entropy) {
        if (this.replaceSubgene(entropy)) {
            return this.createNewGene(type, context, entropy);
        } else {
            gene.mutate(this, context, entropy);
            return gene;
        }
    };

    Mutation.prototype.reorderList = function (entropy) {
        return entropy.select(this.probabilities.mutateReorderList);
    };

    Mutation.prototype.mutateListLength = function (entropy) {
        return entropy.select(this.probabilities.mutateListLength);
    };

    Mutation.prototype.newListLength = function (length, entropy) {
        var mutateType = entropy.randomInt(0, 5);
        if (mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if (mutateType < 4) {
            return length + 1;
        }
        return this.randomizer.selectListLength(entropy);
    };

    Mutation.prototype.swapListItems = function (entropy) {
        return entropy.select(this.probabilities.mutateSwapListItems);
    };

    Mutation.prototype.mutateFixnumRange = function (entropy) {
        return entropy.select(this.probabilities.mutateFixnumRange);
    };

    Mutation.prototype.newFixnumRange = function (range, entropy) {
        var min = range.min,
            max = range.max,
            mutateType = entropy.randomInt(0, 5),
            rangeSizeDelta = entropy.randomInt(0, 20);
        if (mutateType === 0) {
            min = min - rangeSizeDelta;
        } else if (mutateType === 1) {
            min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
        } else if (mutateType === 2) {
            max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
        } else if (mutateType === 3) {
            max = max + rangeSizeDelta;
        } else {
            return this.randomizer.selectFixnumRange(entropy);
        }
        return { min: min, max: max };
    };

    Mutation.prototype.mutateRealRange = function (entropy) {
        return entropy.select(this.probabilities.mutateRealRange);
    };

    Mutation.prototype.newRealRange = function (range, entropy) {
        var min = range.min,
            max = range.max,
            mutateType = entropy.randomInt(0, 5),
            rangeSizeDelta = entropy.randomInt(0, 20);
        if (mutateType === 0) {
            min = min - rangeSizeDelta;
        } else if (mutateType === 1) {
            min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
        } else if (mutateType === 2) {
            max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
        } else if (mutateType === 3) {
            max = max + rangeSizeDelta;
        } else {
            return this.randomizer.selectRealRange(entropy);
        }
        return { min: min, max: max };
    };

    Mutation.prototype.newSeed = function (seed, entropy) {
        var mutateType = entropy.randomInt(0, 5);
        if (mutateType < 2) {
            return Math.max(1, seed - 1);
        }
        if (mutateType < 4) {
            return Math.min(seed + 1, ENTROPY.MAX_SEED);
        }
        return entropy.randomSeed();
    };

    Mutation.prototype.skipChromosome = function (entropy) {
        return entropy.select(this.probabilities.mutateSkipChromosome);
    };

    Mutation.prototype.addChromosome = function (entropy) {
        return entropy.select(this.probabilities.mutateAddChromosome);
    };

    Mutation.prototype.createChromosome = function (context, entropy) {
        var builder = new GeneBuilder(this.typeBuilder, this.randomizer, context),
            chromosomeLength = this.randomizer.selectChromosomeLength(entropy),
            chromosome = new Chromosome("crA_" + entropy.alphaString(5));
        context.addChromosome(chromosome);
        for (var i = 0; i < chromosomeLength; ++i) {
            this.typeBuilder.allowAllConstrained();
            var returnType = this.typeBuilder.createType(entropy);
            this.typeBuilder.clearDependentTypes();
            var func = this.typeBuilder.createFunction(returnType, entropy);
            chromosome.addGene(builder.buildFunction(func, chromosome.nextGeneName(), entropy));
        }
        return chromosome;
    };

    Mutation.prototype.addTargetChromosome = function (entropy) {
        return entropy.select(this.probabilities.mutateAddTargetChromosome);
    };

    Mutation.prototype.createChromosome = function (context, entropy, target) {
        var builder = new GeneBuilder(this.typeBuilder, this.randomizer, context),
            chromosome = new Chromosome("crT_" + entropy.alphaString(5));
        chromosome.addGene(builder.buildFunction(target, chromosome.nextGeneName(), entropy));
        return chromosome;
    };

    Mutation.prototype.addGene = function (entropy) {
        return entropy.select(this.probabilities.mutateAddGene);
    };

    Mutation.prototype.createGene = function (context, name, entropy) {
        var builder = new GeneBuilder(this.typeBuilder, this.randomizer, context);
        this.typeBuilder.allowDependentTypes(context.findConcreteTypes());
        var returnType = this.typeBuilder.createType(entropy);
        this.typeBuilder.clearDependentTypes();
        var type = this.typeBuilder.createFunction(returnType, entropy);
        return builder.buildFunction(type, name, entropy);
    };

    function Mutator(mutation) {
        this.mutation = mutation;
    }

    Mutator.prototype.mutate = function (genome, registry, allowMacroMutation, entropy, target) {
        var context = new GENES.Context(registry),
            isMutated = false,
            mutated = new Genome(),
            addChromosome = allowMacroMutation && this.mutation.addChromosome(entropy),
            i = 0;

        for (var c = 0; c < genome.chromosomes.length; ++c) {
            i += 1;
            var chromosome = genome.chromosomes[c],
                isLast = i === genome.chromosomes.length,
                skipChromosome = !isLast && allowMacroMutation && this.mutation.skipChromosome(entropy);
            if (isLast && addChromosome) {
                mutated.add(this.mutation.createChromosome(context, entropy));
                isMutated = true;
            }
            if (!skipChromosome) {
                context.addChromosome(chromosome);
                var mutatedChromosome = this.mutateChromosome(chromosome, context, isLast, allowMacroMutation, entropy);
                mutated.add(mutatedChromosome);
                if (mutatedChromosome != chromosome) {
                    isMutated = true;
                }
            } else {
                isMutated = true;
            }
        }

        if (allowMacroMutation && this.mutation.addTargetChromosome(entropy)) {
            isMutated = true;
            mutated.add(this.mutation.createChromosome(context, entropy, target));
        }

        if (isMutated) {
            return mutated;
        } else {
            return genome;
        }
    };

    Mutator.prototype.mutateChromosome = function (chromosome, context, isLast, allowMacroMutation, entropy) {
        var isMutated = false,
            mutated = new Chromosome(chromosome.name),
            genes = chromosome.namedGenes();
        for (var g = 0; g < genes.length; ++g) {
            var gene = genes[g];
            if (this.mutation.mutateTopLevelGene(entropy)) {
                var mutatedGene = gene.gene.mutate(this.mutation, context, entropy);
                mutated.addGene(mutatedGene);
                if (gene != mutatedGene) {
                    isMutated = true;
                }
            } else {
                mutated.addGene(gene.gene);
            }
        }
        if (!isLast && allowMacroMutation && this.mutation.addGene(entropy)) {
            mutated.addGene(this.mutation.createGene(context, mutated.nextGeneName(), entropy));
            isMutated = true;
        }
        if (isMutated) {
            return mutated;
        } else {
            return chromosome;
        }
    };

    function breedChromosomes(a, b, entropy) {
        if (a.name != b.name) {
            if (entropy.flip()) {
                return a;
            } else {
                return b;
            }
        }
        var result = new Chromosome(a.name),
            i = 0,
            j = 0;
        while(i < a.genes.length && j < b.genes.length) {
            var useA = entropy.flip(),
                aGene = a.genes[i],
                bGene = b.genes[j];
            if (aGene.type.equals(bGene.type)) {
                if (useA) {
                    result.addGene(aGene);
                } else {
                    result.addGene(bGene);
                }
            } else if ((a.genes.length > i+1) && a.genes[i+1].type.equals(bGene.type)) {
                result.addGene(aGene);
                if (useA) {
                    result.addGene(a.genes[i+1]);
                } else {
                    result.addGene(bGene);
                }
                i += 1;
            } else if ((b.genes.length > j+1) && aGene.type.equals(b.genes[j+1].type)) {
                result.addGene(bGene);
                if (useA) {
                    result.addGene(aGene);
                } else {
                    result.addGene(b.genes[j+1]);
                }
                j += 1;
            } else {
                if (useA) {
                    result.addGene(aGene);
                } else {
                    result.addGene(bGene);
                }
            }
            i += 1;
            j += 1;
        }
        return result;
    }

    // Given two Genomes, produce an offspring
    function breedGenomes(a, b, target, entropy) {
        // Avoid making the problem O(n*n) by creating a hash of one set of chromosomes
        // Assume all 'a' chromosomes unpaired to start with.
        var aUnpaired = {};
        for (var c = 0; c  < a.chromosomes.length; ++c) {
            var aChromo = a.chromosomes[c];
            aUnpaired[aChromo.name()] = aChromo;
        }

        var bUnpaired = [], // Keep track of the chromosomes in b which we haven't paired.
            child = [],
            crTarget = null; // Keep track of the last chromosome matching the target.

        for (c = 0; c < b.chromosomes.length; ++c) {
            var bChromo = b.chromosomes[c],
                pair = aUnpaired[bChromo.name];
            if (pair) {
                var matchedPair = breedChromosomes(pair, bChromo, entropy);
                if (matchedPair.findLastMatching(target) !== null) {
                    crTarget = matchedPair;
                }
                child.push(matchedPair);

                // If we found a matching one in a, then it is now paired.
               delete aUnpaired[pair.name];
            } else {
                // If we didn't find a matching one in a, then the b one is marked as unpaired.
                bUnpaired.push(chromosome);
            }
        }
        if (bUnpaired.length > 0) {
            // Pair unpaired ones in order.
            for (c = 0; c < bUnpaired.length; ++c) {
                var unpaired = bUnpaired[c],
                    matched = null;

                // Retrieve the next unpaired a chromosome
                for (var name in aUnpaired) {
                    if (!aUnpaired.hasOwnProperty(name)) {
                        matched = aUnpaired[name];
                        delete aUnpaired[name];
                    }
                }

                if (matched === null) {
                    if (unpaired.findLastMatching(target) !== null) {
                        crTarget = unpaired;
                    }
                    child.push(unpaired);
                } else {
                    var resultChromosome = breedChromosomes(unpaired, match, entropy);
                    if (unpaired.findLastMatching(target) !== null) {
                        crTarget = resultChromosome;
                    }
                    child.push(resultChromosome);
                }
            }
        }
        var result = new Genome();
        // Make sure that a chromosome matching the target is last, by skipping it as we add, then
        // adding it explicitly afterwards.
        for (c = 0; c < child.length; ++c) {
            if (child[c] != crTarget) {
                result.add(child[c]);
            }
        }
        if (crTarget === null) {
            throw new RuntimeException("No target!");
        }
        result.add(crTarget);
        return result;
    }

    function phenomeToString(phenes) {
        var result = "";
        for (var p = 0; p < phenes.length; ++p) {
            var phene = phenes[p];
            result += phene.name;
            result += " = ";
            result += phene.expression.toString();
            result += "\n";
        }
        return result;
    }

    function Task(genome, seed) {
        this.genome = genome;
        this.startTime = null;
        this.score = 0;
        this.env = null;
        this.entryPoint = null;
        this.runFrame = null;
        this.iterations = 0;
        this.seed = seed;
        this.errors = [];
    }

    Task.prototype.failExpress = function (error) {
        this.errors.push("Expression failed: " + error);
    };

    Task.prototype.checkTime = function (allowedTime) {
        if (this.startTime !== null && (TIMING.now() - this.startTime) > allowedTime) {
            this.runFrame.abort = "Evaluation time exceeded";
        }
    };

    Task.prototype.abort = function (reason) {
        if (this.runFrame !== null) {
            this.runFrame.abort = reason;
        }
    };

    Task.prototype.updateScore = function (score) {
        if (this.startTime !== null) {
            this.startTime = null;
            this.runFrame = null;
            this.score += score;
            this.iterations += 1;
        }
    };

    Task.prototype.fail = function (error) {
        this.errors.push("Execution failed: " + error);
        this.updateScore(-1);
    };

    Task.prototype.expressFailed = function () {
        return this.env === null && errors.length > 0;
    };

    Task.prototype.done = function (iterationCount) {
        return this.expressFailed() || this.iterations >= iterationCount;
    };

    Task.prototype.evaluation = function (iterationCount) {
        var finalScore = 0;
        if (this.env === null) {
            finalScore = -2 * iterationCount;
        } else if (this.iterations > 0) {
            finalScore = this.score / this.iterations;
        }
        return { score: finalScore, genome: this.genome };
    };

    Task.prototype.evaluate = function (runner) {
        if (this.env === null) {
            return null;
        }
        var entropy = new ENTROPY.Entropy(this.seed);
        this.seed = entropy.randomSeed();
        this.runFrame = new SLUR.Frame(this.env, "RunFrame");
        this.startTime = TIMING.now();

        try {
            var score = runner.run(this.runFrame, this.entryPoint, entropy);
            this.updateScore(score);
        } catch(e) {
            this.fail(e);
        }
    };

    Task.prototype.express = function (runner) {
        try {
            var context = new GENES.Context(runner.registry),
                phenome = genome.express(context),
                env = this.bind(phenome, runner),
                entryPoint = genome.findLastMatching(runner.targetType);
            if (entryPoint === null) {
                throw "Target not found";
            }
            this.env = env;
            this.entryPoint = entryPoint;
        } catch(e) {
            this.failExpress(e);
        }
    };

    Task.prototype.bind = function (phenome, runner) {
        function isDefine (expression) {
            if (SLUR.isCons(expression)) {
                if (SLUR.isSymbol(expression.car)) {
                    if (expression.car.name === "define") {
                        return true;
                    }
                }
            }
            return false;
        }

        var env = new SLUR.Frame(runner.environment, "expressFrame");
        for (var p = 0; p < phenome.length; ++p) {
            var phene = phenome[p],
                result = phene.expression.compile(env);
            result = result.eval(env);
            if (!isDefine(phene.expression)) {
                env.add(phene.name, result);
            }
        }
        return env;
    };

    Task.prototype.run = function (runner) {
        this.express(runner);

        while(!this.done(runner.iterationCount)) {
            this.evaluate(runner);
        }

        return this.evaluation(runner.iterationCount);
    };

    function evaluatePopulation(population, runner, reporter) {
        var entropy = ENTROPY.makeRandom(),
            results = [];
        for (var g = 0; g < population.length; ++g) {
            var task = new Task(population[g], entropy.randomSeed());
            results.push(task.run(runner));
            if (task.errors.length > 0) {
                for (var e = 0; e < task.errors.length; ++e) {
                    reporter.onFail(e, "Genome " + g);
                }
            }
        }

        results.sort(function (a, b) { return a.score - b.score; });
        return results;
    }

    function defaultSurvivalRatios() {
        return {
            survivalRatio: 0.1,
            mutatedSurvivorRatio: 0.4,
            mutantRatio: 0.05,
            purebreadRatio: 0.25
        };
    }

    function Darwin(typeBuilder, runner, reporter, geneRandomizer, mutator, survivalRatios) {
        this.typeBuilder = typeBuilder;
        this.runner = runner;
        this.reporter = reporter;
        this.mutator = mutator;
        this.survivalRatios = survivalRatios;
        this.stop = false;
        this.skipTargetCheck = false;
    }

    Darwin.prototype.initialPopulation = function (size, entropy) {
        this.stop = false;

        var population = new Population(this.runner.targetType),
            builder = new GenomeBuilder(this.runner.registry, this.typeBuilder, this.geneRandomizer),
            structure = builder.buildGenomeStructure(this.runner.targetType, entropy);

        this.reporter.push("Generate Population");
        for (var i = 0; i < size && !this.stop; ++i) {
            this.reporter.updateProgress(i, size);
            try {
                population.add(builder.build(structure, random));
            } catch(e) {
                this.reporter.onFail(e, "Generating population: ");
                --i;
            }
        }
        this.reporter.pop();

        return population;
    };

    Darwin.prototype.nextPopulation = function (evaluated, entropy) {
        try {
            var count = evaluated.length,
                survivors = Math.max(Math.floor(count * this.survivalRatios.survivalRatio), 1),
                mutatedSurvivors = Math.floor(count * this.survivalRatios.mutatedSurvivorRatio),
                mutants = Math.floor(count * this.survivalRatios.mutantRatio),
                offspringCount = Math.max(count - (survivors + mutatedSurvivors + mutants), 0);

            this.reporter.push("Breading/mutating");

            this.reporter.updateProgress(0, 4);
            var next = this.breedPopulation(evaluated, offspringCount, survivors, random);

            this.reporter.updateProgress(1, 4);
            for (var s = 0; s < survivors; ++s) {
                next.push(evaluated[s].genome);
            }

            this.reporter.updateProgress(2, 4);
            try {
                this.reporter.push("Mutating Survivors");
                for (var m = 0; m < mutatedSurvivors; ++m) {
                    var mutantSurvivor = this.mutate(evaluated[entropy.randomInt(0, survivors)].genome, entropy);
                    next.push(mutantSurvivor);
                    this.reporter.updateProgress(i, mutatedSurvivors);
                }
            } finally {
                this.reporter.pop();
            }

            this.reporter.updateProgress(3, 4);
            try {
                this.reporter.push("Mutating");
                for (var i = 0; i < mutants; ++i) {
                    var mutant = this.mutate(entropy.randomElement(evaluated).genome, entropy);
                    next.push(mutant);
                    this.reporter.updateProgress(i, mutants);
                }
            } finally {
                this.reporter.pop();
            }

            return next;
        } finally {
            this.reporter.pop();
        }
    };

    Darwin.prototype.breedPopulation = function (evaluated, count, selectFrom, entropy) {
        var purebreads = Math.floor(this.survivalRatios.purebreadRatio * count),
            offspring = new Population(this.runner.targetType);
        try {
            this.reporter.push("Breeding");
            for (var i = 0; i < count; ++i) {
                var parentA = this.selectParent(evaluated, selectFrom, entropy),
                    parentB = this.selectParent(evaluated, selectFrom, entropy),
                    child = breedGenomes(parentA, parentB, this.runner.targetType, entropy);
                if (i > purebreads) {
                    child = this.mutate(child, entropy);
                }
                offspring.add(child);
            }
        } finally {
            this.reporter.pop();
        }
        return offspring;
    };

    Darwin.prototype.mutate = function (genome, entropy) {
        var mutated = null;
        do {
            try {
                mutated = mMutator.mutate(genome, mObjectRegistry, true, entropy, target());
                if (!this.skipTargetCheck && mutated.findLastMatching(this.runner.targetType) === null) {
                    throw "No matching target.";
                }
            } catch(e) {
                console.log("Failure during mutation: " + e);
                this.reporter.notify("Failure during mutation.");
            }
        } while (mutated === null);
        return mutated;
    };

    Darwin.prototype.selectParent = function (evaluated, selectFrom, entropy) {
        var selected = random.nextInt(selectFrom),
            selection = evaluated.get(selected);
        return selection.genome;
    };

    Darwin.prototype.evolve = function (population, generations, entropy) {
        if (!population.isTarget(this.runner.targetType)) {
            this.reporter.notify("Incompatible population.");
            return null;
        }
        var best = null,
            i = 0;
        this.reporter.updateProgress(0, generations);
        do {
            try {
                this.reporter.push("Generation " + i);
                this.reporter.updateProgress(0, 2);

                var evaluated = null;
                try {
                    this.reporter.push("Evaluating");
                    evaluated = evaluatePopulation(population, this.runner, this.reporter);
                    if (this.stop) {
                        // If we were stopped during evaluation, evaluate will return null
                        // So for simplicity, just jump out here.
                        return best;
                    }
                    var currentBest = evaluated[0];
                    if (best === null || currentBest.score > best.score) {
                        best = currentBest;
                        this.reporter.updateBest(best);
                    }
                    this.reporter.currentPopulation(evaluated);
                    if (best.score == mRunner.maxScore) {
                        // If we've hit the max score, we'll never replace it, so stop now.
                        return best;
                    }
                } finally {
                    this.reporter.pop();
                }

                this.reporter.updateProgress(1, 2);
                do {
                    population = this.nextPopulation(evaluated, entropy);
                } while(population === null);
            } finally {
                this.reporter.pop();
            }
            ++i;
            this.reporter.updateProgress(i, generations);
        } while(i < generations && !this.stop);
        return best;
    };

    Darwin.prototype.abort = function () {
        this.stop = true;
        this.reporter.notify("Aborting...");
    };

/*
public interface Runner {
    public ObjectRegistry registry();

    public Environment environment();

    // For efficiency this method should not be 'synchronized', and thus it would be best
    // if it was 'purely functional' - ie, doesn't used any mutable instance or static fields.
    public double run(Environment env, Symbol target, Random random);
    public FunctionType targetType();
    public double maxScore();

    public List<TypeBuilder.Constraint> typeConstraints();

    public long timeoutInterval();

    public int iterations();
}

public interface Reporter {
    void onFail(Throwable ex, String context);
    void notify(String message);
    void updateBest(Evaluation eval);
    void updateProgress(int current, int total);
    void push(String name);
    void pop();
    void currentPopulation(List<Evaluation> evaluated);
}
*/

    function testSuite() {
        var P = SLUR_TYPES.Primitives;
        
        var typeBuilderTests = [
            function testCreate() {
                var builder = new TypeBuilder(false, new TypeProbabilities()),
                    entropy = new ENTROPY.Entropy(1);

                for (var i = 0; i < 1000; ++i) {
                    var type = builder.createType(entropy);
                    TEST.notNull(type);
                }
            },
            function testCreateFunction() {
                var builder = new TypeBuilder(false, new TypeProbabilities()),
                    entropy = ENTROPY.makeRandom();

                for (var i = 0; i < 100; ++i) {
                    var r = builder.createType(entropy);
                    TEST.notNull(r);
                    var rFunc = builder.createFunction(r, entropy);
                    TEST.notNull(rFunc);
                }
            },
            function testCreateParameterized() {
                var builder = new TypeBuilder(true, new TypeProbabilities()),
                    entropy = ENTROPY.makeRandom(),
                    someParameter = false;
                for (var i = 0; i < 2000; ++i) {
                    var type = builder.createType(entropy);
                    TEST.notNull(type);
                    if (type.isParameterized()) {
                        someParameter = true;
                    }
                }
                TEST.isTrue(someParameter);
            },
            function testCreateParameterizedFunction() {
                var builder = new TypeBuilder(true, new TypeProbabilities()),
                    entropy = ENTROPY.makeRandom(),
                    someParameter = false;

                for (var i = 0; i < 1000; ++i) {
                    var r = builder.createType(entropy);
                    TEST.notNull(r);
                    var rFunc = builder.createFunction(r, entropy);
                    TEST.notNull(rFunc);
                    if (rFunc.isParameterized()) {
                        someParameter = true;
                    }
                }
                TEST.isTrue(someParameter);
            }
        ];

        function expressTest(reg, chromosome) {
            var context = new GENES.Context(reg);
            context.addChromosome(chromosome);
            var phenes = chromosome.express(context);
            TEST.notNull(phenes);
            TEST.isTrue(phenes.length > 0);
            for (var p = 0; p < phenes.length; ++p) {
                var phene = phenes[p];
                TEST.notNull(phene);
                TEST.notNull(phene.name);
                TEST.notNull(phene.expression);
            }
        }
        
        function Helper() {
            this.reg = new SLUR_TYPES.Registry();
            SLUR_TYPES.registerBuiltins(this.reg);
            var typeBuilder = new TypeBuilder(true, new TypeProbabilities());
            this.builder = new GenomeBuilder(this.reg, typeBuilder, new GeneRandomizer(new GeneProbabilities()));
        }
        
        Helper.prototype.buildStructure = function (target, entropy) {
            return this.builder.buildGenomeStructure(target, entropy);
        };
        
        Helper.prototype.build = function (structure, entropy) {
            return this.builder.build(structure, entropy);
        };
        
        Helper.prototype.express = function (genome) {
            var context = new GENES.Context(this.reg);
            return genome.express(context);
        };

        var geneBuilderTests = [
            function testBuildFunction() {
                var baseSeed = new ENTROPY.makeRandom().randomSeed(),
                    testEntropy = new ENTROPY.Entropy(baseSeed),
                    reg = new SLUR_TYPES.Registry(),
                    c = new Chromosome(testEntropy.alphaString(5)),
                    TEST_COUNT = 20;

                SLUR_TYPES.registerBuiltins(reg);

                for (var i = 0; i < TEST_COUNT; ++i) {
                    var seed = testEntropy.randomSeed(),
                        entropy = new ENTROPY.Entropy(seed),
                        typeBuilder = new TypeBuilder(true, new TypeProbabilities()),
                        context = new GENES.Context(reg);
                    context.addChromosome(c);

                    var randomizer = new GeneRandomizer(new GeneProbabilities()),
                        geneBuilder = new GeneBuilder(typeBuilder, randomizer, context),
                        returnType = typeBuilder.createType(entropy),
                        funcType = typeBuilder.createFunction(returnType, entropy),
                        gene = geneBuilder.buildFunction(funcType, c.nextGeneName(), entropy);

                    TEST.notNull(gene);
                    c.add(gene);
                    var obj = gene.express(context);
                    TEST.notNull(obj);
                }
                expressTest(reg, c);
            },
            function testBuildStructure() {
                var entropy = ENTROPY.makeRandom(),
                    helper = new Helper(),
                    target = new SLUR_TYPES.FunctionType(P.FIX_NUM, [P.FIX_NUM]),
                    structure = helper.buildStructure(target, entropy);
                TEST.notNull(structure);
                TEST.isTrue(structure.length > 1);
                for (var i = 0; i < structure.length; ++i) {
                    var cs = structure[i];
                    TEST.notNull(cs);
                    TEST.notNull(cs.name);
                    TEST.notNull(cs.geneTypes);
                    TEST.isTrue(cs.geneTypes.length > 0);
                    for (var j = 0; j < cs.geneTypes.length; ++j) {
                        TEST.notNull(cs.geneTypes[j]);
                    }
                }
            },
            function testBuild() {
                var entropy = ENTROPY.makeRandom(),
                    helper = new Helper(),
                    target = new SLUR_TYPES.FunctionType(P.FIX_NUM, [P.FIX_NUM]),
                    structure = helper.buildStructure(target, entropy),
                    genome = helper.build(structure, entropy);
                TEST.notNull(genome);
                var phenome = helper.express(genome);
                TEST.notNull(phenome);
                TEST.isTrue(phenome.length > 0);

                var targetSymbol = genome.findLastMatching(target);
                TEST.notNull(targetSymbol);

                var targetPhene = phenome[phenome.length - 1];
                TEST.equals(targetSymbol.name, targetPhene.name);
                TEST.notNull(targetPhene.expression);
            }
        ];

/*
public class BreederTest extends TestCase {
	static class BuildHelper {
		Helper helper = new Helper();
		FunctionType target = new FunctionType(BaseType.FIX_NUM, new Type[]{BaseType.FIX_NUM});
		Genome genomeA;
		Genome genomeB;

		public BuildHelper(Random random)
		{
			ChromosomeStructure[] structure = helper.buildStructure(target, random);
			genomeA = helper.build(structure, random);
			genomeB = helper.build(structure, random);
		}
	}

	public void testBreedChromosome() {
		Random random = new Random();
		BuildHelper h = new BuildHelper(random);
		Chromosome a = h.genomeA.chromosomes().get(0);
		Chromosome b = h.genomeB.chromosomes().get(0);
		Chromosome offspring = Breeder.breed(a, b, random);

		TEST.notNull(offspring);
		TEST.isEquals(a.genes().length, offspring.genes().length);
		for (int i = 0; i < a.genes().length; ++i) {
			TEST.isEquals(a.genes()[i].gene.type(), offspring.genes()[i].gene.type());
		}
	}

	public void testBreedGenome() {
		Random random = new Random();
		BuildHelper h = new BuildHelper(random);
		Genome offspring = Breeder.breed(h.genomeA, h.genomeB, h.target, random);

		TEST.notNull(offspring);
		TEST.isEquals(h.genomeA.chromosomes().size(),offspring.chromosomes().size());
		for (int i = 0; i < offspring.chromosomes().size(); ++i) {
			TEST.isEquals(h.genomeA.chromosomes().get(i).genes().length,offspring.chromosomes().get(i).genes().length);
		}
	}
}

public class DarwinTest extends TestCase {
	interface TargetFunction {
		int target(int x);
	}

	static class TestRunner implements Runner {
		private ObjectRegistry mObjectReg;
		private FunctionType mTarget;
		private TargetFunction mFunc;

		TestRunner(TargetFunction func) {
			mObjectReg = new ObjectRegistry();
			BuiltinRegistrar.registerBuiltins(mObjectReg);
			mTarget = new FunctionType(BaseType.FIX_NUM, new Type[]{BaseType.FIX_NUM});
			mFunc = func;
		}

		public ObjectRegistry registry() {
			return mObjectReg;
		}

		public Environment environment() {
			return Initialize.init();
		}

		public String viewExpression(Genome genome) {
			Context context = new GENES.Context(mObjectReg);
			List<Phene> expressions = genome.express(context);
			StringBuilder result = new StringBuilder();
			for (Phene expression : expressions) {
				result.append(expression.name + " = ");
				result.append(expression.expression.toString());
				result.append('\n');
			}
			return result.toString();
		}

		public double run(Environment env, Symbol target, Random random) {
			int number = random.nextInt(20);
			Cons application = Cons.list(target, new FixNum(number));
			Obj result = application.eval(env);
			if (result instanceof FixNum) {
				int resultValue = ((FixNum)result).value();
				if (resultValue == mFunc.target(number)) {
					return maxScore();
				}
			}
			return 0;
		}

		public FunctionType targetType() {
			return mTarget;
		}

		public double maxScore() {
			return 1.0;
		}

		public int iterations() {
			return 5;
		}

		public long timeoutInterval() {
			return 1000;
		}

		public List<TypeBuilder.Constraint> typeConstraints() {
			return new java.util.ArrayList<TypeBuilder.Constraint>();
		}
	}

	// Evolve a program which returns it's first argument.
	public void testSimple() {
		GeneRandomizer geneRandomizer = new GeneRandomizer(new GeneRandomizer.Probabilities());

		TypeBuilder builder = new TypeBuilder(
			true,
			new TypeBuilder.Probabilities()
		);
		TestRunner testRunner = new TestRunner(new TargetFunction() { public int target(int x) { return x * x; }});
		Status status = new Status() {
			public void onFail(Throwable ex, String context) {}
			public void pop() {}
			public void push(String name) {}
			public void updateBest(Evaluation eval) {}
			public void updateProgress(int current, int total) {}
			public void notify(String message) {}
			public void currentPopulation(List<Evaluation> evaluated) {}
		};
		Mutator mutator = new Mutator(new Mutation(new Mutation.Probabilities(), builder, geneRandomizer));
		Darwin darwin = new Darwin(builder, testRunner, status, geneRandomizer, mutator);
		long seed = new Random().nextLong();
		Random random = new Random(seed);
		Population initialPopulation = darwin.initialPopulation(10, random);
		Evaluation best = darwin.evolve(initialPopulation, 10, random);
		TEST.isTrue(best != null);
		TEST.isTrue(best.score > 0.0);
	}
}

*/

        TEST.run("TypeBuilder", typeBuilderTests);
        TEST.run("GeneBuilder", geneBuilderTests);

    }

    testSuite();

    return {
    };
}());