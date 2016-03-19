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
    
    Geneome.prototype.express = function (context) {
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
                return new Symbol(matching.name);
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
    
    TypeProbabilities.prototype.setupDefault = function () {
        var P = SLUR_TYPES.Primitives;
            weights = [];
        weights.push({type: P.FIX_NUM, weight: 100});
        weights.push({type: P.REAL, weight: 100});
        weights.push({type: P.NULL, weight: 100});
        weights.push({type: P.TRUE, weight: 100});
        weights.push({type: P.BOOL, weight: 100});
        weights.push({type: P.STRING, weight: 100});
        return weights;
    };
    
    TypeProbabilities.prototype.functionArgCountDistribution = function () {
        var dist = new ENTROY.WeightedSet();
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
        this.builders = new ENTROY.ReweightedSet(builders);
        
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
            return builder.build(entropy);
        } finally {
            this.nesting -= 1;
            if (this.nesting === 0) {
                this.parameters.clear();
            }
        }
    };
    
    TypeBuilder.prototype.createFunction = function (returnType, entropy) {
        var clearParameters = false;
        try {
            if (this.parameters.length === 0 && SLUR_TYPES.isParamater(returnType)) {
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
        return new Maybe(type);
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
        return SLUR_TYPES.typesEqualModuloParamaters(this.target, target);
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
    
    function Context(registry) {
        this.registry = registry;
        this.chromosomes = [];
        this.symbolTable = [];
    }
    
    Context.prototype.addChromosome = function (chromosome) {
        this.chromosomes.push(chromosome);
    };
    
    Context.prototype.findMatching = function (type) {
        type = SLUR_TYPES.makeParametersUnique(type);
        var matching = this.registry.findMatch(type);
        for (var c = 0; c < this.chromosomes.length; ++c) {
            var genes = this.chromosomes[c].namedGenes();
            for (var g = 0; g < genes.length; ++g) {
                var gene = genes[g];
                if (gene.gene.type.match(type).matches()) {
                    matching.push(new SLUR.Symbol(gene.name));
                }
            }
        }
        for (var s = 0; s < this.symbolTable.length; ++s) {
            var entry = this.symbolTable[s];
            if (type.match(entry.type).matches()) {
                matching.addEntry(entry.symbol);
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
    
    Context.prototype.findFunctionReturning = function (returnType) {
        returnType = SLUR_TYPES.makeParametersUnique(returnType);
        var matching = this.registry.findFunctionReturning(returnType);
        for (var c = 0; c < this.chromosomes.length; ++c) {
            var genes = this.chromosomes[c].namedGenes();
            for (var g = 0; g < genes.length; ++g) {
                var gene = genes[g];
                if (gene.gene.type.returnType) {
                    var match = returnType.match(gene.gene.type.returnType);
                    if(match.matches()) {
                        matching.push({symbol: new SLUR.Symbol(gene.name), type: gene.gene.type.substitute(match.mappings)});
                    }
                }
            }
        }
        for (var s = 0; s < this.symbolTable.length; ++s) {
            var entry = this.symbolTable[s];
            if (entry.type.returnType) {
                var entryMatch = returnType.match(entry.type.returnType);
                if (entryMatch.matches()) {
                    matching.push({symbol: entry.symbol, type: entry.type.substitute(entryMatch.mappings)});
                }
            }
        }
    };
    
    Context.prototype.findConcreteTypes = function() {
        var result = [];
        for (var s = 0; s < this.symbolTable.length; ++s) {
            var entry = this.symbolTable[s];
            entry.type.findConcrete(result);
        }
        return result;
    };
    
/*
public class GeneRandomizer {
    public static class Probabilities implements java.io.Serializable {
        private static final long serialVersionUID = -3323802227179728259L;

        public List<Pair<BuildType,Integer>> buildTypeWeights = defaultBuildTypeWeights();
        public int[] stringLengthWeights = new int[] {0,1,3,5,10,20,10,5,3,1,1,1,1,1,1,1,1,1,1,1};
        public int[] listLengthWeights = new int[] {0,10,20,10,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1};
        public int[] chromosomeLengthWeights = new int[] {0,1,2,3,2,1};
        public int[] genomeSizeWeights = new int[] {0,1,2,3,2,1};
        public List<Pair<FixNumGenerator.Range,Integer>> fixnumRangeWeights = defaultFixnumRangeWeights();
        public List<Pair<RealGenerator.Range,Integer>> realRangeWeights = defaultRealRangeWeights();
        public double maybeIsNullProbability = .25;

        public static List<Pair<BuildType,Integer>> defaultBuildTypeWeights() {
            List<Pair<BuildType,Integer>> weights = new java.util.ArrayList<Pair<BuildType,Integer>>();
            weights.add(new Pair<BuildType,Integer>(BuildType.BRANCH, 5));
            weights.add(new Pair<BuildType,Integer>(BuildType.APPLICATION, 20));
            weights.add(new Pair<BuildType,Integer>(BuildType.CONSTRUCT,20));
            weights.add(new Pair<BuildType,Integer>(BuildType.LOOKUP,50));
            weights.add(new Pair<BuildType,Integer>(BuildType.MAYBE,1));
            return weights;
        }

        public static List<Pair<FixNumGenerator.Range,Integer>> defaultFixnumRangeWeights() {
            List<Pair<FixNumGenerator.Range,Integer>> weights = new java.util.ArrayList<Pair<FixNumGenerator.Range,Integer>>();
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,1), 1));
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,2), 2));
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,10), 4));
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(-1,1), 3));
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,20), 4));
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,100), 5));
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(0,1000), 3));
            weights.add(new Pair<FixNumGenerator.Range,Integer>(new FixNumGenerator.Range(Integer.MIN_VALUE, Integer.MAX_VALUE), 1));
            return weights;
        }

        public static List<Pair<RealGenerator.Range,Integer>> defaultRealRangeWeights() {
            List<Pair<RealGenerator.Range,Integer>> weights = new java.util.ArrayList<Pair<RealGenerator.Range,Integer>>();
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,1), 1));
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,2), 2));
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,10), 4));
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(-1,1), 3));
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,20), 4));
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,100), 5));
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(0,1000), 3));
            weights.add(new Pair<RealGenerator.Range,Integer>(new RealGenerator.Range(Double.MIN_VALUE, Double.MAX_VALUE), 1));
            return weights;
        }
    }

    private Probabilities mProbabilities = null;
    private WeightedSet<Integer> mStringLengthDistribution = null;
    private WeightedSet<Integer> mListLengthDistribution = null;
    private WeightedSet<Integer> mChromosomeLengthDistribution = null;
    private WeightedSet<Integer> mGenomeSizeDistribution = null;
    private WeightedSet<FixNumGenerator.Range> mFixnumRangeDistribution;
    private WeightedSet<RealGenerator.Range> mRealRangeDistribution;

    public GeneRandomizer(Probabilities probabilities) {
        mProbabilities = probabilities;
        mStringLengthDistribution = distribution(mProbabilities.stringLengthWeights);
        mListLengthDistribution = distribution(mProbabilities.listLengthWeights);
        mChromosomeLengthDistribution = distribution(mProbabilities.chromosomeLengthWeights);
        mGenomeSizeDistribution = distribution(mProbabilities.genomeSizeWeights);
        mFixnumRangeDistribution = new Constructor<FixNumGenerator.Range>().distribution(mProbabilities.fixnumRangeWeights);
        mRealRangeDistribution = new Constructor<RealGenerator.Range>().distribution(mProbabilities.realRangeWeights);
    }

    public int buildTypeWeight(BuildType type) {
        for (Pair<BuildType,Integer> entry : mProbabilities.buildTypeWeights) {
            if (entry.first == type) {
                return entry.second;
            }
        }
        return 0;
    }

    public int selectStringLength(Random random) {
        return mStringLengthDistribution.select(random);
    }

    public int selectListLength(Random random) {
        return mListLengthDistribution.select(random);
    }

    public boolean maybeIsNull(Random random) {
        return util.Probability.select(random, mProbabilities.maybeIsNullProbability);
    }

    public FixNumGenerator.Range selectFixnumRange(Random random) {
        return mFixnumRangeDistribution.select(random);
    }


    public RealGenerator.Range selectRealRange(Random random) {
        return mRealRangeDistribution.select(random);
    }

    public int selectChromosomeLength(Random random) {
        return mChromosomeLengthDistribution.select(random);
    }

    public int selectGenomeSize(Random random) {
        return mGenomeSizeDistribution.select(random);
    }

    static class Constructor<T> {
        public WeightedSet<T> distribution(List<Pair<T,Integer>> weights){
            return distribution(weights,null);
        }

        public WeightedSet<T> distribution(List<Pair<T,Integer>> weights, T skip){
            WeightedSet<T> dist = new WeightedSet<T>();
            for (Pair<T, Integer> entry : weights) {
                if (entry.first != skip && entry.second > 0) {
                    dist.add(entry.first, entry.second);
                }
            }
            return dist;
        }
    }

    private static WeightedSet<Integer> distribution(int[] weights) {
        WeightedSet<Integer> dist = new WeightedSet<Integer>();
        for (int i = 0; i  < weights.length; ++i) {
            int weight = weights[i];
            if (weight > 0)  {
                dist.add(i, weight);
            }
        }
        return dist;
    }
}

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

    public GeneBuilder(TypeBuilder typeBuilder, GeneRandomizer randomizer, Context context) {
        mTypeBuilder = typeBuilder;
        mRandomizer = randomizer;
        mContext = context;
    }

    boolean isConstructable(Type type) {
        return !mTypeBuilder.isConstrained(type);
    }

    public Gene buildItem(final Type geneType, Random random) {
        WeightedSet<Builder> builders = new WeightedSet<Builder>();

        if (canLookup(geneType)) {
            builders.add(new Builder() {
                public Gene build(Random random) {
                    return lookup(geneType, random);
                }},
                mRandomizer.buildTypeWeight(BuildType.LOOKUP)
          );
        }

        if (isConstructable(geneType)) {
            builders.add(new Builder() {
                public Gene build(Random random) {
                    return constructItem(geneType, random);
                }},
                mRandomizer.buildTypeWeight(BuildType.CONSTRUCT)
          );
        }

        if (canApply(geneType, mDepthAllowed)) {
            builders.add(new Builder() {
                public Gene build(Random random) {
                    return buildApplication(geneType, random);
                }},
                mRandomizer.buildTypeWeight(BuildType.CONSTRUCT)
          );

            if (geneType instanceof Maybe) {
                builders.add(new Builder() {
                    public Gene build(Random random) {
                        return buildPassMaybe((Maybe)geneType, random);
                    }},
                    mRandomizer.buildTypeWeight(BuildType.MAYBE)
              );
            }
        }

        if (!builders.isEmpty()) {
            if (mDepthAllowed > 0) {
                if (!(geneType instanceof Maybe || geneType.equals(BaseType.NULL))) {
                    builders.add(new Builder() {
                        public Gene build(Random random) {
                            return buildDemaybe(geneType, random);
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
        if (depth > 0) {
            List<TypedSymbol> matching = mContext.findFunctionTypeReturning(type);
            for (TypedSymbol function : matching) {
                if (canInvoke((FunctionType)function.type, depth)) {
                    return true;
                }
            }
        }
        return false;
    }

    private boolean canInvoke(FunctionType type, int depth) {
        for (Type argType : type.argumentTypes()) {
            if (isConstructable(argType)) {
                continue;
            }
            if (canLookup(argType)) {
                continue;
            }
            if (canApply(argType, depth-1)) {
                continue;
            }
        }
        return true;
    }

    private boolean canLookup(Type geneType) {
        return !mContext.findMatching(geneType).isEmpty();
    }

    private Gene buildBranch(Type geneType, Random random) {
        Gene predicate = buildItem(BaseType.BOOL, random);
        Gene thenGene = buildItem(geneType, random);
        Gene elseGene = buildItem(geneType, random);
        return new IfGene(geneType,predicate,thenGene,elseGene);
    }

    private Gene buildDemaybe(Type geneType, Random random) {
        String name = StringRandom.alphaString(random, 3);
        Gene maybeGene = null;
        // Check if we built a null directly, and if so, reject it.
        do {
            maybeGene = buildItem(new Maybe(geneType), random);
        } while(maybeGene.type().equals(BaseType.NULL));
        // If we didn't build a maybe, then just return the gene,
        // rather then forcing the issue.
        if (!(maybeGene.type() instanceof Maybe)) {
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
        for (int i = 0; i < argumentTypes.length; ++i) {
            Type type = argumentTypes[i];
            if (!(type instanceof Maybe || type.equals(BaseType.NULL))) {
                type = new Maybe(type);
                addedMaybe = true;
            }
            arguments[i] = buildItem(type,random);
        }
        if (addedMaybe) {
            return new PassMaybeGene(geneType, function, arguments, StringRandom.alphaString(random, 3));
        } else {
            return new ApplicationGene(function, arguments);
        }
    }

    private Gene buildApplication(Type geneType, Random random) {
        Gene function = buildInvokeable(geneType, random);
        Type argumentTypes[] = ((FunctionType)function.type()).argumentTypes();
        Gene arguments[] = new Gene[argumentTypes.length];
        for (int i = 0; i < argumentTypes.length; ++i) {
            arguments[i] = buildItem(argumentTypes[i],random);
        }
        return new ApplicationGene(function, arguments);
    }

    private Gene buildInvokeable(Type geneType, Random random) {
        List<TypedSymbol> matching = mContext.findFunctionTypeReturning(geneType);
        assert(!matching.isEmpty());
        TypedSymbol function = matching.get(random.nextInt(matching.size()));
        return new LookupGene(ParameterUtils.uniqueParameters(function.type), function.symbol.name(), random.nextLong());
    }

    private Gene lookup(Type geneType, Random random) {
        List<Symbol> matching = mContext.findMatching(geneType);
        if (matching.isEmpty()) {
            return null;
        }
        Symbol symbol = matching.get(random.nextInt(matching.size()));
        return new LookupGene(geneType, symbol.name(), random.nextLong());
    }

    private Gene constructItem(Type geneType, Random random) {
        while(geneType instanceof Parameter) {
            geneType = mTypeBuilder.createConstructableType(random);
        }

        if (geneType.equals(BaseType.FIXNUM)) {
            return buildFixNum(random);
        } else if (geneType.equals(BaseType.REAL)) {
            return buildReal(random);
        } else if (geneType.equals(BaseType.BOOL)) {
            return buildBool(random);
        } else if (geneType.equals(BaseType.NULL)) {
            return new NullGene();
        } else if (geneType.equals(BaseType.TRUE)) {
            return new TrueGene();
        } else if (geneType.equals(BaseType.STRING)) {
            return buildString(random);
        } else if (geneType.equals(BaseType.SYMBOL)) {
            return buildSymbol(random);
        } else if (geneType instanceof ConsType) {
            return buildCons((ConsType)geneType,random);
        } else if (geneType instanceof ListType) {
            return buildList(((ListType)geneType),random);
        } else if (geneType instanceof Maybe) {
            return buildMaybe((Maybe)geneType, random);
        } else if (geneType instanceof FunctionType) {
            return buildLambda((FunctionType)geneType, random);
        }
        assert(false); // Unknown type
        return null;
    }

    private Gene buildMaybe(Maybe maybe, Random random) {
        if (mRandomizer.maybeIsNull(random)) {
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
        return new ConsGene(type,
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
        for (Type argType : type.argumentTypes()) {
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
        String names[] = FunctionGene.argumentNames(type, name);
        pushArguments(names, type.argumentTypes());

        Gene body = buildItem(type.returnType(), random);
        Gene result = new FunctionGene(type, name, body, isLambda);

        mContext.popSymbols(names.length);
        return result;
    }

    private void pushArguments(String[] names, Type[] types) {
        for (int i = 0; i < names.length; ++i) {
            mContext.pushSymbol(names[i], types[i]);
        }
    }

    private Gene buildLambda(FunctionType type, Random random) {
        return buildFunctionGene(type, random, "l" + StringRandom.alphaString(random, 5), true);
    }
}

public class GenomeBuilder {
    ObjectRegistry mRegistry;
    TypeBuilder mTypeBuilder;
    GeneRandomizer mProbs;

    public GenomeBuilder(ObjectRegistry registry, TypeBuilder typeBuilder, GeneRandomizer probs) {
        mRegistry = registry;
        mTypeBuilder = typeBuilder;
        mProbs = probs;
    }

    public class ChromosomeStructure
    {
        public String name;
        public FunctionType[] geneTypes;
    }

    public ChromosomeStructure[] buildGenomeStructure(FunctionType target, Random random)
    {
        mTypeBuilder.allowAllConstrained();
        try {
            ChromosomeStructure[] structure = new ChromosomeStructure[mProbs.selectGenomeSize(random)];
            for (int i = 0; i < structure.length - 1; ++i) {
                structure[i] = buildChromosomeStructure(random);
            }

            structure[structure.length-1] = buildTargetStructure(target);
            return structure;
        } finally {
            mTypeBuilder.clearDependentTypes();
        }
    }

    public Genome build(ChromosomeStructure[] genomeStructure, Random random) {
        Genome genome = new Genome();
        Context context = new Context(mRegistry);
        GeneBuilder geneBuilder = new GeneBuilder(mTypeBuilder, mProbs, context);
        for (ChromosomeStructure structure : genomeStructure) {
            genome.add(buildChromosome(context,geneBuilder,structure,random));
        }
        return genome;
    }

    private ChromosomeStructure buildChromosomeStructure(Random random) {
        ChromosomeStructure structure = new ChromosomeStructure();
        structure.name = "cr" + StringRandom.alphaString(random, 5);
        structure.geneTypes = new FunctionType[mProbs.selectChromosomeLength(random)];
        for (int i = 0; i < structure.geneTypes.length; ++i) {
            Type returnType = mTypeBuilder.createType(random);
            structure.geneTypes[i] = mTypeBuilder.createFunction(returnType, random);
        }
        return structure;
    }

    private ChromosomeStructure buildTargetStructure(FunctionType target) {
        ChromosomeStructure targetStructure = new ChromosomeStructure();
        targetStructure.name = "crTarget";
        targetStructure.geneTypes = new FunctionType[] { target };
        return targetStructure;
    }

    private Chromosome buildChromosome(Context context, GeneBuilder geneBuilder, ChromosomeStructure structure, Random random) {
        Chromosome chromosome = new Chromosome(structure.name);
        context.addChromosome(chromosome);
        for (FunctionType geneType : structure.geneTypes) {
            chromosome.addGene(geneBuilder.buildFunction(geneType, chromosome.nextGeneName(), random));
        }
        return chromosome;
    }
}

public class Mutation {
    public static class Probabilities implements Serializable {
        private static final long serialVersionUID = 7986408705696720856L;

        public double mutateTopLevel = 0.5;
        public double mutateSeed = 1/25.0;
        public double mutateStringLength = 1/25.0;
        public double mutateSymbolLength = 1/25.0;
        public double mutateListLength = 1/25.0;
        public double mutateSwapListItems = 1/25.0;
        public double mutateReorderList = 1/25.0;
        public double mutateFixnumRange = 1/25.0;
        public double mutateRealRange = 1/25.0;
        public double replaceSubgene = 1/25.0;

        public double mutateAddGene = 1/250.0;
        public double mutateSkipChromosome = 1/1000.0;
        public double mutateAddChromosome = 1/1000.0;
        public double mutateAddTargetChromosome = 1/5000.0;
    }

    private Probabilities mProbabilities;
    private GeneRandomizer mGeneRandomizer;
    private TypeBuilder mTypeBuilder;

    public Mutation(Probabilities probabilities, TypeBuilder typeBuilder, GeneRandomizer geneRandomizer) {
        mProbabilities = probabilities;
        mTypeBuilder = typeBuilder;
        mGeneRandomizer = geneRandomizer;
    }

    public TypeBuilder typeBuilder() {
        return mTypeBuilder;
    }

    public GeneRandomizer geneBuilderProbabilities() {
        return mGeneRandomizer;
    }

    public boolean mutateTopLevelGene(Random random) {
        return Probability.select(random, mProbabilities.mutateTopLevel);
    }

    public boolean mutateSeed(Random random) {
        return Probability.select(random, mProbabilities.mutateSeed);
    }

    public boolean mutateStringLength(Random random) {
        return Probability.select(random, mProbabilities.mutateStringLength);
    }

    public int newStringLength(int length, Random random) {
        int mutateType = random.nextInt(5);
        if (mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if (mutateType < 4) {
            return length + 1;
        }
        return mGeneRandomizer.selectStringLength(random);
    }

    public boolean mutateSymbolLength(Random random) {
        return Probability.select(random, mProbabilities.mutateSymbolLength);
    }

    public int newSymbolLength(int length, Random random) {
        int mutateType = random.nextInt(5);
        if (mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if (mutateType < 4) {
            return length + 1;
        }
        return mGeneRandomizer.selectStringLength(random);
    }

    public boolean replaceSubgene(Random random) {
        return Probability.select(random, mProbabilities.replaceSubgene);
    }

    public Gene createNewGene(Type type, Context context, Random random) {
        GeneBuilder builder = new GeneBuilder(typeBuilder(), geneBuilderProbabilities(), context);
        return builder.buildItem(type, random);
    }

    public Gene mutateGene(Type type, Gene gene, Context context, Random random) {
        if (replaceSubgene(random)) {
            return createNewGene(type, context, random);
        } else {
            gene.mutate(this, context, random);
            return gene;
        }
    }

    public boolean reorderList(Random random) {
        return Probability.select(random, mProbabilities.mutateReorderList);
    }

    public boolean mutateListLength(Random random) {
        return Probability.select(random, mProbabilities.mutateListLength);
    }

    public int newListLength(int length, Random random) {
        int mutateType = random.nextInt(5);
        if (mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if (mutateType < 4) {
            return length + 1;
        }
        return mGeneRandomizer.selectListLength(random);
    }

    public boolean swapListItems(Random random) {
        return Probability.select(random, mProbabilities.mutateSwapListItems);
    }

    public boolean mutateFixnumRange(Random random) {
        return Probability.select(random, mProbabilities.mutateFixnumRange);
    }

    public FixNumGenerator.Range newRange(FixNumGenerator.Range range, Random random) {
        int min = range.min;
        int max = range.max;
        int mutateType = random.nextInt(5);
        int rangeSizeDelta = random.nextInt(20);
        if (mutateType == 0) {
            min = min > Integer.MIN_VALUE + rangeSizeDelta ? min - rangeSizeDelta : Integer.MIN_VALUE;
        } else if (mutateType == 1) {
            min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
        } else if (mutateType == 2) {
            max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
        } else if (mutateType == 3) {
            max = max < Integer.MAX_VALUE - rangeSizeDelta ? max + rangeSizeDelta : Integer.MAX_VALUE;
        } else {
            return mGeneRandomizer.selectFixnumRange(random);
        }
        return new FixNumGenerator.Range(min, max);
    }

    public boolean mutateRealRange(Random random) {
        return Probability.select(random, mProbabilities.mutateRealRange);
    }

    public RealGenerator.Range newRange(RealGenerator.Range range, Random random) {
        double min = range.min;
        double max = range.max;
        int mutateType = random.nextInt(5);
        int rangeSizeDelta = random.nextInt(20);
        if (mutateType == 0) {
            min = min > Double.MIN_VALUE + rangeSizeDelta ? min - rangeSizeDelta : Integer.MIN_VALUE;
        } else if (mutateType == 1) {
            min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
        } else if (mutateType == 2) {
            max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
        } else if (mutateType == 3) {
            max = max < Double.MAX_VALUE - rangeSizeDelta ? max + rangeSizeDelta : Integer.MAX_VALUE;
        } else {
            return mGeneRandomizer.selectRealRange(random);
        }
        return new RealGenerator.Range(min, max);
    }

    public Long newSeed(Long seed, Random random) {
        int mutateType = random.nextInt(5);
        if (mutateType < 2) {
            return seed > Long.MIN_VALUE ? seed - 1 : Long.MIN_VALUE;
        }
        if (mutateType < 4) {
            return seed < Long.MAX_VALUE ? seed + 1 : Long.MAX_VALUE;
        }
        return random.nextLong();
    }

    public boolean skipChromosome(Random random) {
        return Probability.select(random, mProbabilities.mutateSkipChromosome);
    }

    public boolean addChromosome(Random random) {
        return Probability.select(random, mProbabilities.mutateAddChromosome);
    }

    public Chromosome createChromosome(Context context, Random random) {
        TypeBuilder typeBuilder = typeBuilder();
        GeneBuilder builder = new GeneBuilder(typeBuilder, geneBuilderProbabilities(), context);
        int chromosomeLength = mGeneRandomizer.selectChromosomeLength(random);
        Chromosome chromosome = new Chromosome("crA_" + util.StringRandom.alphaString(random, 5));
        context.addChromosome(chromosome);
        for (int i = 0; i < chromosomeLength; ++i) {
            typeBuilder.allowAllConstrained();
            Type returnType = typeBuilder.createType(random);
            typeBuilder.clearDependentTypes();
            FunctionType function = typeBuilder.createFunction(returnType, random);
            chromosome.addGene(builder.buildFunction(function, chromosome.nextGeneName(), random));
        }
        return chromosome;
    }

    public boolean addTargetChromosome(Random random) {
        return Probability.select(random, mProbabilities.mutateAddTargetChromosome);
    }

    public Chromosome createChromosome(Context context, Random random, FunctionType target) {
        GeneBuilder builder = new GeneBuilder(typeBuilder(), geneBuilderProbabilities(), context);
        Chromosome chromosome = new Chromosome("crT_" + util.StringRandom.alphaString(random, 5));
        chromosome.addGene(builder.buildFunction(target, chromosome.nextGeneName(), random));
        return chromosome;
    }

    public boolean addGene(Random random) {
        return Probability.select(random, mProbabilities.mutateAddGene);
    }

    public Gene createGene(Context context, String name, Random random) {
        TypeBuilder typeBuilder = typeBuilder();
        GeneBuilder builder = new GeneBuilder(typeBuilder, geneBuilderProbabilities(), context);
        typeBuilder.allowDependentTypes(context.findConcreteTypes());
        Type returnType;
        try {
            returnType = typeBuilder.createType(random);
        } finally {
            typeBuilder.clearDependentTypes();
        }
        FunctionType type = typeBuilder.createFunction(returnType, random);
        Gene gene = builder.buildFunction(type, name, random);
        return gene;
    }
}

public class Mutator {
    private Mutation mMutation;

    public Mutator(Mutation mutation) {
        mMutation = mutation;
    }

    public Genome mutate(Genome genome, ObjectRegistry reg, boolean allowMacroMutation, Random random, FunctionType target) {
        Context context = new Context(reg);
        boolean isMutated = false;
        Genome mutated = new Genome();

        boolean addChromosome = allowMacroMutation && mMutation.addChromosome(random);
        int i = 0;

        for (Chromosome chromosome : genome.chromosomes()) {
            ++i;
            boolean isLast = i == genome.chromosomes().size();
            boolean skipChromosome = !isLast && allowMacroMutation && mMutation.skipChromosome(random);
            if (isLast && addChromosome) {
                mutated.add(mMutation.createChromosome(context, random));
                isMutated = true;
            }
            if (!(skipChromosome)) {
                context.addChromosome(chromosome);
                Chromosome mutatedChromosome = mutate(chromosome, context, isLast, allowMacroMutation, random);
                mutated.add(mutatedChromosome);
                if (mutatedChromosome != chromosome) {
                    isMutated = true;
                }
            } else {
                isMutated = true;
            }
        }
        if (allowMacroMutation && mMutation.addTargetChromosome(random)) {
            isMutated = true;
            mutated.add(mMutation.createChromosome(context, random, target));
        }

        if (isMutated) {
            return mutated;
        } else {
            return genome;
        }
    }

    public Chromosome mutate(Chromosome chromosome, Context context, boolean isLast, boolean allowMacroMutation, Random random) {
        boolean isMutated = false;
        Chromosome mutated = new Chromosome(chromosome.name());
        for (Chromosome.NamedGene gene : chromosome.genes()) {
            if (mMutation.mutateTopLevelGene(random)) {
                Gene mutatedGene = gene.gene.mutate(mMutation, context, random);
                mutated.addGene(mutatedGene);
                if (gene != mutatedGene) {
                    isMutated = true;
                }
            } else {
                mutated.addGene(gene.gene);
            }
        }
        if (!isLast && allowMacroMutation && mMutation.addGene(random)) {
            mutated.addGene(mMutation.createGene(context, mutated.nextGeneName(), random));
            isMutated = true;
        }
        if (isMutated) {
            return mutated;
        } else {
            return chromosome;
        }
    }
}

public class Breeder {
    // Given two Genomes, produce an offspring
    static public Genome breed(Genome a, Genome b, FunctionType target, Random random) {
        // Avoid making the problem O(n*n) by creating a hash of one set of chromosomes
        Map<String, Chromosome> lookup = new java.util.HashMap<String, Chromosome>();
        for (Chromosome chromosome : a.chromosomes()) {
            lookup.put(chromosome.name(), chromosome);
        }

        // Keep track of the chromosomes in b which we haven't paired.
        List<Chromosome> bUnpaired = new java.util.ArrayList<Chromosome>();

        // Assume all 'a' chromosomes unpaired to start with.
        Set<String> aUnpaired = new java.util.HashSet<String>(lookup.keySet());

        List<Chromosome> child = new java.util.ArrayList<Chromosome>();
        // Keep track of the last chromosome matching the target.
        Chromosome crTarget = null;

        for (Chromosome chromosome : b.chromosomes()) {
            Chromosome pair = lookup.get(chromosome.name());
            if (pair != null) {
                Chromosome result = breed(pair, chromosome, random);
                if (result.findLastMatching(target) != null) {
                    crTarget = result;
                }
                child.add(result);

                // If we found a matching one in a, then it is now paired.
                aUnpaired.remove(pair.name());
            } else {
                // If we didn't find a matching one in a, then the b one is marked as unpaired.
                bUnpaired.add(chromosome);
            }
        }
        if (!bUnpaired.isEmpty()) {
            // Pair unpaired ones in order.
            for (Chromosome chromosome : bUnpaired) {
                if (aUnpaired.isEmpty()) {
                    if (chromosome.findLastMatching(target) != null) {
                        crTarget = chromosome;
                    }
                    child.add(chromosome);
                } else {
                    // Retrieve the next unpaired a chromosome
                    String next = aUnpaired.iterator().next();
                    aUnpaired.remove(next);
                    Chromosome pair = lookup.get(next);

                    assert(pair != null);
                    Chromosome result = breed(chromosome, pair, random);
                    if (chromosome.findLastMatching(target) != null) {
                        crTarget = result;
                    }
                    child.add(result);
                }
            }
        }
        Genome result = new Genome();
        // Make sure that a chromosome matching the target is last, by skipping it as we add, then
        // adding it explicitly afterwards.
        for (Chromosome chromosome : child) {
            if (chromosome != crTarget) {
                result.add(chromosome);
            }
        }
        if (crTarget == null) {
            throw new RuntimeException("No target!");
        }
        result.add(crTarget);
        return result;
    }

    static public Chromosome breed(Chromosome a, Chromosome b, Random random) {
        if (a.name() != b.name()) {
            if (random.nextBoolean()) {
                return a;
            } else {
                return b;
            }
        }
        Chromosome result = new Chromosome(a.name());
        int i = 0;
        int j = 0;
        List<Gene> aGenes = a.mGenes;
        List<Gene> bGenes = b.mGenes;
        while(i < aGenes.size() && j < bGenes.size()) {
            boolean useA = random.nextBoolean();
            Gene aGene = aGenes.get(i);
            Gene bGene = bGenes.get(j);
            if (aGene.type().equals(bGene.type())) {
                if (useA) {
                    result.addGene(aGene);
                } else {
                    result.addGene(bGene);
                }
            } else if ((aGenes.size() > i+1) && aGenes.get(i+1).type().equals(bGene.type())) {
                result.addGene(aGene);
                if (useA) {
                    result.addGene(aGenes.get(i+1));
                } else {
                    result.addGene(bGene);
                }
                ++i;
            } else if ((bGenes.size() > j+1) && aGene.type().equals(bGenes.get(j+1).type())) {
                result.addGene(bGene);
                if (useA) {
                    result.addGene(aGene);
                } else {
                    result.addGene(bGenes.get(j+1));
                }
                ++j;
            } else {
                if (useA) {
                    result.addGene(aGene);
                } else {
                    result.addGene(bGene);
                }
            }
            ++i;
            ++j;
        }
        return result;
    }
}

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

public interface Status {
    void onFail(Throwable ex, String context);
    void notify(String message);
    void updateBest(Evaluation eval);
    void updateProgress(int current, int total);
    void push(String name);
    void pop();
    void currentPopulation(List<Evaluation> evaluated);
}

public class Evaluator {
    static class IterationData {
        Environment env;
        Symbol entryPoint;
        Random random;

        IterationData(Environment env, Symbol entryPoint, Random random) {
            this.env = env;
            this.entryPoint = entryPoint;
            this.random = random;
        }
    }

    public static class TimeoutException extends RuntimeException {
        private static final long serialVersionUID = -1793266047279954658L;

        public TimeoutException() {
            super("Timed out.");
        }
    }

    public static class AbortedException extends RuntimeException {
        private static final long serialVersionUID = -2168950614241347034L;

        public AbortedException() {
            super("Aborted.");
        }
    }

    public static class TargetNotFoundException extends RuntimeException {
        private static final long serialVersionUID = -4130995184897392403L;

        public TargetNotFoundException() {
            super("Target not found.");
        }
    }

    static class GenomeView {
        List<Phene> mExpressions;
        GenomeView(List<Phene> expressions) {
            mExpressions = expressions;
        }

        public String toString() {
            StringBuilder result = new StringBuilder();
            for (Phene expression : mExpressions) {
                result.append(expression.name + " = ");
                result.append(expression.expression.toString());
                result.append('\n');
            }
            return result.toString();
        }
    }

    private static class Task {
        static final int kUnset = -1;

        private Genome mGenome = null;
        private GenomeView mView = null;
        private int mTaskID = kUnset;
        private long mStartTime = kUnset;
        private double mScore = 0;
        private Environment mEnv = null;
        private Symbol mEntryPoint = null;
        private long mSeed;
        private int mIterationCount;
        private int mIterations = 0;
        private Frame mRunFrame = null;
        private List<Pair<Throwable,String>> mErrors = new ArrayList<Pair<Throwable,String>>();

        Task(Genome genome, int taskID, int iterationCount, long seed) {
            mGenome = genome;
            mTaskID = taskID;
            mIterationCount = iterationCount;
            mSeed = seed;
        }

        synchronized int taskID() {
            return mTaskID;
        }

        synchronized Genome genome() {
            return mGenome;
        }

        synchronized void setView(GenomeView view) {
            // mView = view;
        }

        synchronized String view() {
            if (mView != null) {
                return mGenome.toString() + "\n" + mView.toString();
            }
            return mGenome.toString();
        }

        synchronized void setExpression(Environment env, Symbol entryPoint) {
            mEnv = env;
            mEntryPoint = entryPoint;
        }

        synchronized void failExpress(Throwable ex, String expression) {
            mErrors.add(new Pair<Throwable,String>(ex, expression));
        }

        synchronized void checkTime(long allowedTime) {
            if (mStartTime != kUnset && ((System.currentTimeMillis() - mStartTime) > allowedTime)) {
                mRunFrame.abort(new TimeoutException());
            }
        }

        synchronized void updateScore(double score) {
            if (mStartTime != kUnset) {
                mRunFrame = null;
                mStartTime = kUnset;
                mScore += score;
                ++mIterations;
            }
        }

        synchronized void fail(Throwable ex, String expression) {
            mErrors.add(new Pair<Throwable,String>(ex, expression));
            updateScore(-1);
        }

        synchronized double score() {
            if (mEnv == null) {
                return -2 * mIterationCount;
            } else if (mIterations > 0) {
                return mScore / mIterations;
            }
            return 0;
        }

        synchronized boolean done() {
            return (expressFailed()) || mIterations >= mIterationCount;
        }

        private boolean expressFailed() {
            return mEnv == null && !mErrors.isEmpty();
        }

        synchronized Evaluation evaluation() {
            return new Evaluation(score(), mGenome);
        }

        synchronized List<Pair<Throwable,String>> errors() {
            return mErrors;
        }

        synchronized public IterationData iterationData() {
            if (mEnv != null) {
                Random random = new Random(mSeed);
                mSeed = random.nextLong();
                mRunFrame = new Frame(mEnv, "RunFrame");
                mStartTime = System.currentTimeMillis();

                return new IterationData(mRunFrame, mEntryPoint, random);
            }
            return null;
        }

        synchronized public void abort() {
            if (mRunFrame != null) {
                mRunFrame.abort(new AbortedException());
            }
        }
    }

    class Worker implements Runnable
    {
        int mWorkerID;
        Thread mThread;

        Queue<Task> mTasks;
        Task mTask;

        public Worker(int workerID) {
            mWorkerID = workerID;
            constructThread();
            getTask();
        }

        private void constructThread() {
            mThread = new Thread(this);
            mThread.setName("EvaluateWorker" + mWorkerID);
        }

        synchronized void start() {
            mThread.start();
        }

        synchronized boolean checkStatus(long allowedTime) {
            if (mTask != null) {
                mTask.checkTime(allowedTime);
            }
            return mTask != null;
        }

        synchronized void abort() {
            if (mTask != null) {
                mTask.abort();
            }
            mTasks = null;
        }

        synchronized boolean getTask() {
            if (mTasks != null && mTask != null && !mTask.done()) {
                return true;
            }
            mTask = null;
            if (mTasks == null || mTasks.isEmpty()) {
                mTasks = assignTasks();
                if (mTasks == null) {
                    return false;
                }
            }
            mTask = mTasks.remove();
            return true;
        }

        public void run() {
            while(getTask()) {
                IterationData data = mTask.iterationData();
                if (data != null) {
                    try {
                        double score = mRunner.run(data.env, data.entryPoint, data.random);
                        mTask.updateScore(score);
                    } catch (Throwable ex) {
                        mTask.fail(ex, mTask.view());
                    }
                } else {
                    express();
                }
            }
        }

        public void express() {
            try {
                Genome genome = mTask.genome();
                Context context = new Context(mRunner.registry());
                List<Phene> phenome = genome.express(context);
                mTask.setView(new GenomeView(phenome));
                Environment env = bind(phenome);
                Symbol entryPoint = genome.findLastMatching(mRunner.targetType());
                if (entryPoint == null) {
                    throw new TargetNotFoundException();
                }
                mTask.setExpression(env, entryPoint);
            } catch(Throwable ex) {
                mTask.failExpress(ex, mTask.view());
            }
        }

        private Environment bind(List<Phene> phenome) {
            Environment env = new Frame(mRunner.environment(),"expressFrame");
            for (Phene phene : phenome) {
                Obj result = phene.expression.compile(env);
                result = result.eval(env);
                if (!isDefine(phene.expression)) {
                    env.add(phene.name, result);
                }
            }
            return env;
        }

        private boolean isDefine(Obj expression) {
            if (expression.isCons()) {
                Obj car = ((Cons)expression).car();
                if (car.isSymbol()) {
                    if (((Symbol)car).name().equals("define")) {
                        return true;
                    }
                }
            }
            return false;
        }

        public void join() {
            try {
                mThread.join();
            } catch (InterruptedException e) {
                mStatus.notify("Unexected interruption.");
                e.printStackTrace(System.out);
            }
        }
    }

    private Runner mRunner;
    private Status mStatus;

    private Random mRandom;
    private Population mPopulation;
    private int mUnassigned = 0;
    private Task[] mTasks;
    Worker[] mWorkers;


    public Evaluator(Runner runner, Status status) {
        mRunner = runner;
        mStatus = status;
    }

    synchronized Queue<Task> assignTasks() {
        mStatus.updateProgress(mUnassigned > 0 ? mUnassigned-1 : 0, mTasks.length);
        if (mUnassigned == mTasks.length || mWorkers == null) {
            return null;
        }
        Queue<Task> tasks = new java.util.LinkedList<Task>();
        int chunk = Math.max(Math.min(5, mTasks.length / mWorkers.length), 1);
        int end = Math.min(mUnassigned + chunk, mTasks.length);
        for (; mUnassigned < end; ++mUnassigned) {
            tasks.add(mTasks[mUnassigned]);
        }
        return tasks;
    }

    public static class Evaluation {
        public double score;
        public Genome genome;

        public Evaluation(double score, Genome genome) {
            this.score = score;
            this.genome = genome;
        }
    };

    private void setup() {
        mUnassigned = 0;
        mTasks = new Task[mPopulation.size()];
        int i = 0;
        for (Genome genome : mPopulation) {
            long seed = mRandom.nextLong();
            mTasks[i] = new Task(genome, i, mRunner.iterations(), seed);
            ++i;
        }

        int workerCount = java.lang.Runtime.getRuntime().availableProcessors();
        mWorkers = new Worker[workerCount];
        for (i = 0; i < workerCount; ++i) {
            mWorkers[i] = new Worker(i);
        }
    }

    synchronized void start() {
        for (Worker worker : mWorkers) {
            worker.start();
        }
    }

    private synchronized Worker[] getWorkers() {
        return mWorkers;
    }

    private boolean checkStatus() {
        Worker[] workers = getWorkers();
        if (workers == null) {
            return false;
        }
        boolean isActive = false;
        for (Worker worker : workers) {
            if (worker.checkStatus(mRunner.timeoutInterval())) {
                isActive = true;
            }
        }
        return isActive;
    }

    // This method cannot be synchronized, because otherwise it would prevent the worker threads from running.
    public List<Evaluation> evaluate(Population population, Random random) {
        mRandom = random;
        mPopulation = population;

        setup();
        start();

        boolean interruped;
        do {
            interruped = false;
            try {
                Thread.sleep(Math.min(mRunner.timeoutInterval()/2, 5000));
            } catch (InterruptedException e) {
                interruped = true;
                mStatus.notify("Unexected interruption.");
                e.printStackTrace(System.out);
            }
        } while(interruped || checkStatus());

        return finish();
    }

    synchronized private List<Evaluation> finish() {
        if (mWorkers != null) {
            for (Worker worker : mWorkers) {
                worker.join();
            }
            mWorkers = null;

            return processResults();
        }
        return null;
    }

    private List<Evaluation> processResults() {
        List<Evaluation> results = new ArrayList<Evaluation>();
        int i = 0;
        for (Task task : mTasks) {
            if (!task.done()) {
                throw new RuntimeException("Task not done!");
            }
            List<Pair<Throwable,String>> errors = task.errors();
            boolean seen = false;
            for (Pair<Throwable,String> error : errors) {
                String description = "";
                if (!seen && error.second != null && error.second.length() > 0) {
                    description = "**** Genome " + i + " ****\n" + error.second;
                    seen = true;
                }
                mStatus.onFail(error.first, description + "Genome " + i + ": ");

            }
            results.add(task.evaluation());
            ++i;
        }

        Collections.sort(results, new Comparator<Evaluation>(){
            public int compare(Evaluation a, Evaluation b) {
                if (a.score == b.score) {
                    return 0;
                }
                return a.score > b.score ? -1 : 1;
            }
        });
        return results;
    }

    private synchronized Worker[] clearWorkers() {
        Worker[] workers = mWorkers;
        mWorkers = null;
        return workers;
    }

    public void stop() {
        Worker[] workers = clearWorkers();
        if (workers != null) {
            for (Worker worker : workers) {
                worker.abort();
            }
        }
    }
}

public class Darwin {
    public static class SurvivalRatios implements java.io.Serializable {
        private static final long serialVersionUID = 1774113748620858730L;

        public double survivalRatio = 0.1;
        public double mutatedSurvivorRatio = 0.4;
        public double mutantRatio = 0.05;
        public double purebreadRatio = 0.25;
    }

    private TypeBuilder mTypeBuilder;
    private GeneRandomizer mGeneRandomizer;
    private ObjectRegistry mObjectRegistry;
    private Runner mRunner;
    private Evaluator mEvaluator;
    private Status mStatus;
    private Mutator mMutator;
    private String mLastPopulationPath;
    private SurvivalRatios mSurvivalRatios;
    private boolean mStop = false;

    public Darwin(TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator) {
        initialize(typeBuilder, runner, status, geneRandomizer, mutator, new SurvivalRatios());
    }

    public Darwin(TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator, SurvivalRatios survival) {
        initialize(typeBuilder, runner, status, geneRandomizer, mutator, survival);
    }

    public void initialize(TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator, SurvivalRatios survival) {
        mTypeBuilder = typeBuilder;
        mObjectRegistry = runner.registry();
        mRunner = runner;
        mEvaluator = new Evaluator(runner, status);
        mStatus = status;
        mGeneRandomizer = geneRandomizer;
        mSurvivalRatios = survival;
        mMutator = mutator;
    }

    public void setPopulationStorePath(String path) {
        mLastPopulationPath = path;
    }

    private FunctionType target() {
        return mRunner.targetType();
    }

    public Population initialPopulation(int size, Random random) {
        start();
        Population population = new Population(target());
        GenomeBuilder builder = new GenomeBuilder(mObjectRegistry, mTypeBuilder, mGeneRandomizer);
        GenomeBuilder.ChromosomeStructure[] structure = builder.buildGenomeStructure(target(), random);

        mStatus.push("Generate Population");
        for (int i = 0; i < size && !isStopped(); ++i) {
            mStatus.updateProgress(i, size);
            try {
                population.add(builder.build(structure, random));
            } catch(StackOverflowError ex) {
                mStatus.onFail(ex, "Generating population: ");
                --i;
            } catch(GeneBuilder.GeneBuildException ex) {
                mStatus.onFail(ex, "Generating population: ");
                --i;
            }
        }
        mStatus.pop();

        return population;
    }

    public List<Evaluator.Evaluation> evaluate(Population population, Random random) {
        return mEvaluator.evaluate(population, random);
    }

    public Population nextPopulation(final List<Evaluation> evaluated, final Random random) {
        int count = evaluated.size();

        try {
            int survivors = Math.max((int)(count * mSurvivalRatios.survivalRatio),1);
            int mutatedSurvivors = (int)(count * mSurvivalRatios.mutatedSurvivorRatio);
            int mutants = (int)(count * mSurvivalRatios.mutantRatio);
            final int offspringCount = Math.max(count - (survivors + mutatedSurvivors + mutants), 0);

            mStatus.push("Breading/mutating");

            mStatus.updateProgress(0, 4);
            final Population next = breedPopulation(evaluated, offspringCount, survivors, random);

            mStatus.updateProgress(1, 4);
            for (int i = 0; i < survivors; ++i) {
                next.add(evaluated.get(i).genome);
            }

            mStatus.updateProgress(2, 4);
            try {
                mStatus.push("Mutating Survivors");
                for (int i = 0; i < mutatedSurvivors; ++i) {
                    Genome mutantSurvivor = mutate(evaluated.get(random.nextInt(survivors)).genome, random);
                    next.add(mutantSurvivor);
                    mStatus.updateProgress(i, mutatedSurvivors);
                }
            } finally {
                mStatus.pop();
            }

            mStatus.updateProgress(3, 4);
            try {
                mStatus.push("Mutating");
                for (int i = 0; i < mutants; ++i) {
                    Genome mutant = mutate(evaluated.get(random.nextInt(evaluated.size())).genome, random);
                    next.add(mutant);
                    mStatus.updateProgress(i, mutants);
                }
            } finally {
                mStatus.pop();
            }

            return next;
        } finally {
            mStatus.pop();
        }
    }

    private Population breedPopulation(List<Evaluation> evaluated, int count, int selectFrom, Random random) {
        int purebreads = (int)(mSurvivalRatios.purebreadRatio * count);
        Population offspring = new Population(target());
        try {
            mStatus.push("Breeding");
            for (int i = 0; i < count; ++i) {
                Genome parentA = selectParent(evaluated, selectFrom, random);
                Genome parentB = selectParent(evaluated, selectFrom, random);
                Genome child = Breeder.breed(parentA, parentB, target(), random);
                if (i > purebreads) {
                    child = mutate(child, random);
                }
                offspring.add(child);
            }
        } finally {
            mStatus.pop();
        }
        return offspring;
    }

    boolean mSkipTargetCheck = true;
    private Genome mutate(Genome genome, Random random) {
        Genome mutated = null;
        do {
            try {
                mutated = mMutator.mutate(genome, mObjectRegistry, true, random, target());
                assert(mSkipTargetCheck || mutated.findLastMatching(target()) != null);
            } catch(Throwable ex) {
                System.out.println("Failure during mutation: " + ex.toString());
                mStatus.notify("Failure during mutation.");
            }
        } while(mutated == null);
        return mutated;
    }

    private Genome selectParent(List<Evaluation> evaluated, int selectFrom, Random random) {
        int selected = random.nextInt(selectFrom);
        Evaluation selection = evaluated.get(selected);
        return selection.genome;
    }

    public Evaluation evolve(Population population, int generations, Random random) {
        if (!population.isTarget(target())) {
            mStatus.notify("Incompatible population.");
            return null;
        }
        start();
        Evaluation best = null;
        int i = 0;
        mStatus.updateProgress(0, generations);
        do {
            try {
                mStatus.push("Generation " + i);
                mStatus.updateProgress(0, 2);

                storePopulation(population);

                List<Evaluation> evaluated;
                try {
                    mStatus.push("Evaluating");
                    evaluated = evaluate(population,random);
                    if (isStopped()) {
                        // If we were stopped during evaluation, evaluate will return null
                        // So for simplicity, just jump out here.
                        return best;
                    }
                    Evaluation currentBest = evaluated.get(0);
                    if (best == null || currentBest.score > best.score) {
                        best = currentBest;
                        mStatus.updateBest(best);
                    }
                    mStatus.currentPopulation(evaluated);
                    if (best.score == mRunner.maxScore()) {
                        // If we've hit the max score, we'll never replace it, so stop now.
                        return best;
                    }
                } finally {
                    mStatus.pop();
                }

                mStatus.updateProgress(1, 2);
                do {
                    population = nextPopulation(evaluated, random);
                } while(population == null);
            } finally {
                mStatus.pop();
            }
            ++i;
            mStatus.updateProgress(i, generations);
        } while(i < generations && !isStopped());
        return best;
    }

    private void storePopulation(Population pop) {
        if (mLastPopulationPath != null) {
            pop.store(mLastPopulationPath);
        }
    }

    synchronized public boolean isStopped() {
        return mStop;
    }

    synchronized public void abort() {
        mStop = true;
        mStatus.notify("Aborting...");
        mEvaluator.stop();
    }

    synchronized public void start() {
        mStop = false;
    }
}
*/
    return {
    };
}());