/* =====================================================================
   admin-inventory.js  —  STOCK MANAGEMENT  (replaces admin/AdminInventory.jsx)
   Filter + search, quick restock (+10 / +25), edit modal, stock audit.
   ===================================================================== */
(function () {
  if (!Auth.requireAdmin()) return;

  const el = id => document.getElementById(id);
  let filter = 'all';        // all | base | sauce | cheese | vegetable | low
  let search = '';
  let editingId = null;

  function stockCell(item) {
    const low = Store.isLowStock(item);
    const out = item.stockQuantity <= 0;
    return `<span class="stock-num ${out ? 'text-red' : low ? 'text-amber' : ''}">${item.stockQuantity} <small>${UI.esc(item.unit)}</small></span>`;
  }

  function render() {
    const all = Store.getInventory();
    const lowCount = all.filter(Store.isLowStock).length;

    /* warning bar */
    el('low-warning').hidden = lowCount === 0;
    el('low-warning-text').textContent = `${lowCount} ingredient(s) are at or below their safety threshold.`;

    /* apply filter + search */
    const rows = all.filter(i => {
      const matchFilter = filter === 'all' ? true : filter === 'low' ? Store.isLowStock(i) : i.category === filter;
      const matchSearch = i.name.toLowerCase().includes(search.toLowerCase());
      return matchFilter && matchSearch;
    });

    el('inv-body').innerHTML = rows.length === 0
      ? '<tr><td colspan="6" class="center muted" style="padding:40px">No ingredients match.</td></tr>'
      : rows.map(i => `
          <tr>
            <td><span class="name">${UI.esc(i.name)}</span><span class="desc">${UI.esc(i.description)}</span></td>
            <td><span class="cat">${UI.esc(i.category)}</span></td>
            <td>${UI.peso(i.price)}</td>
            <td>${stockCell(i)}</td>
            <td>${i.threshold}</td>
            <td>
              <div class="restock-btns">
                <button class="restock" data-restock="${i.id}" data-qty="10">+10</button>
                <button class="restock" data-restock="${i.id}" data-qty="25">+25</button>
                <button class="btn btn-light btn-sm" data-edit="${i.id}">Edit</button>
              </div>
            </td>
          </tr>`).join('');
  }

  /* ---------- filter tabs & search ---------- */
  el('inv-tabs').addEventListener('click', e => {
    const tab = e.target.closest('.tab');
    if (!tab) return;
    filter = tab.dataset.filter;
    document.querySelectorAll('#inv-tabs .tab').forEach(t => t.classList.toggle('active', t === tab));
    render();
  });
  el('inv-search').addEventListener('input', e => { search = e.target.value; render(); });
  el('show-low').addEventListener('click', () => {
    filter = 'low';
    document.querySelectorAll('#inv-tabs .tab').forEach(t => t.classList.toggle('active', t.dataset.filter === 'low'));
    render();
  });

  /* ---------- restock and edit buttons ---------- */
  el('inv-body').addEventListener('click', e => {
    const restock = e.target.closest('[data-restock]');
    const edit = e.target.closest('[data-edit]');

    if (restock) {
      try {
        const item = Store.restockItem(restock.dataset.restock, restock.dataset.qty);
        UI.toast(`Added ${restock.dataset.qty} to ${item.name}.`, 'success');
      } catch (err) { UI.toast(err.message, 'error'); }
    }
    if (edit) openModal(edit.dataset.edit);
  });

  /* ---------- edit modal ---------- */
  const modal = el('edit-modal');

  function openModal(id) {
    const item = Store.getInventory().find(i => i.id === id);
    editingId = id;
    el('edit-title').textContent = item.name;
    el('edit-stock').value = item.stockQuantity;
    el('edit-threshold').value = item.threshold;
    el('edit-price').value = item.price;
    modal.hidden = false;
  }
  const closeModal = () => { modal.hidden = true; editingId = null; };

  el('edit-close').addEventListener('click', closeModal);
  el('edit-cancel').addEventListener('click', closeModal);
  modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });

  el('edit-form').addEventListener('submit', e => {
    e.preventDefault();
    try {
      Store.updateInventoryItem(editingId, {
        stockQuantity: el('edit-stock').value,
        threshold: el('edit-threshold').value,
        price: el('edit-price').value
      });
      UI.toast('Inventory item updated.', 'success');
      closeModal();
    } catch (err) { UI.toast(err.message, 'error'); }
  });

  /* ---------- stock audit (replaces the cron job) ---------- */
  el('audit-btn').addEventListener('click', () => {
    const result = Store.runThresholdAudit();
    const box = el('audit-result');
    box.className = 'banner ' + (result.count ? 'banner-warning' : 'banner-success');
    box.innerHTML = `<div><b>${result.count ? '⚠️ Audit complete' : '✅ Audit complete'}</b>${UI.esc(result.message)}</div>`;
    box.hidden = false;
  });

  Store.onChange(render);
  render();
})();
