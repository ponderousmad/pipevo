/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import functional.BaseObj;
import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.Null;
import functional.Obj;
import functional.SpecialForm;
import functional.Tail;

public class If extends SpecialForm {
	public static class IfExpression extends BaseObj {
		public IfExpression( Obj predicate, Obj thenClause, Obj elseClause ) {
			assert( predicate != null );
			assert( thenClause != null );
			assert( elseClause != null );
			mPredicate = predicate;
			mThen = thenClause;
			mElse = elseClause;
		}

		public Obj eval(Environment env) {
			Obj eval = mElse;
			if( !mPredicate.eval(env).isNull() ) {
				eval = mThen;
			}
			Tail tail = env.getTail();
			if( tail != null ) {
				if( eval.isCons() ) {
					tail.set((Cons)eval, env);
					return null;
				}
			}
			return eval.eval(env);
		}

		void compileClauses(Environment env) {
			mPredicate = mPredicate.compile(env);
			mThen = mThen.compile(env);
			if( mElse != null ) {
				mElse = mElse.compile(env);
			}
		}

		public String toString() {
			String result = "(if " + mPredicate.toString() + " " + mThen.toString();
			if( mElse != null ) {
				result += " " + mElse.toString();
			}
			return result + ")";
		}

		Obj mPredicate;
		Obj mThen;
		Obj mElse;
	}

	private IfExpression process(Environment env, Obj arguments) {
		Cons args = (Cons)arguments;
		if( !args.cdr().isCons() ) {
			throw new EvalException( "Malformed if.", env );
		}
		Cons clauses = (Cons)args.cdr();

		Obj elseClause = Null.NULL;
		if( clauses.cdr().isCons() ) {
			Cons elseCons = (Cons)clauses.cdr();
			if( !elseCons.cdr().isNull() ) {
				throw new EvalException( "Malformed else clause.", env );
			}
			elseClause = elseCons.car();
		}
		return new IfExpression( args.car(), clauses.car(), elseClause );
	}

	public Obj invoke( Environment env, Obj arguments ) {
		return process( env, arguments ).eval(env);
	}

	public Obj compile(Environment env, Obj arguments) {
		IfExpression result = process(env, arguments);
		result.compileClauses(env);
		return result;
	}

	public String toString() { return "if"; }
}
