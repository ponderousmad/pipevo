/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package functional.type;

import junit.framework.Test;
import junit.framework.TestSuite;

public class TypeTestSuite {

	public static Test suite() {
		TestSuite suite = new TestSuite("Test for functional.type");
		//$JUnit-BEGIN$
		suite.addTestSuite(BaseTypeTest.class);
		suite.addTestSuite(MaybeTest.class);
		suite.addTestSuite(ConsTypeTest.class);
		suite.addTestSuite(ListTypeTest.class);
		suite.addTestSuite(FunctionTypeTest.class);
		suite.addTestSuite(ParameterTest.class);
		suite.addTestSuite(ParameterMappingTest.class);
		suite.addTestSuite(ParameterUtilsTest.class);
		suite.addTestSuite(MatchTest.class);
		suite.addTestSuite(CompareTypesTest.class);
		//$JUnit-END$
		return suite;
	}

}
