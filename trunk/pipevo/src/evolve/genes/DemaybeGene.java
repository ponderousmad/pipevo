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
import functional.Obj;
import functional.Symbol;
import functional.type.Maybe;
import functional.type.Type;
import functional.special.If.IfExpression;

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
