/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.repl;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.net.URL;

import functional.Environment;
import functional.Frame;
import functional.Obj;
import functional.functions.List;
import functional.functions.Numeric;
import functional.functions.Types;
import functional.special.Special;

public class Initialize {
	public static Environment init() {
		Environment env = new Frame();

		List.install( env );
		Numeric.install( env );
		Types.install( env );

		Special.install(env);

		return env;
	}

	public static Environment initWithLibraries() {
		Environment env = init();

		String[] libraries = new String[]{"consCombos.slur", "list.slur", "map.slur", "reduce.slur", "reverse.slur"};

		for( String library : libraries) {
			loadLibrary(library, env);
		}

		return env;
	}

	private static void loadLibrary(String library, Environment env) {
		try {
			URL path = ClassLoader.getSystemResource("slur/" + library);
			if( path == null ) {
				return;
			}
			String filePath = path.getFile();
			BufferedReader read = new BufferedReader(new FileReader(filePath));
			String line;
			StringBuffer buffer = new StringBuffer();
			do {
				line = read.readLine();
				if( line != null) {
					buffer.append(line);
					buffer.append(" ");
				}
			}
			while(line!=null);
			String contents = buffer.toString();
			if( contents.length() > 0 ) {
				try {
					Parser parser = new Parser( contents );
					Obj result;
					while( ( result = parser.parse() ) != null ) {
						result = result.compile(env);
						result.eval(env);
					}
				} catch( Parser.ParseException ex ) {
					ex.printStackTrace();
				}
			}

		} catch (IOException e) {
			e.printStackTrace();
		}
	}
}
