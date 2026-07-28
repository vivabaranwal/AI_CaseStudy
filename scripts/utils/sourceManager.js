/* utils/sourceManager.js — Source card renderer */

function detectType(url) {
  const u = url.toLowerCase();
  if (u.includes('scholar') || u.includes('jstor') || u.includes('.edu') || u.includes('ncbi') || u.includes('pubmed')) return 'academic';
  if (u.includes('annual') || u.includes('investor') || u.includes('report') || u.includes('ibef')) return 'report';
  if (u.includes('zomato.') || u.includes('infosys.') || u.includes('.co.in/about') || u.includes('corp.')) return 'company';
  return 'news';
}

function truncateUrl(url, max = 52) {
  try {
    const u = new URL(url);
    const full = u.hostname + u.pathname;
    return full.length > max ? full.slice(0, max) + '…' : full;
  } catch { return url.length > max ? url.slice(0, max) + '…' : url; }
}

export function renderSourceCard(url, containerId, onRemove) {
  const container = document.getElementById(containerId);
  if (!container) return;
  const type  = detectType(url);
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  const card  = document.createElement('div');
  card.className = 'source-card';
  card.innerHTML = `
    <img class="source-favicon"
         src="https://www.google.com/s2/favicons?sz=32&domain_url=${encodeURIComponent(url)}"
         onerror="this.style.display='none'" alt="" />
    <span class="source-url" title="${url}">${truncateUrl(url)}</span>
    <span class="source-badge-type type-${type}">${label}</span>
    <button class="source-remove" title="Remove">×</button>`;
  card.querySelector('.source-remove').addEventListener('click', () => {
    card.style.cssText += 'opacity:0;transform:translateX(8px);transition:all 0.2s;';
    setTimeout(() => { card.remove(); if (onRemove) onRemove(url); }, 220);
  });
  container.appendChild(card);
}
