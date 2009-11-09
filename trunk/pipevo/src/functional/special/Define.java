/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.special;

import java.util.LinkedList;
import java.util.List;

import functional.Environment;
import functional.EvalException;
import functional.Frame;
import functional.Function;
import functional.Obj;
import functional.Cons;
import functional.SpecialForm;
import functional.Symbol;

public class Define extends SpecialForm {
	public static class DefineException extends EvalException {
		private static final long serialVersionUID = 7047262781903808993L;

		public DefineException( String message, Environment env ) {
			super( message, env );
		}

		public DefineException( Environment env ) {
			super( "Malformed define.", env );
		}
	}

	public Obj compile(Environment env, Obj arguments) {
		if( !arguments.isCons() ) {
			throw new DefineException( env );
		}
		Cons args = (Cons)arguments;
		if( args.car().isCons() ) {
			Function function = processFunction((Cons)args.car(), args.cdr(), env);
			Frame selfFrame = new Frame(env, function.name() + " - compiling");
			selfFrame.add(function);
			function.compileBody(selfFrame);
			return Cons.list(this, new Symbol(function.name()), function);
		}
		if( args.car().isSymbol() ) {
			return Cons.list(this, args.cdr(), compileValue(args.cdr(), env));
		}
		throw new DefineException( env );
	}

	public Obj invoke(Environment env, Obj arguments) {
		if( !arguments.isCons() ) {
			throw new DefineException( env );
		}
		Cons args = (Cons)arguments;
		if( args.car().isCons() ) {
			Function func = processFunction( (Cons)args.car(), args.cdr(), env );
			return env.add( func );
		}
		if( args.car().isSymbol() ) {
			return defineValue( (Symbol)args.car(), args.cdr(), env );
		}
		throw new DefineException( env );
	}

	private Obj defineValue(Symbol symbol, Obj obj, Environment env) {
		if( !obj.isCons() ) {
			throw new DefineException( env );
		}
		Cons rest = (Cons)obj;
		if( !rest.cdr().isNull() ) {
			throw new DefineException( env );
		}
		Obj value = rest.car().eval( env );
		return env.add( symbol.name(), value );
	}

	private Obj compileValue(Obj obj, Environment env) {
		if( !obj.isCons() ) {
			throw new DefineException( env );
		}
		Cons rest = (Cons)obj;
		if( !rest.cdr().isNull() ) {
			throw new DefineException( env );
		}
		return rest.car().compile( env );
	}

	private Function processFunction(Cons spec, Obj body, Environment env) {
		if( !spec.car().isSymbol() ) {
			throw new DefineException( env );
		}
		Symbol name = (Symbol)spec.car();

		Obj parameters = spec.cdr();
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
			throw new DefineException( env );
		}
		if( !body.isCons() ) {
			throw new DefineException( env );
		}
		Statements funcBody = new Statements( (Cons)body );
		return new Function( name.name(), paramList.toArray( new String[ paramList.size() ] ), restParam, funcBody );
	}

	public String toString() { return "define"; }
}
