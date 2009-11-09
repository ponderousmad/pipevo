/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import junit.framework.Test;
import junit.framework.TestSuite;

public class EvolveTestSuite {

	public static Test suite() {
		TestSuite suite = new TestSuite("Test for evolve");
		//$JUnit-BEGIN$
		suite.addTestSuite(TypeBuilderTest.class);
		suite.addTestSuite(GeneBuilderTest.class);
		suite.addTestSuite(GenomeBuilderTest.class);
		suite.addTestSuite(BreederTest.class);
		suite.addTestSuite(DarwinTest.class);
		//$JUnit-END$
		return suite;
	}

}
