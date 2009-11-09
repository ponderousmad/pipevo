/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.repl;

import functional.Cons;
import functional.FixNum;
import functional.Null;
import functional.Obj;
import functional.Real;
import functional.StringObj;
import functional.Symbol;
import functional.True;

public class Parser {
	public static class ParseException extends RuntimeException {
		private static final long serialVersionUID = 5694742982275844142L;

		public ParseException( String message ) {
			super( message );
		}
	}

	int mOffset = 0;
	boolean mIsEscape = false;
	String mString = null;

	public Parser() {
	}

	public Parser( String string ) {
		mOffset = 0;
		mString = string;
	}

	public static Obj parse( String string ) {
		Parser parser = new Parser( string );
		Obj result = parser.parse();
		return result;
	}

	public Obj parse() {
		skipCommentsAndWhitespace();
		if( !charsLeft() ) {
			return null;
		}
		if( isOpen() ) {
			return parseCons( true, false );
		}
		if( isDoubleQuote() ) {
			return parseString();
		}
		if( isNumber() ) {
			Obj number = parseNumber();
			if( charsLeft() && !( isWhitespace() ||
								  isOpen() ||
								  isClose() ) )
			{
				throw new ParseException( "Unexpected character after number" );
			}
			return number;
		}
		if( mString.startsWith( "#t", mOffset ) ) {
			mOffset += 2;
			return True.TRUE;
		}
		if( isQuote() ) {
			++mOffset;
			return new Cons( new Symbol("quote"), new Cons( parse(), Null.NULL ) );
		}
		Obj symbol = parseSymbol();
		if( symbol != null ) {
			return symbol;
		}
		throw new ParseException("Invalid expression.");
	}

	private Obj parseSymbol() {
		int start = mOffset;
		while( charsLeft() && isSymbolChar( mString.charAt( mOffset ) ) ) {
			++mOffset;
		}
		if( charsLeft() && !( isWhitespace() || isParen() ) ) {
			throw new ParseException( "Unexpected end of symbol." );
		}
		if( start == mOffset ) {
			return null;
		}
		return new Symbol( mString.substring( start, mOffset ) );
	}

	private Obj parseString() {
		mIsEscape = false;
		++mOffset;
		StringBuffer result = new StringBuffer();
		while( charsLeft() && !endOfString() ) {
			if( !mIsEscape ) {
				result.append( mString.charAt( mOffset ) );
			}
			++mOffset;
		}
		if( !charsLeft() ) {
			throw new ParseException( "Could not find end of string." );
		}
		++mOffset;
		return new StringObj( result.toString() );
	}

	private boolean endOfString() {
		if( mIsEscape ) {
			mIsEscape = false;
			return false;
		}
		if( mString.charAt( mOffset ) == '\\' ) {
			mIsEscape = true;
			return false;
		}
		return mString.charAt( mOffset ) == '"';
	}

	private Obj parseNumber() {
		int numberStart = mOffset;
		boolean negative = isMinus();
		if( negative ) ++mOffset;

		int wholeStart = mOffset;
		while( charsLeft() && isDigit( mString.charAt(mOffset) ) ) {
			++mOffset;
		}
		int wholeEnd = mOffset;
		boolean isReal = false;
		if( charsLeft() ) {
			isReal = isDot();
			if( isReal ) {
				++mOffset;
				int decimalStart = mOffset;
				while( charsLeft() && isDigit( mString.charAt(mOffset) ) ) {
					++mOffset;
				}
				int decimalEnd = mOffset;
				if( wholeStart == wholeEnd && decimalStart == decimalEnd ) {
					throw new ParseException( "Number expected, not found:" + mString.substring(numberStart,mOffset) );
				}
			}
			if( mString.startsWith("e",mOffset) ) {
				isReal = true;
				++mOffset;
				if( isMinus() ) ++mOffset;
				int exponentStart = mOffset;
				while( charsLeft() && isDigit( mString.charAt(mOffset) ) ) {
					++mOffset;
				}
				int exponentEnd = mOffset;
				if( exponentStart == exponentEnd ) {
					throw new ParseException( "Number expected, not found:" + mString.substring(numberStart,mOffset) );
				}
			}
		}
		if( !isReal )
		{
			if( wholeStart == wholeEnd ) {
				throw new ParseException( "Number expected, not found:" + mString.substring(numberStart,mOffset));
			}
			return new FixNum( Integer.valueOf( mString.substring( numberStart, mOffset )));
		}
		return new Real( Double.valueOf( mString.substring( numberStart, mOffset )));
	}

