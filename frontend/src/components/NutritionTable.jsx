import { useEffect, useState } from 'react';

// Maps display info to the actual field names from your NutritionData Pydantic model
// and score_breakdown keys from scoring_service.py
const NUTRIENTS = [
  { nutritionKey: 'calories',           scoreKey: 'calories', label: 'Calories',           unit: 'kcal', weight: 25 },
  { nutritionKey: 'total_sugars',       scoreKey: 'sugar',    label: 'Total Sugars',        unit: 'g',    weight: 25 },
  { nutritionKey: 'sodium',             scoreKey: 'sodium',   label: 'Sodium',              unit: 'mg',   weight: 20 },
  { nutritionKey: 'total_fat',          scoreKey: 'fat',      label: 'Total Fat',           unit: 'g',    weight: 15 },
  { nutritionKey: 'dietary_fiber',      scoreKey: 'fiber',    label: 'Dietary Fiber',       unit: 'g',    weight: 10 },
  { nutritionKey: 'protein',            scoreKey: 'protein',  label: 'Protein',             unit: 'g',    weight: 5  },
];

// Extra nutrients to display info-only (no score bar)
const EXTRA_NUTRIENTS = [
  { nutritionKey: 'saturated_fat',         label: 'Saturated Fat',        unit: 'g'  },
  { nutritionKey: 'trans_fat',             label: 'Trans Fat',            unit: 'g'  },
  { nutritionKey: 'cholesterol',           label: 'Cholesterol',          unit: 'mg' },
  { nutritionKey: 'total_carbohydrates',   label: 'Total Carbohydrates',  unit: 'g'  },
  { nutritionKey: 'added_sugars',          label: 'Added Sugars',         unit: 'g'  },
];

function subScoreColor(score) {
  if (score >= 70) return 'var(--healthy)';
  if (score >= 45) return 'var(--moderate)';
  return 'var(--unhealthy)';
}

export default function NutritionTable({ product }) {
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    setAnimated(false);
    const t = setTimeout(() => setAnimated(true), 150);
    return () => clearTimeout(t);
  }, [product?.id]);

  // nutrition is nested object: product.nutrition.calories, product.nutrition.total_fat, etc.
  const nutrition = product?.nutrition ?? {};

  // score_breakdown has keys: calories, sugar, sodium, fat, fiber, protein (values 0-100)
  const breakdown = product?.score_breakdown ?? {};

  return (
    <div className="nutrition-card">
      <div className="nutrition-card-title">Nutrient Breakdown</div>

      {/* ── Scored nutrients (with animated sub-score bar) ── */}
      {NUTRIENTS.map(({ nutritionKey, scoreKey, label, unit, weight }) => {
        const val = nutrition[nutritionKey];
        const sub = breakdown[scoreKey] ?? null;

        // Skip if we have neither value nor score
        if (val == null && sub == null) return null;

        const barWidth = sub ?? 50;
        const color = subScoreColor(barWidth);

        return (
          <div className="nutrient-row" key={nutritionKey}>
            <div className="nutrient-name">{label}</div>
            <div className="nutrient-value">
              {val != null ? `${val} ${unit}` : '—'}
            </div>
            <div className="nutrient-bar-wrap">
              <div className="nutrient-bar-track">
                <div
                  className="nutrient-bar-fill"
                  style={{
                    width: animated ? `${barWidth}%` : '0%',
                    background: color,
                  }}
                />
              </div>
            </div>
          </div>
        );
      })}

      {/* ── Extra nutrients (info only, no score bar) ─────── */}
      {EXTRA_NUTRIENTS.map(({ nutritionKey, label, unit }) => {
        const val = nutrition[nutritionKey];
        if (val == null) return null;
        return (
          <div className="nutrient-row" key={nutritionKey} style={{ opacity: 0.75 }}>
            <div className="nutrient-name" style={{ color: 'var(--text-secondary)' }}>{label}</div>
            <div className="nutrient-value">{val} {unit}</div>
            <div className="nutrient-bar-wrap" />
          </div>
        );
      })}

      {/* ── Serving info ──────────────────────────────────── */}
      {(nutrition.serving_size || nutrition.servings_per_container) && (
        <div className="text-muted" style={{ marginTop: '1rem', fontSize: '0.78rem' }}>
          {nutrition.serving_size && <>Serving size: {nutrition.serving_size}</>}
          {nutrition.serving_size && nutrition.servings_per_container && ' · '}
          {nutrition.servings_per_container && <>Servings per container: {nutrition.servings_per_container}</>}
        </div>
      )}

      {/* ── Scoring weights note ──────────────────────────── */}
      <div className="text-muted" style={{
        marginTop: '0.75rem',
        fontSize: '0.78rem',
        borderTop: '1px solid var(--border-default)',
        paddingTop: '0.75rem'
      }}>
        Scoring weights — Calories & Sugar: 25% each · Sodium: 20% · Fat: 15% · Fiber: 10% · Protein: 5%
      </div>
    </div>
  );
}