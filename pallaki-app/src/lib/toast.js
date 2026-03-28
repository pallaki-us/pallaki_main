export function showToast(msg) {
  const old = document.querySelector('.toast')
  if (old) old.remove()
  const t = document.createElement('div')
  t.className = 'toast'
  t.textContent = msg
  document.body.appendChild(t)
  setTimeout(() => t.remove(), 3200)
}
