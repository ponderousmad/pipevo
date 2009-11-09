/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.List;
import java.util.Random;

import evolve.Chromasome.Phene;
import evolve.Evaluator.Evaluation;
import functional.Cons;
import functional.Environment;
import functional.FixNum;
import functional.Obj;
import functional.Symbol;
import functional.repl.Initialize;
import functional.type.BaseType;
import functional.type.FunctionType;
import functional.type.Type;
import junit.framework.TestCase;

public class DarwinTest extends TestCase {
	interface TargetFunction {
		int target( int x );
	}

	static class TestRunner implements Runner {
		private ObjectRegistry mObjectReg;
		private FunctionType mTarget;
		private TargetFunction mFunc;

		TestRunner( TargetFunction func ) {
			mObjectReg = new ObjectRegistry();
			BuiltinRegistrar.registerBuiltins(mObjectReg);
			mTarget = new FunctionType(BaseType.FIXNUM, new Type[]{BaseType.FIXNUM});
			mFunc = func;
		}

		public ObjectRegistry registry() {
			return mObjectReg;
		}

		public Environment environment() {
			return Initialize.init();
		}

		public String viewExpression(Genome genome) {
			Context context = new Context(mObjectReg);
			List<Phene> expressions = genome.express(context);
			StringBuilder result = new StringBuilder();
			for( Phene expression : expressions ) {
				result.append(expression.name + " = ");
				result.append(expression.expression.toString());
				result.append('\n');
			}
			return result.toString();
		}

		public double run(Environment env, Symbol target, Random random) {
			int number = random.nextInt(20);
			Cons application = Cons.list(target, new FixNum( number ));
			Obj result = application.eval(env);
			if( result instanceof FixNum ) {
				int resultValue = ((FixNum)result).value();
				if( resultValue == mFunc.target( number ) ) {
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
		assertTrue( best != null );
		assertTrue( best.score > 0.0 );
	}
}
