/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package pipes.gui;

import java.util.List;
import java.util.Random;

import evolve.BuiltinRegistrar;
import evolve.LibraryRegistrar;
import evolve.ObjectRegistry;
import evolve.Runner;
import evolve.TypeBuilder;
import functional.Cons;
import functional.Environment;
import functional.FixNum;
import functional.Obj;
import functional.Symbol;
import functional.repl.Initialize;
import functional.type.BaseType;
import functional.type.FunctionType;
import functional.type.Type;

public class XsqdPlus2XRunner implements Runner {
	FunctionType mTarget = new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM});
	ObjectRegistry mObjectReg;

	{
		mObjectReg = new ObjectRegistry();
		BuiltinRegistrar.registerBuiltins(mObjectReg);
		LibraryRegistrar.registerLibrary(mObjectReg);
	}

	public Environment environment() {
		return Initialize.initWithLibraries();
	}

	public ObjectRegistry registry() {
		return mObjectReg;
	}

	public double run(Environment env, Symbol target, Random random) {
		int number = random.nextInt(100);
		Cons application = Cons.list(target, new FixNum(number));
		Obj result = application.eval(env);
		if( result instanceof FixNum ) {
			int resultValue = ((FixNum)result).value();
			final double kGrossScale = 1000.0;

			double difference = Math.abs(resultValue - targetValue(number));

			if( difference == 0.0 ) {
				return maxScore();
			}

			double gross = Math.max((kGrossScale - difference) / kGrossScale, 0);

			final double kFineScale = 5.0;
			double fine = Math.max((kFineScale - difference) / kFineScale, 0);
			return fine + gross;
		}
		return 0;
	}

	private int targetValue(int x) {
		return 2*x + x*x;
	}

	public FunctionType targetType() {
		return mTarget;
	}

	public double maxScore() {
		return 5.0;
	}

	public int iterations() {
		return 10;
	}

	public long timeoutInterval() {
		return 500;
	}

	public List<TypeBuilder.Constraint> typeConstraints() {
		return new java.util.ArrayList<TypeBuilder.Constraint>();
	}
}