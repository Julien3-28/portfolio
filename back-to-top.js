(function () {
  // Bouton "retour en haut" : apparaît après un peu de défilement,
  // ramène en haut de page en douceur (sauf si l'utilisateur préfère
  // réduire les animations).
  var btn = document.createElement('button');
  btn.className = 'back-to-top';
  btn.type = 'button';
    btn.innerHTML =
    '<svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" ' +
    'stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">' +
    '<path d="M12 19V5"/><path d="M5 12l7-7 7 7"/></svg>' +
    '<span>Haut de page</span>';
  document.body.appendChild(btn);

  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  btn.addEventListener('click', function () {
    window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
  });

  function update() {
    btn.classList.toggle('visible', window.scrollY > 400);
  }
  window.addEventListener('scroll', update, { passive: true });
  update();
})();
