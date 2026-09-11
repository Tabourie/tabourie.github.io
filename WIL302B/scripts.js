function modalMe(videoPath) {
  const modal = document.createElement('div');

  modal.style.cssText = `
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: grid;
    place-items: center;
    padding: 24px;
    background: rgb(0 0 0 / 82%);
  `;

  modal.innerHTML = `
    <div style="width: min(960px, 100%); position: relative;">
      <button type="button" aria-label="Close video"
        style="float:right; border:0; background:transparent; color:white; font-size:2rem; cursor:pointer;">
        ×
      </button>
      <video playsinline autoplay
        style="display:block; width:100%; max-height:80vh; background:#000;"></video>
    </div>
  `;

  const video = modal.querySelector('video');
  const closeButton = modal.querySelector('button');

  function closeModal() {
    video.pause();
    modal.remove();
    document.removeEventListener('keydown', onKeyDown);
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') closeModal();
  }

  video.src = videoPath;
  closeButton.addEventListener('click', closeModal);
  modal.addEventListener('click', event => {
    if (event.target === modal) closeModal();
  });
  document.addEventListener('keydown', onKeyDown);

  document.body.appendChild(modal);
}