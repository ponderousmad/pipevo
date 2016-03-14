var EVOLVE = (function () {
    "use strict";

/*
public interface Gene {
    public Obj express( Context context );
    public Type type();

    public Gene mutate( Mutation mutation, Context context, Random random );
}

public class Chromasome implements Serializable {
    private static final long serialVersionUID = -1621188220491889894L;
    String mName;
    List<Gene> mGenes = new ArrayList<Gene>();

    public Chromasome( String name ) {
        mName = name;
    }

    public String name() {
        return mName;
    }

    public int size() {
        return mGenes.size();
    }

    public class NamedGene {
        NamedGene( Gene aGene, String itsName ) {
            gene = aGene;
            name = itsName;
        }
        public Gene gene;
        public String name;
    }

    public String nextGeneName() {
        return geneName(mGenes.size());
    }

    private String geneName( int i ) {
        return mName + Integer.toString(i+1);
    }

    public NamedGene[] genes() {
        NamedGene[] genes = new NamedGene[mGenes.size()];
        int i = 0;
        for( Gene gene : mGenes ) {
            genes[i] = new NamedGene(gene, geneName(i));
            ++i;
        }
        return genes;
    }

    public void addGene( Gene gene ) {
        mGenes.add(gene);
    }

    public static class Phene {
        public String name;
        public Obj expression;

        Phene( String name, Obj expression ) {
            this.name = name;
            this.expression = expression;
        }
    }

    public Phene[] express( Context context ) {
        Phene[] phenes = new Phene[mGenes.size()];
        for( int i = 0; i < mGenes.size(); ++i ) {
            phenes[i] = new Phene( geneName(i), mGenes.get(i).express(context) );
        }
        return phenes;
    }

    public Chromasome.NamedGene findLastMatching(Type targetType) {
        NamedGene[] genes = genes();
        for( int j = genes.length - 1; j >= 0; --j ) {
            if( genes[j].gene.type().equals(targetType) ) {
                return genes[j];
            }
        }
        return null;
    }
}

public class Genome implements Serializable {
    private static final long serialVersionUID = 126738355774268224L;
    private List<Chromasome> mChromasomes = new ArrayList<Chromasome>();

    public Genome() {
    }

    public void add( Chromasome chromasome ) {
        assert( chromasome != null );
        mChromasomes.add(chromasome);
    }

    public List<Chromasome> chromasomes() {
        return mChromasomes;
    }

    public List<Phene> express(Context context) {
        List<Phene> phenome = new ArrayList<Phene>();
        for( Chromasome chromasome : mChromasomes ) {
            context.addChromasome(chromasome);
            Phene[] phenes = chromasome.express(context);
            for( Phene phene : phenes ) {
                phenome.add(phene);
            }
        }
        return phenome;
    }

    public Symbol findLastMatching( Type targetType ) {
        for( int i = mChromasomes.size() - 1; i >= 0; --i ) {
            Chromasome c = mChromasomes.get(i);
            Chromasome.NamedGene matching = c.findLastMatching(targetType);
            if( matching != null ) {
                return new Symbol(matching.name);
            }
        }
        return null;
    }
}

public class TypeBuilder {
    public interface Builder {
        public Type build( Random random );
    }

    public static class Constraint {
        private Type mConstrained;
        private List<Type> mSources;

        // If a type cannot be constructed from any source type,
        // the sources list is allowed to be empty (but must not be null).
        public Constraint(Type constrained, List<Type> sources) {
            mConstrained = constrained;
            mSources = sources;
        }

        public Type constrained() {
            return mConstrained;
        }

        List<Type> sources() {
            return mSources;
        }

        public boolean available(List<Type> inContext)
        {
            if(inContext.contains(mConstrained)) {
                return true;
            }
            for( Type type : inContext ) {
                if(mSources.contains(type)) {
                    return true;
                }
            }
            return false;
        }
    }

    public static class Probabilities implements Serializable {
        private static final long serialVersionUID = -6175849706108373092L;

        private List<Pair<Type,Integer>> mConcreteWeights;
        private int[] mArgCountDistribution;

        public int functionWeight = 1;
        public int listWeight = 10;
        public int maybeWeight = 50;
        public int consWeight = 1;
        public int parameterWeight = 1;
        public double newParameterProbability = 0.2;

        private static List<Pair<Type,Integer>> defaultWeights() {
            List<Pair<Type,Integer>> typeWeights = new ArrayList<Pair<Type,Integer>>();
            typeWeights.add(new Pair<Type,Integer>(BaseType.FIXNUM, 100));
            typeWeights.add(new Pair<Type,Integer>(BaseType.REAL,100));
            typeWeights.add(new Pair<Type,Integer>(BaseType.NULL,100));
            typeWeights.add(new Pair<Type,Integer>(BaseType.TRUE,100));
            typeWeights.add(new Pair<Type,Integer>(BaseType.BOOL,100));
            typeWeights.add(new Pair<Type,Integer>(BaseType.STRING,100));
            return typeWeights;
        }

        public Probabilities() {
            mConcreteWeights = defaultWeights();
            mArgCountDistribution = new int[]{10, 10, 5, 2, 1, 1, 1};
        }

        public List<Pair<Type,Integer>> concreteWeights() {
            return mConcreteWeights;
        }

        public void setConcreteWeights(List<Pair<Type,Integer>> weights) {
            assert( weights != null );
            mConcreteWeights = weights;
        }

        public int[] argCountDistribution() {
            return mArgCountDistribution;
        }

        public void setArgCountDistribution(int[] distribution) {
            assert( distribution != null );
            mArgCountDistribution = distribution;
        }

        public WeightedSet<Integer> functionArgCountDistribution() {
            WeightedSet<Integer> dist = new WeightedSet<Integer>();
            for( int i = 0; i < mArgCountDistribution.length; ++i ) {
                dist.add(i, mArgCountDistribution[i]);
            }
            return dist;
        }
    }

    private ReweightedSet<Builder> mBuilders;
    private List<Parameter> mParameters = new ArrayList<Parameter>();
    private boolean mAllowParameterized;
    private Probabilities mProbabilities;
    private Map<Type, Constraint> mConstraints;
    private Map<Type, List<Type>> mAllowances;

    public TypeBuilder(boolean allowParameterized, Probabilities probs) {
        initialize(allowParameterized, probs, new ArrayList<Constraint>());
    }

    public TypeBuilder(boolean allowParameterized, Probabilities probs, List<Constraint> constraints) {
        initialize(allowParameterized, probs, constraints);
    }

    private void initialize(boolean allowParameterized, Probabilities probs, List<Constraint> constraints) {
        mProbabilities = probs;
        mAllowParameterized = allowParameterized;

        for( Constraint constraint : constraints ) {
            addConstraint(constraint);
        }

        WeightedSet<Builder> builders = new WeightedSet<Builder>();
        addConcreteBuilders(builders);
        addFunctionBuilder(builders);
        addListBuilder(builders);
        addMaybeBuilder(builders);
        addConsBuilder(builders);
        if( mAllowParameterized ) {
            addParameterBuilder(builders);
        }
        mBuilders = new ReweightedSet<Builder>(builders);
    }

    private void addConstraint(Constraint constraint) {
        if( mConstraints == null ) {
            mConstraints = new java.util.HashMap<Type, Constraint>();
            mAllowances = new java.util.HashMap<Type, List<Type>>();
        }
        mConstraints.put(constraint.constrained(), constraint);
        for( Type type : constraint.sources() ) {
            List<Type> allowed = mAllowances.get(type);
            if( allowed == null ) {
                allowed = new ArrayList<Type>();
                mAllowances.put(type, allowed);
            }
            allowed.add(constraint.constrained());
        }
    }

    public boolean isConstrained(Type type) {
        return mConstraints != null && mConstraints.containsKey(type);
    }

    List<Type> mSourceStack;
    List<Pair<Type,Builder>> mConstrainedStack = new ArrayList<Pair<Type,Builder>>();
    public void allowDependentTypes(java.util.Set<Type> sources) {
        assert(mSourceStack == null);
        if( mAllowances == null ) {
            return;
        }
        mSourceStack = new ArrayList<Type>();
        for(Type type : sources) {
            mSourceStack.add(type);
            List<Type> dependents = mAllowances.get(type);
            addConstrained(type);
            if( dependents != null ) {
                for( Type constrained : dependents) {
                    addConstrained(constrained);
                }
            }
        }
    }

    private void addConstrained(Type constrained) {
        if( !onConstrainedStack(constrained) ) {
            Builder builder = addConstrainedBuilder(constrained);
            if( builder != null ) {
                mConstrainedStack.add(new Pair<Type,Builder>(constrained, builder));
            }
        }
    }

    public void allowAllConstrained() {
        if( mAllowances != null ) {
            allowDependentTypes(mAllowances.keySet());
        }
    }

    private boolean onConstrainedStack(Type constrained) {
        for(Pair<Type,Builder> entry : mConstrainedStack) {
            if(entry.first.equals(constrained)) {
                return true;
            }
        }
        return false;
    }

    private Builder addConstrainedBuilder(final Type constrained) {
        for(Pair<Type,Integer> entry : mProbabilities.concreteWeights()) {
            if( entry.first.equals(constrained) ) {
                Builder builder = new Builder() {public Type build(Random random) {return constrained;}};
                mBuilders.add(builder, entry.second);
                return builder;
            }
        }
        return null;
    }

    public void clearDependentTypes() {
        mSourceStack = null;
        for( Pair<Type,Builder> entry : mConstrainedStack) {
            mBuilders.remove(entry.second);
        }
    }

    private void addParameterBuilder(WeightedSet<Builder> builders) {
        builders.add(
            new Builder() { public Type build(Random random) { return createParameter(random); } },
            mProbabilities.parameterWeight
        );
    }

    private void addConcreteBuilders(WeightedSet<Builder> builders) {
        for( Pair<Type,Integer> entry : mProbabilities.concreteWeights() ) {
            if( !isConstrained(entry.first) ) {
                addConcreteBuilder(builders, entry.first, entry.second);
            }
        }
    }

    private void addConcreteBuilder(WeightedSet<Builder> builders, final Type type, final int weight) {
        if( weight == 0 ) return;
        builders.add(
            new Builder() { public Type build(Random random) { return type; } }, weight
        );
    }

    private void addFunctionBuilder(WeightedSet<Builder> builders) {
        if( mProbabilities.functionWeight == 0 ) return;
        builders.add(
            new Builder() { public Type build(Random random) { return createFunction(random); }},
            mProbabilities.functionWeight
        );
    }

    private void addListBuilder(WeightedSet<Builder> builders) {
        if( mProbabilities.listWeight == 0 ) return;
        builders.add(
            new Builder() { public Type build(Random random) { return createList(random); }},
            mProbabilities.listWeight
        );
    }

    private void addMaybeBuilder(WeightedSet<Builder> builders) {
        if( mProbabilities.maybeWeight == 0 ) return;
        builders.add(
            new Builder() { public Type build(Random random) { return createMaybe(random); }},
            mProbabilities.maybeWeight
        );
    }

    private void addConsBuilder(WeightedSet<Builder> builders) {
        if( mProbabilities.consWeight == 0 ) return;
        builders.add(
            new Builder() {
                public Type build(Random random) {
                    return new ConsType(createType(random), createType(random));
                }
            },
            mProbabilities.consWeight
        );
    }

    int mNesting = 0;
    public Type createType( Random random ) {
        ++mNesting;
        try {
            Builder builder = mBuilders.select( random );
            Type result = builder.build(random);
            return result;
        } finally {
            --mNesting;
            if( mNesting == 0 ) {
                mParameters.clear();
            }
        }
    }

    private FunctionType createFunction(Random random) {
        return createFunction(createType(random), random);
    }

    public FunctionType createFunction(Type returnType, Random random) {
        boolean clearParameters = false;
        try {
            if( mParameters.isEmpty() && returnType instanceof Parameter ) {
                clearParameters = true;
                mParameters.add( (Parameter)returnType );
            }
            int arguments = functionArgCount(random);
            Type[] argTypes = new Type[arguments];
            for( int i = 0; i < arguments; ++i ) {
                argTypes[i] = createType( random );
            }
            if( isConstrained(returnType) ) {
                boolean satisfied = false;
                Constraint constraint = mConstraints.get(returnType);
                for(Type type : argTypes) {
                    if( constraint.sources().contains(type) || type.equals(returnType)) {
                        satisfied = true;
                        break;
                    }
                }
                // If we don't have one of the source types for this constrained type, then force the issue.
                if( !satisfied ) {
                    if(arguments == 0 ) {
                        arguments = 1;
                        argTypes = new Type[arguments];
                    }
                    Type source;
                    int index = random.nextInt(constraint.sources().size() + 1);
                    if( index == constraint.sources().size() ) {
                        source = returnType;
                    } else {
                        source = constraint.sources().get(index);
                    }
                    argTypes[random.nextInt(argTypes.length)] = source;
                }
            }
            return new FunctionType(returnType, argTypes);
        } finally {
            if( clearParameters ) {
                mParameters.clear();
            }
        }
    }

    private WeightedSet<Integer> mFunctionArgCountDist = null;
    private int functionArgCount(Random random) {
        if( mFunctionArgCountDist == null ) {
            mFunctionArgCountDist = mProbabilities.functionArgCountDistribution();
        }
        return mFunctionArgCountDist.select(random);
    }

    private ListType createList(Random random) {
        return new ListType(createType(random));
    }

    private Type createMaybe(Random random) {
        Type type = createType(random);
        if( type.equals(BaseType.NULL) ) {
            return type;
        }
        return new Maybe(type);
    }

    private boolean createNewParameter(Random random) {
        return util.Probability.select(random, mProbabilities.newParameterProbability);
    }

    protected Type createParameter(Random random) {
        if( mParameters.isEmpty() || createNewParameter(random) ) {
            Parameter p = new Parameter();
            mParameters.add( p );
            return p;
        }
        return mParameters.get(random.nextInt(mParameters.size()));
    }

    public static void findConcreteTypes(Type type, java.util.Set<Type> result) {
        if( type instanceof Maybe ) {
            findConcreteTypes(((Maybe)type).type(), result);
        }
        else if( type instanceof Parameter ) {
        } else if( type instanceof ConsType ) {
            ConsType cons = (ConsType)type;
            findConcreteTypes(cons.carType(), result);
            findConcreteTypes(cons.cdrType(), result);
        } else if( type instanceof ListType ) {
            findConcreteTypes(((ListType)type).elementType(), result);
        } else if( type instanceof FunctionType ) {
            // Only allowed the return type - and in theory we need all the
            // argument types to do it, but we're not going to worry about that here.
            findConcreteTypes(((FunctionType)type).returnType(), result);
        } else if( type instanceof BaseType ) {
            result.add(type);
        } else {
            // We missed a type class.
            assert( false );
        }
    }

    public Type createConstructableType(Random random) {
        Type result;
        do {
            result = createType(random);
        } while(isConstrained(result));
        return result;
    }
}

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

public class Population implements java.lang.Iterable<Genome>{
    FunctionType mTarget;
    List<Genome> mCrowd = new java.util.ArrayList<Genome>();

    public Population(FunctionType target) {
        mTarget = target;
    }

    public boolean isTarget(FunctionType target) {
        return CompareTypes.equalModuloParameters(mTarget, target);
    }

    public Iterator<Genome> iterator() {
        return mCrowd.iterator();
    }

    public void add(Genome genome) {
        mCrowd.add(genome);
    }

    public Genome get(int i) {
        return mCrowd.get(i);
    }

    public int size() {
        return mCrowd.size();
    }

    public void store(String path) {
        FileOutputStream f;
        try {
            f = new FileOutputStream(path);
            ObjectOutput s = new ObjectOutputStream(f);
            s.writeObject(mTarget);
            s.writeInt(mCrowd.size());
            for( Genome genome : mCrowd ) {
                s.writeObject(genome);
            }
            s.flush();
            s.close();
        } catch (IOException e) {
            e.printStackTrace(System.out);
        }
    }

    static public Population load(String path) {
        FileInputStream f;
        try {
            f = new FileInputStream(path);
            ObjectInputStream s = new ObjectInputStream(f);
            Population pop = new Population((FunctionType)s.readObject());
            int count = s.readInt();
            for( int i = 0; i < count; ++i) {
                pop.mCrowd.add( (Genome)s.readObject() );
            }
            s.close();
            return pop;
        } catch (IOException e) {
            e.printStackTrace(System.out);
        } catch (ClassNotFoundException e) {
            e.printStackTrace(System.out);
        } catch (ClassCastException e) {
            e.printStackTrace(System.out);
        }
        return null;
    }
}

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

public class GeneRandomizer {
    public static class Probabilities implements java.io.Serializable {
        private static final long serialVersionUID = -3323802227179728259L;

        public List<Pair<BuildType,Integer>> buildTypeWeights = defaultBuildTypeWeights();
        public int[] stringLengthWeights = new int[] {0,1,3,5,10,20,10,5,3,1,1,1,1,1,1,1,1,1,1,1};
        public int[] listLengthWeights = new int[] {0,10,20,10,5,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1};
        public int[] chromasomeLengthWeights = new int[] {0,1,2,3,2,1};
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
    private WeightedSet<Integer> mChromasomeLengthDistribution = null;
    private WeightedSet<Integer> mGenomeSizeDistribution = null;
    private WeightedSet<FixNumGenerator.Range> mFixnumRangeDistribution;
    private WeightedSet<RealGenerator.Range> mRealRangeDistribution;

    public GeneRandomizer(Probabilities probabilities) {
        mProbabilities = probabilities;
        mStringLengthDistribution = distribution(mProbabilities.stringLengthWeights);
        mListLengthDistribution = distribution(mProbabilities.listLengthWeights);
        mChromasomeLengthDistribution = distribution(mProbabilities.chromasomeLengthWeights);
        mGenomeSizeDistribution = distribution(mProbabilities.genomeSizeWeights);
        mFixnumRangeDistribution = new Constructor<FixNumGenerator.Range>().distribution(mProbabilities.fixnumRangeWeights);
        mRealRangeDistribution = new Constructor<RealGenerator.Range>().distribution(mProbabilities.realRangeWeights);
    }

    public int buildTypeWeight(BuildType type) {
        for( Pair<BuildType,Integer> entry : mProbabilities.buildTypeWeights) {
            if( entry.first == type ) {
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

    public int selectChromasomeLength(Random random) {
        return mChromasomeLengthDistribution.select(random);
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
            for( Pair<T, Integer> entry : weights ) {
                if( entry.first != skip && entry.second > 0) {
                    dist.add(entry.first, entry.second);
                }
            }
            return dist;
        }
    }

    private static WeightedSet<Integer> distribution(int[] weights) {
        WeightedSet<Integer> dist = new WeightedSet<Integer>();
        for( int i = 0; i  < weights.length; ++i ) {
            int weight = weights[i];
            if( weight > 0 )  {
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

public class GenomeBuilder {
    ObjectRegistry mRegistry;
    TypeBuilder mTypeBuilder;
    GeneRandomizer mProbs;

    public GenomeBuilder(ObjectRegistry registry, TypeBuilder typeBuilder, GeneRandomizer probs) {
        mRegistry = registry;
        mTypeBuilder = typeBuilder;
        mProbs = probs;
    }

    public class ChromasomeStructure
    {
        public String name;
        public FunctionType[] geneTypes;
    }

    public ChromasomeStructure[] buildGenomeStructure( FunctionType target, Random random )
    {
        mTypeBuilder.allowAllConstrained();
        try {
            ChromasomeStructure[] structure = new ChromasomeStructure[mProbs.selectGenomeSize(random)];
            for( int i = 0; i < structure.length - 1; ++i ) {
                structure[i] = buildChromasomeStructure(random);
            }

            structure[structure.length-1] = buildTargetStructure( target );
            return structure;
        } finally {
            mTypeBuilder.clearDependentTypes();
        }
    }

    public Genome build( ChromasomeStructure[] genomeStructure, Random random ) {
        Genome genome = new Genome();
        Context context = new Context(mRegistry);
        GeneBuilder geneBuilder = new GeneBuilder(mTypeBuilder, mProbs, context);
        for( ChromasomeStructure structure : genomeStructure ) {
            genome.add( buildChromasome(context,geneBuilder,structure,random));
        }
        return genome;
    }

    private ChromasomeStructure buildChromasomeStructure( Random random ) {
        ChromasomeStructure structure = new ChromasomeStructure();
        structure.name = "cr" + StringRandom.alphaString( random, 5 );
        structure.geneTypes = new FunctionType[mProbs.selectChromasomeLength(random)];
        for( int i = 0; i < structure.geneTypes.length; ++i ) {
            Type returnType = mTypeBuilder.createType(random);
            structure.geneTypes[i] = mTypeBuilder.createFunction(returnType, random);
        }
        return structure;
    }

    private ChromasomeStructure buildTargetStructure( FunctionType target ) {
        ChromasomeStructure targetStructure = new ChromasomeStructure();
        targetStructure.name = "crTarget";
        targetStructure.geneTypes = new FunctionType[] { target };
        return targetStructure;
    }

    private Chromasome buildChromasome( Context context, GeneBuilder geneBuilder, ChromasomeStructure structure, Random random ) {
        Chromasome chromasome = new Chromasome( structure.name );
        context.addChromasome(chromasome);
        for( FunctionType geneType : structure.geneTypes ) {
            chromasome.addGene( geneBuilder.buildFunction(geneType, chromasome.nextGeneName(), random) );
        }
        return chromasome;
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
        public double mutateSkipChromasome = 1/1000.0;
        public double mutateAddChromasome = 1/1000.0;
        public double mutateAddTargetChromasome = 1/5000.0;
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

    public boolean mutateTopLevelGene( Random random ) {
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
        if( mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if( mutateType < 4 ) {
            return length + 1;
        }
        return mGeneRandomizer.selectStringLength(random);
    }

    public boolean mutateSymbolLength(Random random) {
        return Probability.select(random, mProbabilities.mutateSymbolLength);
    }

    public int newSymbolLength(int length, Random random) {
        int mutateType = random.nextInt(5);
        if( mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if( mutateType < 4 ) {
            return length + 1;
        }
        return mGeneRandomizer.selectStringLength(random);
    }

    public boolean replaceSubgene(Random random) {
        return Probability.select(random, mProbabilities.replaceSubgene);
    }

    public Gene createNewGene( Type type, Context context, Random random ) {
        GeneBuilder builder = new GeneBuilder(typeBuilder(), geneBuilderProbabilities(), context);
        return builder.buildItem(type, random);
    }

    public Gene mutateGene( Type type, Gene gene, Context context, Random random ) {
        if( replaceSubgene(random) ) {
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
        if( mutateType < 2) {
            return length > 0 ? length - 1 : length;
        }
        if( mutateType < 4 ) {
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

    public FixNumGenerator.Range newRange( FixNumGenerator.Range range, Random random) {
        int min = range.min;
        int max = range.max;
        int mutateType = random.nextInt(5);
        int rangeSizeDelta = random.nextInt(20);
        if( mutateType == 0 ) {
            min = min > Integer.MIN_VALUE + rangeSizeDelta ? min - rangeSizeDelta : Integer.MIN_VALUE;
        } else if( mutateType == 1 ) {
            min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
        } else if( mutateType == 2 ) {
            max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
        } else if( mutateType == 3 ) {
            max = max < Integer.MAX_VALUE - rangeSizeDelta ? max + rangeSizeDelta : Integer.MAX_VALUE;
        } else {
            return mGeneRandomizer.selectFixnumRange(random);
        }
        return new FixNumGenerator.Range(min, max);
    }

    public boolean mutateRealRange(Random random) {
        return Probability.select(random, mProbabilities.mutateRealRange);
    }

    public RealGenerator.Range newRange( RealGenerator.Range range, Random random) {
        double min = range.min;
        double max = range.max;
        int mutateType = random.nextInt(5);
        int rangeSizeDelta = random.nextInt(20);
        if( mutateType == 0 ) {
            min = min > Double.MIN_VALUE + rangeSizeDelta ? min - rangeSizeDelta : Integer.MIN_VALUE;
        } else if( mutateType == 1 ) {
            min = min < max - rangeSizeDelta ? min + rangeSizeDelta : max;
        } else if( mutateType == 2 ) {
            max = max > min + rangeSizeDelta ? max - rangeSizeDelta : min;
        } else if( mutateType == 3 ) {
            max = max < Double.MAX_VALUE - rangeSizeDelta ? max + rangeSizeDelta : Integer.MAX_VALUE;
        } else {
            return mGeneRandomizer.selectRealRange(random);
        }
        return new RealGenerator.Range(min, max);
    }

    public Long newSeed(Long seed, Random random) {
        int mutateType = random.nextInt(5);
        if( mutateType < 2) {
            return seed > Long.MIN_VALUE ? seed - 1 : Long.MIN_VALUE;
        }
        if( mutateType < 4 ) {
            return seed < Long.MAX_VALUE ? seed + 1 : Long.MAX_VALUE;
        }
        return random.nextLong();
    }

    public boolean skipChromasome(Random random) {
        return Probability.select(random, mProbabilities.mutateSkipChromasome);
    }

    public boolean addChromasome(Random random) {
        return Probability.select(random, mProbabilities.mutateAddChromasome);
    }

    public Chromasome createChromasome(Context context, Random random) {
        TypeBuilder typeBuilder = typeBuilder();
        GeneBuilder builder = new GeneBuilder(typeBuilder, geneBuilderProbabilities(), context);
        int chromasomeLength = mGeneRandomizer.selectChromasomeLength(random);
        Chromasome chromasome = new Chromasome("crA_" + util.StringRandom.alphaString(random, 5));
        context.addChromasome(chromasome);
        for( int i = 0; i < chromasomeLength; ++i ) {
            typeBuilder.allowAllConstrained();
            Type returnType = typeBuilder.createType(random);
            typeBuilder.clearDependentTypes();
            FunctionType function = typeBuilder.createFunction(returnType, random);
            chromasome.addGene(builder.buildFunction(function, chromasome.nextGeneName(), random));
        }
        return chromasome;
    }

    public boolean addTargetChromasome(Random random) {
        return Probability.select(random, mProbabilities.mutateAddTargetChromasome);
    }

    public Chromasome createChromasome(Context context, Random random, FunctionType target) {
        GeneBuilder builder = new GeneBuilder(typeBuilder(), geneBuilderProbabilities(), context);
        Chromasome chromasome = new Chromasome("crT_" + util.StringRandom.alphaString(random, 5));
        chromasome.addGene(builder.buildFunction(target, chromasome.nextGeneName(), random));
        return chromasome;
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

    public Genome mutate(Genome genome, ObjectRegistry reg, boolean allowMacroMutation, Random random, FunctionType target ) {
        Context context = new Context(reg);
        boolean isMutated = false;
        Genome mutated = new Genome();

        boolean addChromasome = allowMacroMutation && mMutation.addChromasome(random);
        int i = 0;

        for( Chromasome chromasome : genome.chromasomes() ) {
            ++i;
            boolean isLast = i == genome.chromasomes().size();
            boolean skipChromasome = !isLast && allowMacroMutation && mMutation.skipChromasome(random);
            if( isLast && addChromasome ) {
                mutated.add(mMutation.createChromasome(context, random));
                isMutated = true;
            }
            if( !(skipChromasome) ) {
                context.addChromasome(chromasome);
                Chromasome mutatedChromasome = mutate(chromasome, context, isLast, allowMacroMutation, random);
                mutated.add(mutatedChromasome);
                if( mutatedChromasome != chromasome ) {
                    isMutated = true;
                }
            } else {
                isMutated = true;
            }
        }
        if( allowMacroMutation && mMutation.addTargetChromasome(random) ) {
            isMutated = true;
            mutated.add(mMutation.createChromasome(context, random, target));
        }

        if( isMutated ) {
            return mutated;
        } else {
            return genome;
        }
    }

    public Chromasome mutate(Chromasome chromasome, Context context, boolean isLast, boolean allowMacroMutation, Random random) {
        boolean isMutated = false;
        Chromasome mutated = new Chromasome(chromasome.name());
        for( Chromasome.NamedGene gene : chromasome.genes() ) {
            if( mMutation.mutateTopLevelGene(random) ) {
                Gene mutatedGene = gene.gene.mutate(mMutation, context, random);
                mutated.addGene(mutatedGene);
                if( gene != mutatedGene ) {
                    isMutated = true;
                }
            } else {
                mutated.addGene(gene.gene);
            }
        }
        if( !isLast && allowMacroMutation && mMutation.addGene(random) ) {
            mutated.addGene(mMutation.createGene(context, mutated.nextGeneName(), random));
            isMutated = true;
        }
        if( isMutated ) {
            return mutated;
        } else {
            return chromasome;
        }
    }
}

public class Breeder {
    // Given two Genomes, produce an offspring
    static public Genome breed( Genome a, Genome b, FunctionType target, Random random ) {
        // Avoid making the problem O(n*n) by creating a hash of one set of chromasomes
        Map<String, Chromasome> lookup = new java.util.HashMap<String, Chromasome>();
        for( Chromasome chromasome : a.chromasomes() ) {
            lookup.put(chromasome.name(), chromasome);
        }

        // Keep track of the chromasomes in b which we haven't paired.
        List<Chromasome> bUnpaired = new java.util.ArrayList<Chromasome>();

        // Assume all 'a' chromasomes unpaired to start with.
        Set<String> aUnpaired = new java.util.HashSet<String>(lookup.keySet());

        List<Chromasome> child = new java.util.ArrayList<Chromasome>();
        // Keep track of the last chromasome matching the target.
        Chromasome crTarget = null;

        for( Chromasome chromasome : b.chromasomes() ) {
            Chromasome pair = lookup.get(chromasome.name());
            if( pair != null ) {
                Chromasome result = breed(pair, chromasome, random);
                if( result.findLastMatching(target) != null ) {
                    crTarget = result;
                }
                child.add(result);

                // If we found a matching one in a, then it is now paired.
                aUnpaired.remove(pair.name());
            } else {
                // If we didn't find a matching one in a, then the b one is marked as unpaired.
                bUnpaired.add(chromasome);
            }
        }
        if( !bUnpaired.isEmpty() ) {
            // Pair unpaired ones in order.
            for( Chromasome chromasome : bUnpaired ) {
                if( aUnpaired.isEmpty() ) {
                    if( chromasome.findLastMatching(target) != null ) {
                        crTarget = chromasome;
                    }
                    child.add( chromasome );
                } else {
                    // Retrieve the next unpaired a chromasome
                    String next = aUnpaired.iterator().next();
                    aUnpaired.remove(next);
                    Chromasome pair = lookup.get(next);

                    assert( pair != null );
                    Chromasome result = breed(chromasome, pair, random);
                    if( chromasome.findLastMatching(target) != null ) {
                        crTarget = result;
                    }
                    child.add(result);
                }
            }
        }
        Genome result = new Genome();
        // Make sure that a chromasome matching the target is last, by skipping it as we add, then
        // adding it explicitly afterwards.
        for( Chromasome chromasome : child ) {
            if( chromasome != crTarget ) {
                result.add(chromasome);
            }
        }
        if( crTarget == null ) {
            throw new RuntimeException("No target!");
        }
        result.add(crTarget);
        return result;
    }

    static public Chromasome breed( Chromasome a, Chromasome b, Random random ) {
        if( a.name() != b.name() ) {
            if( random.nextBoolean() ) {
                return a;
            } else {
                return b;
            }
        }
        Chromasome result = new Chromasome( a.name() );
        int i = 0;
        int j = 0;
        List<Gene> aGenes = a.mGenes;
        List<Gene> bGenes = b.mGenes;
        while( i < aGenes.size() && j < bGenes.size() ) {
            boolean useA = random.nextBoolean();
            Gene aGene = aGenes.get(i);
            Gene bGene = bGenes.get(j);
            if( aGene.type().equals(bGene.type()) ) {
                if( useA ) {
                    result.addGene(aGene);
                } else {
                    result.addGene(bGene);
                }
            } else if( (aGenes.size() > i+1) && aGenes.get(i+1).type().equals(bGene.type()) ) {
                result.addGene(aGene);
                if( useA ) {
                    result.addGene(aGenes.get(i+1));
                } else {
                    result.addGene(bGene);
                }
                ++i;
            } else if( (bGenes.size() > j+1) && aGene.type().equals(bGenes.get(j+1).type())) {
                result.addGene(bGene);
                if( useA ) {
                    result.addGene(aGene);
                } else {
                    result.addGene(bGenes.get(j+1));
                }
                ++j;
            } else {
                if( useA ) {
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
    public double run( Environment env, Symbol target, Random random );
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
            for( Phene expression : mExpressions ) {
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
            if( mView != null ) {
                return mGenome.toString() + "\n" + mView.toString();
            }
            return mGenome.toString();
        }

        synchronized void setExpression(Environment env, Symbol entryPoint) {
            mEnv = env;
            mEntryPoint = entryPoint;
        }

        synchronized void failExpress(Throwable ex, String expression ) {
            mErrors.add(new Pair<Throwable,String>(ex, expression));
        }

        synchronized void checkTime(long allowedTime) {
            if( mStartTime != kUnset && ( ( System.currentTimeMillis() - mStartTime ) > allowedTime ) ) {
                mRunFrame.abort(new TimeoutException());
            }
        }

        synchronized void updateScore(double score) {
            if( mStartTime != kUnset ) {
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
            if( mEnv == null ) {
                return -2 * mIterationCount;
            } else if( mIterations > 0 ) {
                return mScore / mIterations;
            }
            return 0;
        }

        synchronized boolean done() {
            return ( expressFailed() ) || mIterations >= mIterationCount;
        }

        private boolean expressFailed() {
            return mEnv == null && !mErrors.isEmpty();
        }

        synchronized Evaluation evaluation() {
            return new Evaluation( score(), mGenome );
        }

        synchronized List<Pair<Throwable,String>> errors() {
            return mErrors;
        }

        synchronized public IterationData iterationData() {
            if( mEnv != null ) {
                Random random = new Random(mSeed);
                mSeed = random.nextLong();
                mRunFrame = new Frame(mEnv, "RunFrame");
                mStartTime = System.currentTimeMillis();

                return new IterationData(mRunFrame, mEntryPoint, random);
            }
            return null;
        }

        synchronized public void abort() {
            if( mRunFrame != null ) {
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

        public Worker( int workerID ) {
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
            if( mTask != null ) {
                mTask.checkTime(allowedTime);
            }
            return mTask != null;
        }

        synchronized void abort() {
            if( mTask != null ) {
                mTask.abort();
            }
            mTasks = null;
        }

        synchronized boolean getTask() {
            if( mTasks != null && mTask != null && !mTask.done() ) {
                return true;
            }
            mTask = null;
            if( mTasks == null || mTasks.isEmpty() ) {
                mTasks = assignTasks();
                if( mTasks == null ) {
                    return false;
                }
            }
            mTask = mTasks.remove();
            return true;
        }

        public void run() {
            while( getTask() ) {
                IterationData data = mTask.iterationData();
                if( data != null ) {
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
                if( entryPoint == null ) {
                    throw new TargetNotFoundException();
                }
                mTask.setExpression(env, entryPoint);
            } catch( Throwable ex ) {
                mTask.failExpress(ex, mTask.view());
            }
        }

        private Environment bind(List<Phene> phenome) {
            Environment env = new Frame(mRunner.environment(),"expressFrame");
            for( Phene phene : phenome ) {
                Obj result = phene.expression.compile(env);
                result = result.eval(env);
                if( !isDefine(phene.expression) ) {
                    env.add(phene.name, result);
                }
            }
            return env;
        }

        private boolean isDefine(Obj expression) {
            if( expression.isCons() ) {
                Obj car = ((Cons)expression).car();
                if( car.isSymbol() ) {
                    if( ((Symbol)car).name().equals("define") ) {
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
        if( mUnassigned == mTasks.length || mWorkers == null) {
            return null;
        }
        Queue<Task> tasks = new java.util.LinkedList<Task>();
        int chunk = Math.max(Math.min(5, mTasks.length / mWorkers.length), 1);
        int end = Math.min(mUnassigned + chunk, mTasks.length);
        for( ; mUnassigned < end; ++mUnassigned ) {
            tasks.add(mTasks[mUnassigned]);
        }
        return tasks;
    }

    public static class Evaluation {
        public double score;
        public Genome genome;

        public Evaluation( double score, Genome genome ) {
            this.score = score;
            this.genome = genome;
        }
    };

    private void setup() {
        mUnassigned = 0;
        mTasks = new Task[mPopulation.size()];
        int i = 0;
        for( Genome genome : mPopulation ) {
            long seed = mRandom.nextLong();
            mTasks[i] = new Task(genome, i, mRunner.iterations(), seed);
            ++i;
        }

        int workerCount = java.lang.Runtime.getRuntime().availableProcessors();
        mWorkers = new Worker[workerCount];
        for( i = 0; i < workerCount; ++i ) {
            mWorkers[i] = new Worker(i);
        }
    }

    synchronized void start() {
        for( Worker worker : mWorkers ) {
            worker.start();
        }
    }

    private synchronized Worker[] getWorkers() {
        return mWorkers;
    }

    private boolean checkStatus() {
        Worker[] workers = getWorkers();
        if( workers == null ) {
            return false;
        }
        boolean isActive = false;
        for( Worker worker : workers ) {
            if( worker.checkStatus(mRunner.timeoutInterval()) ) {
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
        } while( interruped || checkStatus() );

        return finish();
    }

    synchronized private List<Evaluation> finish() {
        if( mWorkers != null ) {
            for( Worker worker : mWorkers ) {
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
        for( Task task : mTasks) {
            if( !task.done() ) {
                throw new RuntimeException("Task not done!");
            }
            List<Pair<Throwable,String>> errors = task.errors();
            boolean seen = false;
            for( Pair<Throwable,String> error : errors ) {
                String description = "";
                if( !seen && error.second != null && error.second.length() > 0) {
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
                if( a.score == b.score ) {
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
        if( workers != null ) {
            for( Worker worker : workers ) {
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

    public Darwin( TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator ) {
        initialize(typeBuilder, runner, status, geneRandomizer, mutator, new SurvivalRatios());
    }

    public Darwin( TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator, SurvivalRatios survival ) {
        initialize(typeBuilder, runner, status, geneRandomizer, mutator, survival);
    }

    public void initialize( TypeBuilder typeBuilder, Runner runner, Status status, GeneRandomizer geneRandomizer, Mutator mutator, SurvivalRatios survival ) {
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

    public Population initialPopulation( int size, Random random ) {
        start();
        Population population = new Population(target());
        GenomeBuilder builder = new GenomeBuilder(mObjectRegistry, mTypeBuilder, mGeneRandomizer);
        GenomeBuilder.ChromasomeStructure[] structure = builder.buildGenomeStructure(target(), random);

        mStatus.push("Generate Population");
        for( int i = 0; i < size && !isStopped(); ++i ) {
            mStatus.updateProgress(i, size);
            try {
                population.add(builder.build(structure, random));
            } catch( StackOverflowError ex ) {
                mStatus.onFail(ex, "Generating population: ");
                --i;
            } catch( GeneBuilder.GeneBuildException ex ) {
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
            final int offspringCount = Math.max(count - ( survivors + mutatedSurvivors + mutants ), 0);

            mStatus.push("Breading/mutating");

            mStatus.updateProgress(0, 4);
            final Population next = breedPopulation(evaluated, offspringCount, survivors, random);

            mStatus.updateProgress(1, 4);
            for( int i = 0; i < survivors; ++i ) {
                next.add(evaluated.get(i).genome);
            }

            mStatus.updateProgress(2, 4);
            try {
                mStatus.push("Mutating Survivors");
                for( int i = 0; i < mutatedSurvivors; ++i ) {
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
                for( int i = 0; i < mutants; ++i ) {
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
            for( int i = 0; i < count; ++i ) {
                Genome parentA = selectParent(evaluated, selectFrom, random);
                Genome parentB = selectParent(evaluated, selectFrom, random);
                Genome child = Breeder.breed( parentA, parentB, target(), random );
                if( i > purebreads ) {
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
                assert( mSkipTargetCheck || mutated.findLastMatching(target()) != null );
            } catch( Throwable ex ) {
                System.out.println("Failure during mutation: " + ex.toString());
                mStatus.notify("Failure during mutation.");
            }
        } while( mutated == null );
        return mutated;
    }

    private Genome selectParent(List<Evaluation> evaluated, int selectFrom, Random random) {
        int selected = random.nextInt(selectFrom);
        Evaluation selection = evaluated.get(selected);
        return selection.genome;
    }

    public Evaluation evolve(Population population, int generations, Random random) {
        if( !population.isTarget(target()) ) {
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
                    if( isStopped() ) {
                        // If we were stopped during evaluation, evaluate will return null
                        // So for simplicity, just jump out here.
                        return best;
                    }
                    Evaluation currentBest = evaluated.get(0);
                    if( best == null || currentBest.score > best.score ) {
                        best = currentBest;
                        mStatus.updateBest(best);
                    }
                    mStatus.currentPopulation(evaluated);
                    if( best.score == mRunner.maxScore() ) {
                        // If we've hit the max score, we'll never replace it, so stop now.
                        return best;
                    }
                } finally {
                    mStatus.pop();
                }

                mStatus.updateProgress(1, 2);
                do {
                    population = nextPopulation(evaluated, random);
                } while( population == null );
            } finally {
                mStatus.pop();
            }
            ++i;
            mStatus.updateProgress(i, generations);
        } while( i < generations && !isStopped());
        return best;
    }

    private void storePopulation(Population pop) {
        if( mLastPopulationPath != null) {
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