/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve.genes;

import evolve.Context;
import evolve.ObjectRegistry;
import functional.Obj;
import functional.Real;
import functional.type.BaseType;
import junit.framework.TestCase;

public class RealGeneratorTest extends TestCase {

	public void testType() {
		RealGenerator gene = new RealGenerator(1);
		assertEquals(gene.type(),BaseType.REAL);
	}

	public void testExpress() {
		RealGenerator gene = new RealGenerator(101,new RealGenerator.Range(0,100));
		Obj phene = gene.express(new Context(new ObjectRegistry()));
		assertNotNull(phene);
		assertTrue(phene instanceof Real);
		double value = ((Real)phene).value();
		assertTrue( 0 <= value && value <= 100 );
	}

}
