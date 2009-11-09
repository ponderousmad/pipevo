/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import evolve.Context;
import evolve.ObjectRegistry;
import functional.StringObj;
import functional.Obj;
import functional.type.BaseType;
import junit.framework.TestCase;

public class StringGeneratorTest extends TestCase {
	public void testType() {
		StringGenerator gene = new StringGenerator(1L,5);
		assertEquals(gene.type(),BaseType.STRING);
	}

	public void testExpress() {
		StringGenerator gene = new StringGenerator(1L,5);
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertTrue(phene instanceof StringObj);
		String value = ((StringObj)phene).value();
		assertNotNull(value);
		assertEquals(value.length(),5);
	}
}
