/* =====================================================================
   pizza-preview.js  —  THE LIVE PIZZA DRAWING
   ---------------------------------------------------------------------
   Replaces: PizzaCanvasPreview.jsx
   The pizza is built from stacked circles (divs):
     crust  ->  sauce  ->  cheese  ->  vegetable pieces on top
   Colours change depending on the ingredient names selected.
   ===================================================================== */

const PizzaPreview = (() => {

  function sauceColor(name) {
    if (!name) return '#dc2626';
    const s = name.toLowerCase();
    if (s.includes('marinara') || s.includes('italian')) return '#dc2626';
    if (s.includes('peri')) return '#ea580c';
    if (s.includes('alfredo') || s.includes('garlic')) return '#fef08a';
    if (s.includes('bbq')) return '#78350f';
    if (s.includes('pesto')) return '#16a34a';
    return '#dc2626';
  }

  function crustStyle(name) {
    const fallback = { bg: '#e0a96d', border: '#b87c3e', shadow: 'inset 0 0 10px #975a16' };
    if (!name) return fallback;
    const b = name.toLowerCase();
    if (b.includes('thin') && !b.includes('wheat')) return { bg: '#d89b5c', border: '#a86725', shadow: 'inset 0 0 6px #78350f' };
    if (b.includes('cheese burst')) return { bg: '#f59e0b', border: '#d97706', shadow: 'inset 0 0 14px #b45309' };
    if (b.includes('wheat')) return { bg: '#a16207', border: '#78350f', shadow: 'inset 0 0 12px #451a03' };
    if (b.includes('gluten') || b.includes('herb')) return { bg: '#ca8a04', border: '#854d0e', shadow: 'inset 0 0 8px #713f12' };
    return fallback;
  }

  function cheeseColor(name) {
    if (!name) return '#fef9c3';
    if (name.includes('Vegan')) return '#fef08a';
    if (name.includes('Cheddar')) return '#f59e0b';
    if (name.includes('Gouda')) return '#fed7aa';
    return '#fef9c3';
  }

  /* Where each vegetable's little pieces sit on the pizza (top/left in %) */
  const VEG = {
    'Bell Pepper Medley': { shape: 'rect', spots: [['30%', '40%', '#22c55e'], ['65%', '35%', '#ef4444'], ['45%', '70%', '#eab308'], ['75%', '60%', '#22c55e']] },
    'Caramelized Red Onions': { shape: 'arc', spots: [['25%', '60%', '#a21caf'], ['60%', '65%', '#a21caf'], ['55%', '25%', '#a21caf']] },
    'Spanish Black Olives': { shape: 'circle', spots: [['35%', '30%', '#1e293b'], ['50%', '50%', '#1e293b'], ['70%', '45%', '#1e293b'], ['35%', '65%', '#1e293b']] },
    'Pickled Jalapeños': { shape: 'ring', spots: [['28%', '48%', '#15803d'], ['60%', '45%', '#15803d'], ['45%', '32%', '#15803d']] },
    'Button Mushrooms': { shape: 'mushroom', spots: [['40%', '55%', '#d6d3d1'], ['70%', '30%', '#d6d3d1'], ['22%', '35%', '#d6d3d1']] },
    'Sweet Golden Corn': { shape: 'dot', spots: [['35%', '45%', '#facc15'], ['50%', '38%', '#facc15'], ['65%', '55%', '#facc15'], ['40%', '62%', '#facc15'], ['60%', '25%', '#facc15']] },
    'Fresh Baby Spinach': { shape: 'leaf', spots: [['28%', '25%', '#166534'], ['50%', '60%', '#166534'], ['68%', '48%', '#166534']] },
    'Sun-Ripened Cherry Tomatoes': { shape: 'tomato', spots: [['42%', '45%', '#dc2626'], ['20%', '52%', '#dc2626'], ['62%', '68%', '#dc2626']] }
  };
  const DEFAULT_VEG = { shape: 'rect', spots: [['40%', '40%', '#22c55e'], ['60%', '55%', '#22c55e']] };

  function vegetablePieces(vegetables) {
    return vegetables.map(name => {
      const veg = VEG[name] || DEFAULT_VEG;
      return veg.spots.map(([top, left, color]) =>
        `<div class="veg veg-${veg.shape}" style="top:${top};left:${left};--c:${color}"></div>`
      ).join('');
    }).join('');
  }

  /**
   * Draw the preview into `container`.
   * state = { base, sauce, cheese, vegetables: [names], totalPrice }
   * base/sauce/cheese are inventory item objects (or null).
   */
  function render(container, state) {
    const { base, sauce, cheese, vegetables = [], totalPrice = 0 } = state;
    const crust = crustStyle(base && base.name);

    container.innerHTML = `
      <div class="preview-card">
        <div class="preview-head">
          <span class="preview-title">✨ Interactive Pizza Preview</span>
          <span class="preview-price">₱${totalPrice}</span>
        </div>

        <div class="pizza-stage">
          <div class="pizza-crust" style="background:${crust.bg};border-color:${crust.border};box-shadow:${crust.shadow}, 0 20px 25px -5px rgba(0,0,0,.5)">
            <div class="pizza-sauce" style="background:${sauceColor(sauce && sauce.name)}">
              <div class="pizza-cheese ${cheese ? '' : 'faded'}" style="background-color:${cheeseColor(cheese && cheese.name)}">
                <span class="toast-spot s1"></span><span class="toast-spot s2"></span><span class="toast-spot s3"></span>
                ${vegetablePieces(vegetables)}
              </div>
            </div>
          </div>
        </div>

        <div class="preview-summary">
          <div><span>Base:</span><strong>${UI.esc(base ? base.name : 'Not selected')}</strong></div>
          <div><span>Sauce:</span><strong>${UI.esc(sauce ? sauce.name : 'Not selected')}</strong></div>
          <div><span>Cheese:</span><strong>${UI.esc(cheese ? cheese.name : 'Not selected')}</strong></div>
          <div><span>Veggies (${vegetables.length}):</span><strong>${UI.esc(vegetables.join(', ') || 'None selected')}</strong></div>
        </div>
      </div>`;
  }

  return { render };
})();
