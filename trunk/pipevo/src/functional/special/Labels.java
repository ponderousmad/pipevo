/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import java.util.ArrayList;
import java.util.List;

import functional.BaseObj;
import functional.Cons;
import functional.Environment;
import functional.EvalException;
import functional.Frame;
import functional.Function;
import functional.Obj;
import functional.SpecialForm;
import functional.Symbol;

public class Labels extends SpecialForm {
	public static class LabelsException extends EvalException {
		private static final long serialVersionUID = -6923382516003429164L;

		public LabelsException( String message, Environment env ) {
			super( message, env );
		}
	}

	static class LabelsExpression extends BaseObj {
		List<Function> mFunctions = new ArrayList<Function>();
		Obj mBodyForm = null;

		public void add( Function function ) {
			mFunctions.add( function );
		}

		public Obj eval(Environment env) {
			Environment labelsEnv = new Frame( env, null );
			for( Function function : mFunctions ) {
				labelsEnv.add( function.name(), function );
			}

			Obj result = null;
			Obj body = mBodyForm;
			while( body.isCons() ) {
				Cons statements = (Cons)body;
				result = statements.car().eval( labelsEnv );
				body = statements.cdr();
			}

			if( !body.isNull() || result == null ) {
				throw new LabelsException( "Malformed lambda body.", env );
			}
			return result;
		}
	}

	public Obj process(Environment env, Obj arguments, boolean compile) {
		LabelsExpression result = new LabelsExpression();
		Environment labelsEnv = new Frame(env, null);

		if( !arguments.isCons() ) {
			throw new LabelsException( "Malformed labels.", env );
		}
		Cons args = (Cons)arguments;
		Obj labels = args.car();
		while( labels.isCons() ) {
			Cons clauses = (Cons)labels;
			if( !clauses.car().isCons() ) {
				throw new LabelsException( "Malformed labels clauses.", env );
			}
			Cons func = (Cons)clauses.car();
			if( !func.car().isSymbol() ) {
				throw new LabelsException( "Symbol expected.", env );
			}
			if( !func.cdr().isCons() ) {
				throw new LabelsException( "Malformed labels clause.", env );
			}
			Symbol funcName = (Symbol)func.car();
			if( compile ) {
				labelsEnv.shadow( funcName.name() );
			}

			Cons rest = (Cons)func.cdr();
			Obj parameters = rest.car();
			if( !parameters.isCons() ) {
				throw new LabelsException( "Parameter list expected.", env );
			}
			Obj body = rest.cdr();
			if( body.isNull() ) {
				throw new LabelsException( "Function body expected.", env );
			}
			result.add(Lambda.buildFunction(env, funcName.name(), parameters, body));
			labels = clauses.cdr();
		}
		if( !labels.isNull() ) {
			throw new LabelsException( "Malformed labels clauses.", env );
		}

		if( compile ) {
			for( Function function : result.mFunctions ) {
				function.compileBody(labelsEnv);
			}
		}

		result.mBodyForm = compile ? Cons.compileList(labelsEnv, args.cdr()) : args.cdr();
		return result;
	}

	public Obj compile(Environment env, Obj arguments) {
		return process( env, arguments, true );
	}

	public Obj invoke( Environment env, Obj arguments ) {
		Obj compiledLabels = process( env, arguments, false );
		return compiledLabels.eval( env );
	}

	public String toString() { return "lables"; }
}
