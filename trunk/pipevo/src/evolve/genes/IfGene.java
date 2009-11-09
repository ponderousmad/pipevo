/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import java.io.Serializable;

import evolve.Context;
import evolve.Gene;
import evolve.Mutation;
import functional.Obj;
import functional.special.If.IfExpression;
import functional.type.BaseType;
import functional.type.Type;

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