	private Obj parseCons( boolean areStart, boolean justCdr ) {
		if( areStart ) {
			++mOffset;
		}
		skipCommentsAndWhitespace();

		if( !charsLeft() ) {
			throw new ParseException( "Missing ')'" );
		}
		if( isClose() ) {
			if( justCdr ) {
				throw new ParseException( "Cannot follow '.' with ')'" );
			}
			++mOffset;
			return Null.NULL;
		}
		if( isDot() ) {
			++mOffset;
			if( !charsLeft() ) {
				throw new ParseException( "Missing ')'" );
			}
			if( isWhitespace() ) {
				if( areStart ) {
					return new Cons( Null.NULL, parseCons( false, true ) );
				} else {
					if( justCdr ) {
						throw new ParseException( "Multiple '.' in list" );
					}
					return parseCons( false, true );
				}
			} else {
				--mOffset;
			}
		} else if( justCdr ) {
			Obj cdr = parse();
			skipCommentsAndWhitespace();
			if( !isClose() ) {
				throw new ParseException( "List with '.' had multiple cdr items." );
			}
			++mOffset;
			return cdr;
		}
		Obj car = parse();
		Obj cdr = parseCons( false, false );
		return new Cons( car, cdr );
	}

	private boolean charsLeft() {
		return mOffset < mString.length();
	}

	private boolean isNumber() {
		if( isMinus() ) {
			++mOffset;
			boolean result = charsLeft() && ( isDigit() || isDot() );
			--mOffset;
			return result;
		}
		return isDot() || isDigit();
	}

	private boolean isMinus() {
		return mString.charAt( mOffset ) == '-';
	}

	private boolean isDigit(char c) {
		return '0' <= c && c <= '9';
	}

	private boolean isDigit() {
		return isDigit( mString.charAt(mOffset) );
	}

	private boolean isDot() {
		return mString.startsWith( ".", mOffset );
	}

	private boolean isSymbolChar( char c ) {
		return isAlphaNum( c ) || ( "_+-*/<>|&^%$@=?".indexOf( c ) != -1 );
	}

	private boolean isAlphaNum(char c) {
		return ( 'a' <= c && c <= 'z' ) ||
			   ( 'A' <= c && c <= 'Z' ) ||
			   ( '0' <= c && c <= '9' );
	}

	private boolean isQuote() {
		return mString.charAt( mOffset ) == '\'';
	}

	private boolean isDoubleQuote() {
		return mString.charAt( mOffset ) == '"';
	}

	private boolean isOpen() {
		return mString.charAt( mOffset ) == '(';
	}

	private boolean isClose() {
		return mString.startsWith(")",mOffset );
	}

	private boolean isParen() {
		return isOpen() || isClose();
	}

	private boolean isWhitespace() {
		String whitespace = " \t\n\r";
		return whitespace.indexOf( mString.charAt(mOffset) ) != -1;
	}

	private boolean isLineBreak() {
		Character nextChar = mString.charAt(mOffset);
		return nextChar == '\n' || nextChar == '\r';
	}

	private boolean isCommentStart() {
		return mString.charAt(mOffset) == ';';
	}

	private void skipCommentsAndWhitespace() {
		while( charsLeft() && ( isCommentStart() || isWhitespace() ) ) {
			if( isCommentStart() ) {
				while( charsLeft() && !isLineBreak() ) {
					++mOffset;
				}
			} else {
				++mOffset;
			}
		}
	}
}
