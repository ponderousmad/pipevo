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
import functional.type.ConsType;
import functional.type.Type;

public class ConsGene implements Gene, Serializable {
	private static final long serialVersionUID = 1421679234788666512L;
	private Gene mCarGene;
	private Gene mCdrGene;
	private ConsType mType;

	public ConsGene( ConsType type, Gene carGene, Gene cdrGene ) {
		mType = type;
		assert( mType.carType().match(carGene.type()).matches() );
		assert( mType.cdrType().match(cdrGene.type()).matches() );
		mCarGene = carGene;
		mCdrGene = cdrGene;
	}

	public Obj express(Context context) {
		Obj car = mCarGene.express(context);
		Obj cdr = mCdrGene.express(context);
		return Cons.list(new Symbol("cons"), car, cdr);
	}

	public Gene mutate(Mutation mutation, Context context, java.util.Random random) {
		Gene mutatedCar = mutation.mutateGene(mType.carType(), mCarGene, context, random);
		Gene mutatedCdr = mutation.mutateGene(mType.cdrType(), mCdrGene, context, random);
		if( mutatedCar != mCarGene || mutatedCdr != mCdrGene ) {
			return new ConsGene(mType, mutatedCar, mutatedCdr );
		} else {
			return this;
		}
	}

	public Type type() {
		return mType;
	}

}
