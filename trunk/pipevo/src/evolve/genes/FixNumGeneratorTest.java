/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import evolve.Context;
import evolve.ObjectRegistry;
import functional.FixNum;
import functional.Obj;
import functional.type.BaseType;
import junit.framework.TestCase;

public class FixNumGeneratorTest extends TestCase {

	public void testType() {
		FixNumGenerator gene = new FixNumGenerator(1);
		assertEquals(gene.type(),BaseType.FIXNUM);
	}

	public void testExpress() {
		FixNumGenerator gene = new FixNumGenerator(102,0,100);
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertTrue(phene instanceof FixNum);
		assertEquals(((FixNum)phene).value(),1);
	}

}
