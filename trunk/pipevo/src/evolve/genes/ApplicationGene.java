/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Cons;
import functional.Null;
import functional.Obj;
import functional.type.FunctionType;
import functional.type.Type;

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
