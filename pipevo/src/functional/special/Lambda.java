/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import java.util.LinkedList;
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

public class Lambda extends SpecialForm {
	static class LambdaException extends EvalException {
		private static final long serialVersionUID = 6714984979530711059L;

		public LambdaException( String message, Environment env ) {
			super( message, env );
		}
	}

	public static class Closure extends Function  {
		private Environment mFrame;
		public Closure(Environment frame, Function function) {
			super(function.parameters(), function.restParameter(), function.body());
			mFrame = frame;
		}

		protected Frame bodyFrame(Environment env, String name) {
			return new Frame(mFrame, name);
		}

		public Obj invoke(Environment env, Obj arguments) {
			return super.invoke(env, arguments);
		}
	}

	public static class CompiledLambda extends BaseObj {
		private Function mFunction;

		public CompiledLambda( Function function ) {
			mFunction = function;
		}

		public Obj eval( Environment env ) {
			return new Closure( env, mFunction );
		}
	}

	public Obj compile(Environment env, Obj arguments) {
		return compileLambda(env, arguments);
	}

	public CompiledLambda compileLambda(Environment env, Obj arguments) {
		if( !arguments.isCons() ) {
			throw new LambdaException( "Malformed lambda.", env );
		}
		Cons args = (Cons)arguments;
		Function function = buildFunction(env, null, args.car(), args.cdr());
		function.compileBody(env);
		return new CompiledLambda( function );
	}

	static Function buildFunction(Environment env, String name, Obj parameters, Obj body) {
		List<String> paramList = new LinkedList<String>();
		while( parameters.isCons() ) {
			Cons params = (Cons)parameters;
			Obj param = params.car();
			if( param.isSymbol() ) {
				paramList.add( ((Symbol)param).name() );
			}
			parameters = params.cdr();
		}
		String restParam = null;
		if( parameters.isSymbol() ) {
			restParam = ((Symbol)parameters).name();
		} else if( !parameters.isNull() ) {
			throw new LambdaException( "Malformed lambda parameters.", env );
		}

		if( body.isCons() ) {
			Statements funcBody = new Statements( (Cons)body );
			String[] parameterNames = paramList.toArray( new String[paramList.size()] );
			return new Function( name, parameterNames, restParam, funcBody );
		} else {
			throw new LambdaException( "Malformed lambda body.", env );
		}
	}

	public Obj invoke( Environment env, Obj arguments ) {
		return compileLambda( env, arguments ).eval( env );
	}

	public String toString() { return "lambda"; }
}
