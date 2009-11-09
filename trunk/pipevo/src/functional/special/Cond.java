/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import java.util.ArrayList;

import functional.BaseObj;
import functional.CompileException;
import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.Null;
import functional.Obj;
import functional.SpecialForm;
import functional.Tail;

public class Cond extends SpecialForm {
	static class Clause {
		Clause( Obj predicate, Obj result ) {
			mPredicate = predicate;
			mResult = result;
		}
		Obj mPredicate;
		Obj mResult;
	}

	static class Clauses extends BaseObj {
		Clause[] mClauses;

		Clauses( Clause[] clauses ) {
			mClauses = clauses;
		}

		public Obj eval(Environment env) {
			for( Clause clause : mClauses ) {
				if( !clause.mPredicate.eval(env).isNull() ) {
					Tail tail = env.getTail();
					if( tail != null ) {
						if( clause.mResult.isCons() ) {
							tail.set((Cons)clause.mResult, env);
							return null;
						}
					}
					return clause.mResult.eval(env);
				}
			}
			return Null.NULL;
		}

		void compileClauses(Environment env) {
			for( Clause clause : mClauses ) {
				clause.mPredicate = clause.mPredicate.compile(env);
				clause.mResult = clause.mResult.compile(env);
			}
		}
	}

	public Clauses process( Environment env, Obj arguments ) {
		ArrayList<Clause> clauses = new ArrayList<Clause>();
		while( arguments.isCons() ) {
			Cons args = (Cons)arguments;

			if( !args.isCons() ) {
				throw new EvalException( "Malformed clause.", env );
			}
			Cons clause = (Cons)args.car();
			if( !clause.cdr().isCons() ) {
				throw new CompileException( "Malformed clause.", env );
			}
			Cons statement = (Cons)clause.cdr();
			if( !statement.cdr().isNull() ) {
				throw new CompileException( "Malformed clause.", env );
			}
			clauses.add(new Clause(clause.car(), statement.car()));
			arguments = args.cdr();
		}
		if( !arguments.isNull() ) {
			throw new EvalException( "Malformed clauses.", env );
		}
		return new Clauses( clauses.toArray(new Clause[clauses.size()]) );
	}

	public Obj invoke(Environment env, Obj arguments) {
		return process(env,arguments).eval(env);
	}

	public Obj compile(Environment env, Obj arguments) {
		Clauses result = process(env,arguments);
		result.compileClauses(env);
		return result;
	}

	public String toString() { return "cond"; }
}
