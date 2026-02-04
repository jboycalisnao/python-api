
import { HistoricalRecord, MonthlyParameters } from '../../types';

export class TransitionAnalyzer {
  /**
   * Analyzes Markov transitions and Semi-Markov spell lengths per month.
   */
  static analyze(data: HistoricalRecord[]): Partial<MonthlyParameters>[] {
    const counts: Record<number, { d_to_w: number; d_to_d: number; w_to_w: number; w_to_d: number }> = {};
    const spells: Record<number, { dry: number[]; wet: number[] }> = {};
    
    for (let i = 1; i <= 12; i++) {
      counts[i] = { d_to_w: 0, d_to_d: 0, w_to_w: 0, w_to_d: 0 };
      spells[i] = { dry: [], wet: [] };
    }

    let currentSpellLength = 1;
    let isCurrentWet = data[0].rain_mm > 0.1;

    for (let i = 0; i < data.length - 1; i++) {
      const current = data[i];
      const next = data[i + 1];
      const date = new Date(current.date);
      const month = date.getMonth() + 1;

      const isNextWet = next.rain_mm > 0.1;

      // Markov transition counts
      if (!isCurrentWet) {
        if (isNextWet) counts[month].d_to_w++;
        else counts[month].d_to_d++;
      } else {
        if (isNextWet) counts[month].w_to_w++;
        else counts[month].w_to_d++;
      }

      // Spell length tracking
      if (isNextWet === isCurrentWet) {
        currentSpellLength++;
      } else {
        // Spell ended
        if (isCurrentWet) spells[month].wet.push(currentSpellLength);
        else spells[month].dry.push(currentSpellLength);
        
        currentSpellLength = 1;
        isCurrentWet = isNextWet;
      }
    }

    return Object.entries(counts).map(([monthStr, c]) => {
      const month = parseInt(monthStr);
      const s = spells[month];
      
      const avgDry = s.dry.length > 0 ? s.dry.reduce((a, b) => a + b, 0) / s.dry.length : 1 / (c.d_to_w / (c.d_to_w + c.d_to_d || 1));
      const avgWet = s.wet.length > 0 ? s.wet.reduce((a, b) => a + b, 0) / s.wet.length : 1 / (1 - (c.w_to_w / (c.w_to_w + c.w_to_d || 1)));

      return {
        month,
        p01: c.d_to_w / (c.d_to_w + c.d_to_d || 1),
        p11: c.w_to_w / (c.w_to_w + c.w_to_d || 1),
        avgDrySpell: parseFloat(avgDry.toFixed(2)),
        avgWetSpell: parseFloat(avgWet.toFixed(2))
      };
    });
  }
}
