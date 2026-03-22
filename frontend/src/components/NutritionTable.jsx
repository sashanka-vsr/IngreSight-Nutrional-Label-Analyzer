function NutritionTable({ nutrition, scoreBreakdown }) {

  const nutrients = [
    {
      key: 'calories',
      label: 'Calories',
      value: nutrition?.calories,
      unit: 'kcal',
      scoreKey: 'calories',
      higherIsBetter: false,
    },
    {
      key: 'total_fat',
      label: 'Total Fat',
      value: nutrition?.total_fat,
      unit: 'g',
      scoreKey: 'fat',
      higherIsBetter: false,
    },
    {
      key: 'saturated_fat',
      label: 'Saturated Fat',
      value: nutrition?.saturated_fat,
      unit: 'g',
      scoreKey: null,
      higherIsBetter: false,
    },
    {
      key: 'trans_fat',
      label: 'Trans Fat',
      value: nutrition?.trans_fat,
      unit: 'g',
      scoreKey: null,
      higherIsBetter: false,
    },
    {
      key: 'cholesterol',
      label: 'Cholesterol',
      value: nutrition?.cholesterol,
      unit: 'mg',
      scoreKey: null,
      higherIsBetter: false,
    },
    {
      key: 'sodium',
      label: 'Sodium',
      value: nutrition?.sodium,
      unit: 'mg',
      scoreKey: 'sodium',
      higherIsBetter: false,
    },
    {
      key: 'total_carbohydrates',
      label: 'Total Carbohydrates',
      value: nutrition?.total_carbohydrates,
      unit: 'g',
      scoreKey: null,
      higherIsBetter: false,
    },
    {
      key: 'dietary_fiber',
      label: 'Dietary Fiber',
      value: nutrition?.dietary_fiber,
      unit: 'g',
      scoreKey: 'fiber',
      higherIsBetter: true,
    },
    {
      key: 'total_sugars',
      label: 'Total Sugars',
      value: nutrition?.total_sugars,
      unit: 'g',
      scoreKey: 'sugar',
      higherIsBetter: false,
    },
    {
      key: 'added_sugars',
      label: 'Added Sugars',
      value: nutrition?.added_sugars,
      unit: 'g',
      scoreKey: null,
      higherIsBetter: false,
    },
    {
      key: 'protein',
      label: 'Protein',
      value: nutrition?.protein,
      unit: 'g',
      scoreKey: 'protein',
      higherIsBetter: true,
    },
  ]

  const getBarColor = (score) => {
    if (score >= 75) return '#00ff88'
    if (score >= 50) return '#ffcc00'
    if (score >= 25) return '#ff8800'
    return '#ff4444'
  }

  const filteredNutrients = nutrients.filter(n => n.value !== null && n.value !== undefined)

  return (
    <div className="nutrition-table">
      <h3 className="section-title">📊 Nutrition Breakdown</h3>

      {nutrition?.serving_size && (
        <p className="serving-info">
          Per serving: {nutrition.serving_size}
        </p>
      )}

      <div className="nutrient-list">
        {filteredNutrients.map((nutrient) => {
          const score = nutrient.scoreKey ? scoreBreakdown?.[nutrient.scoreKey] : null

          return (
            <div key={nutrient.key} className="nutrient-row">
              <div className="nutrient-info">
                <span className="nutrient-label">{nutrient.label}</span>
                <span className="nutrient-value">
                  {nutrient.value}{nutrient.unit}
                </span>
              </div>

              {score !== null && (
                <div className="nutrient-bar-container">
                  <div
                    className="nutrient-bar"
                    style={{
                      width: `${score}%`,
                      backgroundColor: getBarColor(score),
                    }}
                  />
                  <span
                    className="nutrient-score"
                    style={{ color: getBarColor(score) }}
                  >
                    {score}/100
                  </span>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="score-legend">
        <span style={{ color: '#00ff88' }}>● Excellent</span>
        <span style={{ color: '#ffcc00' }}>● Good</span>
        <span style={{ color: '#ff8800' }}>● Fair</span>
        <span style={{ color: '#ff4444' }}>● Poor</span>
      </div>
    </div>
  )
}

export default NutritionTable