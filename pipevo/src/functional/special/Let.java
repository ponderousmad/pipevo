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
import functional.Obj;
import functional.SpecialForm;
import functional.Symbol;

public class Let extends SpecialForm {
	public static class LetException extends EvalException {
		private static final long serialVersionUID = -3894351663272964169L;

		public LetException( String message, Environment env ) {
			super( message, env );
		}
	}

	public enum Type {
		PARALLEL,
		SEQUENTIAL
	}
	private Type mType;

	Let( Type type ) {
		mType = type;
	}

	static class LetExpression extends BaseObj {
		LetExpression( Type type ) {
			mType = type;
		}

		static class BindingForm {
			BindingForm( Symbol symbol, Obj form ) {
				mSymbol = symbol; mForm = form;
			}
			Symbol mSymbol;
			Obj mForm;
		}
		List<BindingForm> mBindingForms = new ArrayList<BindingForm>();
		Obj mBodyForm = null;
		private Type mType;

		public void add( Symbol symbol, Obj form ) {
			mBindingForms.add( new BindingForm( symbol, form ) );
		}

		public Obj eval(Environment env) {
			Environment letEnv = new Frame( env, null );
			for( BindingForm form : mBindingForms ) {
				letEnv.add(form.mSymbol.name(), form.mForm.eval(mType == Type.SEQUENTIAL ? letEnv : env));
			}

			Obj result = null;
			Obj body = mBodyForm;
			while( body.isCons() ) {
				Cons statements = (Cons)body;
				result = statements.car().eval( letEnv );
				body = statements.cdr();
			}

			if( !body.isNull() || result == null ) {
				throw new LetException( "Malformed let body.", env );
			}
			return result;
		}
	}

	public Obj process(Environment env, Obj arguments, boolean compile) {
		LetExpression result = new LetExpression(mType);
		Environment letEnv = new Frame(env, null);

		if( !arguments.isCons() ) {
			throw new LetException( "Malformed let.", env );
		}
		Cons args = (Cons)arguments;
		Obj lets = args.car();
		while( lets.isCons() ) {
			Cons clauses = (Cons)lets;
			if( !clauses.car().isCons() ) {
				throw new LetException( "Malformed let clauses.", env );
			}
			Cons let = (Cons)clauses.car();
			if( !let.car().isSymbol() ) {
				throw new LetException( "Symbol expected.", env );
			}
			if( !let.cdr().isCons() || !((Cons)let.cdr()).cdr().isNull() ) {
				throw new LetException( "Malformed let clause.", env );
			}
			Symbol letSym = (Symbol)let.car();
			Obj letVal = ((Cons)let.cdr()).car();
			if( compile ) {
				letEnv.shadow( letSym.name() );
				letVal = letVal.compile( mType == Type.SEQUENTIAL ? letEnv : env );
			}
			result.add( letSym, letVal );
			lets = clauses.cdr();
		}
		if( !lets.isNull() ) {
			throw new LetException( "Malformed let clause.", env );
		}

		// Build body last - if compiling, need the environment with shadowed variables.
		result.mBodyForm = compile ? Cons.compileList(letEnv, args.cdr()) : args.cdr();
		return result;
	}

	public Obj compile(Environment env, Obj arguments) {
		return process( env, arguments, true );
	}

	public Obj invoke( Environment env, Obj arguments ) {
		Obj compiledLet = process( env, arguments, false );
		return compiledLet.eval( env );
	}

	public String toString() { return mType == Type.PARALLEL ? "let" : "let*"; }
}
