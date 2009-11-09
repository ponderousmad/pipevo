/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.io.Serializable;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Random;

import utils.ReweightedSet;
import utils.WeightedSet;
import utils.Pair;

import functional.type.BaseType;
import functional.type.ConsType;
import functional.type.FunctionType;
import functional.type.ListType;
import functional.type.Maybe;
import functional.type.Parameter;
import functional.type.Type;

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
			mArgCountDistribution = new int[]{3, 5, 10, 5, 4, 2, 1, 1};
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
		return utils.Probability.select(random, mProbabilities.newParameterProbability);
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
