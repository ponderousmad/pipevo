/* ---------------------------------------------------------------
 * Copyright © Adrian Smith.
 * Licensed under the MIT license. See license.txt at project root.
 * --------------------------------------------------------------- */
package evolve;

import java.util.List;

import evolve.Evaluator.Evaluation;

public interface Status {
	void onFail(Throwable ex, String context);
	void notify(String message);
	void updateBest(Evaluation eval);
	void updateProgress(int current, int total);
	void push(String name);
	void pop();
	void currentPopulation(List<Evaluation> evaluated);
}