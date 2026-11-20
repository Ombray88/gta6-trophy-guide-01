// Leonida Trophy Tracker - app.js

document.addEventListener('DOMContentLoaded', async () => {
  let trophies = [];
  let earnedSet = new Set();

  // Load earned from localStorage
  try {
    const saved = localStorage.getItem('gta6-trophy-checklist');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed)) {
        earnedSet = new Set(parsed);
      }
    }
  } catch (e) {
    console.error('Failed to load checklist from localStorage', e);
  }

  // Fetch trophies.json
  try {
    const res = await fetch('data/trophies.json');
    const data = await res.json();
    trophies = data.trophies || [];
  } catch (e) {
    console.error('Failed to fetch trophies.json', e);
  }

  // DOM elements
  const searchInput = document.getElementById('search');
  const kindSelect = document.getElementById('kind');
  const gradeSelect = document.getElementById('grade');
  const spoilerCheckbox = document.getElementById('spoiler');
  const unearnedOnlyCheckbox = document.getElementById('unearned-only');
  const exportBtn = document.getElementById('export');
  const importInput = document.getElementById('import');
  const rowsContainer = document.getElementById('rows');
  const progressText = document.getElementById('progress');
  const progressBar = document.getElementById('progress-bar');

  // Set spoiler ON by default
  if (spoilerCheckbox) {
    spoilerCheckbox.checked = true;
  }

  // Ensure #showing element exists before #rows
  let showingEl = document.getElementById('showing');
  if (!showingEl && rowsContainer && rowsContainer.parentNode) {
    showingEl = document.createElement('div');
    showingEl.id = 'showing';
    showingEl.className = 'showing-count';
    showingEl.style.marginBottom = '12px';
    showingEl.style.fontSize = '0.9rem';
    showingEl.style.color = 'var(--text-muted, #888)';
    rowsContainer.parentNode.insertBefore(showingEl, rowsContainer);
  }

  // Apply URL params on load before first render
  const urlParams = new URLSearchParams(window.location.search);
  if (urlParams.has('search') && searchInput) {
    searchInput.value = urlParams.get('search');
  }
  if (urlParams.has('kind') && kindSelect) {
    kindSelect.value = urlParams.get('kind');
  }
  if (urlParams.has('grade') && gradeSelect) {
    gradeSelect.value = urlParams.get('grade');
  }
  if (urlParams.has('spoiler') && spoilerCheckbox) {
    const sp = urlParams.get('spoiler');
    if (sp === 'off' || sp === 'false' || sp === '0') {
      spoilerCheckbox.checked = false;
    }
  }
  if (urlParams.has('view') && urlParams.get('view') === 'roadmap') {
    const roadmapEl = document.getElementById('roadmap');
    if (roadmapEl) {
      setTimeout(() => roadmapEl.scrollIntoView({ behavior: 'auto' }), 100);
    }
  }
  if (urlParams.has('view') && urlParams.get('view') === 'rows') {
    const roadmapEl = document.getElementById('roadmap');
    if (roadmapEl) roadmapEl.style.display = 'none';
    const warningEl = document.querySelector('.missable-warning-box');
    if (warningEl) warningEl.style.display = 'none';
  }

  // Render function
  function render() {
    const searchTerm = (searchInput ? searchInput.value : '').toLowerCase().trim();
    const kindVal = kindSelect ? kindSelect.value : 'all';
    const gradeVal = gradeSelect ? gradeSelect.value : 'all';
    const hideSpoilers = spoilerCheckbox ? spoilerCheckbox.checked : true;
    const unearnedOnly = unearnedOnlyCheckbox ? unearnedOnlyCheckbox.checked : false;

    let filtered = trophies.filter(t => {
      // Unearned only filter
      const isEarned = earnedSet.has(t.name);
      if (unearnedOnly && isEarned) return false;

      // Grade filter
      if (gradeVal !== 'all' && t.grade !== gradeVal) return false;

      // Kind filter
      if (kindVal === 'missable') {
        if (!t.missable && t.kind !== 'missable') return false;
      } else if (kindVal !== 'all') {
        if (t.kind !== kindVal) return false;
      }

      // Search filter (name, description, guide)
      if (searchTerm) {
        const nameMatch = t.name.toLowerCase().includes(searchTerm);
        const descMatch = t.description.toLowerCase().includes(searchTerm);
        const guideMatch = t.guide.toLowerCase().includes(searchTerm);
        if (!nameMatch && !descMatch && !guideMatch) return false;
      }

      return true;
    });

    // Update showing count
    if (showingEl) {
      showingEl.textContent = `Showing ${filtered.length} of ${trophies.length} trophies`;
    }

    // Update progress
    const earnedCount = earnedSet.size;
    if (progressText) {
      progressText.textContent = `${earnedCount} of 55 earned`;
    }
    if (progressBar) {
      const pct = Math.min(100, Math.max(0, (earnedCount / 55) * 100));
      progressBar.style.width = `${pct}%`;
    }

    // Platinum banner / line when all 55 earned
    let platinumBanner = document.getElementById('platinum-banner');
    if (earnedCount === 55) {
      if (!platinumBanner && rowsContainer && rowsContainer.parentNode) {
        platinumBanner = document.createElement('div');
        platinumBanner.id = 'platinum-banner';
        platinumBanner.className = 'platinum-banner';
        platinumBanner.innerHTML = '🏆 <strong>Leonida Legend!</strong> All 55 trophies earned! Platinum unlocked!';
        platinumBanner.style.background = 'linear-gradient(135deg, #e5e4e2, #b4b4b4)';
        platinumBanner.style.color = '#111';
        platinumBanner.style.padding = '12px 16px';
        platinumBanner.style.borderRadius = '8px';
        platinumBanner.style.marginBottom = '16px';
        platinumBanner.style.textAlign = 'center';
        platinumBanner.style.fontWeight = 'bold';
        rowsContainer.parentNode.insertBefore(platinumBanner, rowsContainer);
      } else if (platinumBanner) {
        platinumBanner.style.display = 'block';
      }
    } else {
      if (platinumBanner) {
        platinumBanner.style.display = 'none';
      }
    }

    // Render trophy rows/cards
    if (!rowsContainer) return;
    if (filtered.length === 0) {
      rowsContainer.innerHTML = '<div class="no-trophies" style="padding: 24px; text-align: center; color: var(--text-muted, #888);">No trophies match your current filters.</div>';
      return;
    }

    rowsContainer.innerHTML = filtered.map(t => {
      const isEarned = earnedSet.has(t.name);
      const isStory = t.kind === 'story';
      const hideDetails = hideSpoilers && isStory && !isEarned;

      const displayName = hideDetails ? 'Hidden story trophy — earn it to reveal' : escapeHtml(t.name);
      const displayDesc = hideDetails ? 'Complete the story mission to reveal description.' : escapeHtml(t.description);
      const displayGuide = hideDetails ? 'Guide hidden until earned or spoiler filter disabled.' : escapeHtml(t.guide);

      const sourcesHtml = (t.sources || []).map(s => 
        `<a href="${escapeHtml(s.url)}" target="_blank" rel="noopener" class="source-link">${escapeHtml(s.name)}</a>`
      ).join(', ');

      return `
        <div class="trophy-card ${isEarned ? 'earned' : ''}" data-name="${escapeHtml(t.name)}">
          <div class="trophy-header">
            <label class="trophy-checkbox-label">
              <input type="checkbox" class="trophy-checkbox" data-trophy-name="${escapeHtml(t.name)}" ${isEarned ? 'checked' : ''}>
              <span class="trophy-name">${displayName}</span>
            </label>
            <div class="trophy-badges">
              <span class="badge grade-${t.grade}">${t.grade.toUpperCase()}</span>
              <span class="badge kind-${t.kind}">${t.kind}</span>
              <span class="badge stage-badge">Stage ${t.stage}</span>
              ${t.missable ? '<span class="badge badge-missable">MISSABLE</span>' : ''}
            </div>
          </div>
          <div class="trophy-body">
            <p class="trophy-desc"><em>${displayDesc}</em></p>
            <p class="trophy-guide"><strong>Guide:</strong> ${displayGuide}</p>
            ${sourcesHtml ? `<div class="trophy-sources"><strong>Sources:</strong> ${sourcesHtml}</div>` : ''}
          </div>
        </div>
      `;
    }).join('');

    // Attach event listeners to checkboxes
    rowsContainer.querySelectorAll('.trophy-checkbox').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const name = e.target.getAttribute('data-trophy-name');
        if (e.target.checked) {
          earnedSet.add(name);
        } else {
          earnedSet.delete(name);
        }
        saveAndRender();
      });
    });
  }

  function saveAndRender() {
    try {
      localStorage.setItem('gta6-trophy-checklist', JSON.stringify(Array.from(earnedSet)));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    render();
  }

  function escapeHtml(str) {
    if (!str) return '';
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  // Event listeners for filters
  if (searchInput) searchInput.addEventListener('input', render);
  if (kindSelect) kindSelect.addEventListener('change', render);
  if (gradeSelect) gradeSelect.addEventListener('change', render);
  if (spoilerCheckbox) spoilerCheckbox.addEventListener('change', render);
  if (unearnedOnlyCheckbox) unearnedOnlyCheckbox.addEventListener('change', render);

  // Export progress
  if (exportBtn) {
    exportBtn.addEventListener('click', () => {
      const dataStr = JSON.stringify(Array.from(earnedSet), null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'trophy-progress.json';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    });
  }

  // Import progress
  if (importInput) {
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const json = JSON.parse(event.target.result);
          if (Array.isArray(json)) {
            const validNames = new Set(trophies.map(t => t.name));
            const newEarned = json.filter(name => validNames.has(name));
            earnedSet = new Set(newEarned);
            saveAndRender();
            alert(`Successfully imported ${earnedSet.size} earned trophies.`);
          } else {
            alert('Invalid JSON format: expected an array of trophy names.');
          }
        } catch (err) {
          alert('Failed to parse JSON file.');
          console.error(err);
        }
        importInput.value = ''; // reset input
      };
      reader.readAsText(file);
    });
  }

  // Initial render
  render();
});
