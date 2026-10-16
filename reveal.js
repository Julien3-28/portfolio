(function () {
  // Apparition progressive des blocs au defilement, facon pages produit Apple.
  // Si le navigateur ne sait pas observer, ou si l'utilisateur prefere moins
  // d'animations, tout reste visible : rien n'est jamais cache durablement.
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduce || !('IntersectionObserver' in window)) return;

  var targets = document.querySelectorAll(
    '.section-head, .detail-split, .info-grid, .gallery, .stat-row, ' +
    '.work-grid, .teaser-grid, .spec-list, .location-grid, .tool-row, ' +
    '.contact-card, .doc-card, .video-frame, .org-row'
  );

  Array.prototype.forEach.call(targets, function (el) {
    // le premier ecran reste visible d'emblee : pas d'animation au chargement
    if (el.getBoundingClientRect().top < window.innerHeight * 0.9) return;
    el.classList.add('reveal');
  });

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 });

  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
})();
