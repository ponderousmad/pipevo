/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.repl;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStreamReader;
import java.io.PrintStream;

import functional.Environment;
import functional.Obj;

public class Interpreter {
	public static void main(String[] args) {
		launchInterpreter();
	}

	public static void launchInterpreter() {
		BufferedReader read = new BufferedReader( new InputStreamReader( System.in ) );
		PrintStream out = System.out;

		Environment env = Initialize.initWithLibraries();

		try {
			String line;
			do {
				out.print( ":" );
				line = read.readLine();
				if( line != null && line.length() > 0 ) {
					try {
						Parser parser = new Parser( line );
						Obj result;
						while( ( result = parser.parse() ) != null ) {
							out.println( result.toString() );
							out.println( result.eval(env).toString() );
						}
					} catch( Parser.ParseException ex ) {
						out.println( ex.getMessage() );
					}
				} else if( line != null ) {
					line = null;
				}
			} while( line != null );

		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
