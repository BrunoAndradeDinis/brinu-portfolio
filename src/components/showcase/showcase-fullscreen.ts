interface RawVideoItem {
  readonly webm: string;
  readonly mp4: string;
  readonly poster?: {
    readonly src?: string;
    readonly alt?: {
      readonly 'pt-br'?: string;
      readonly en?: string;
    } | string;
  };
  readonly tag?: {
    readonly 'pt-br'?: string;
    readonly en?: string;
  } | string;
}

interface VideoItem {
  readonly webm: string;
  readonly mp4: string;
  readonly poster: string;
  readonly alt: string;
  readonly tag: string;
}

type Teardown = () => void;

export function initShowcaseFullscreen(root: HTMLElement): Teardown | undefined {
  const modal = root.querySelector<HTMLDialogElement>('[data-showcase-fullscreen-modal]');
  const scriptData = root.querySelector<HTMLScriptElement>('[data-showcase-videos-data]');
  if (!modal || !scriptData) return undefined;

  let rawVideos: RawVideoItem[] = [];
  try {
    rawVideos = JSON.parse(scriptData.textContent || '[]');
  } catch {
    return undefined;
  }
  if (!Array.isArray(rawVideos) || rawVideos.length === 0) return undefined;

  const currentLocale = (document.documentElement.lang?.toLowerCase().includes('en') ? 'en' : 'pt-br') as 'pt-br' | 'en';

  const videos: VideoItem[] = rawVideos.map((v) => {
    const posterAlt = typeof v.poster?.alt === 'object' ? v.poster.alt[currentLocale] || '' : v.poster?.alt || '';
    const tagText = typeof v.tag === 'object' ? v.tag[currentLocale] || '' : v.tag || '';
    return {
      webm: v.webm,
      mp4: v.mp4,
      poster: v.poster?.src || '',
      alt: posterAlt,
      tag: tagText,
    };
  });

  const modalVideo = modal.querySelector<HTMLVideoElement>('[data-showcase-modal-video]');
  const closeBtn = modal.querySelector<HTMLButtonElement>('[data-panel-close]');
  const prevBtn = modal.querySelector<HTMLButtonElement>('[data-showcase-modal-prev]');
  const nextBtn = modal.querySelector<HTMLButtonElement>('[data-showcase-modal-next]');
  const counterEl = modal.querySelector<HTMLElement>('[data-showcase-modal-counter]');
  const tagEl = modal.querySelector<HTMLElement>('[data-showcase-modal-tag]');
  const track = root.querySelector<HTMLElement>('[data-showcase-track]');
  const viewport = root.querySelector<HTMLElement>('[data-showcase-viewport]') ?? track;

  if (!modalVideo) return undefined;

  let currentIndex = 0;
  let isOpen = false;
  let previousActiveElement: HTMLElement | null = null;

  const renderCurrent = () => {
    const item = videos[currentIndex];
    if (!item) return;

    modalVideo.pause();
    modalVideo.poster = item.poster;
    modalVideo.setAttribute('aria-label', item.alt);

    while (modalVideo.firstChild) {
      modalVideo.removeChild(modalVideo.firstChild);
    }

    const sourceWebm = document.createElement('source');
    sourceWebm.src = item.webm;
    sourceWebm.type = 'video/webm';

    const sourceMp4 = document.createElement('source');
    sourceMp4.src = item.mp4;
    sourceMp4.type = 'video/mp4';

    modalVideo.appendChild(sourceWebm);
    modalVideo.appendChild(sourceMp4);
    modalVideo.muted = true;
    modalVideo.load();
    modalVideo.play().catch(() => {});

    if (counterEl) {
      counterEl.textContent = `${String(currentIndex + 1).padStart(2, '0')} / ${String(videos.length).padStart(2, '0')}`;
    }
    if (tagEl) {
      tagEl.textContent = item.tag;
    }
  };

  const goTo = (index: number) => {
    const total = videos.length;
    currentIndex = ((index % total) + total) % total;
    renderCurrent();
  };

  const openFullscreen = (initialIndex = 0) => {
    previousActiveElement = document.activeElement as HTMLElement | null;

    root.querySelectorAll<HTMLVideoElement>('video').forEach((v) => {
      if (v !== modalVideo) v.pause();
    });

    const total = videos.length;
    currentIndex = ((initialIndex % total) + total) % total;
    isOpen = true;

    modal.showModal();
    renderCurrent();
    closeBtn?.focus();
  };

  const closeFullscreen = () => {
    if (!isOpen) return;
    modalVideo.pause();
    modal.close();
    isOpen = false;
    previousActiveElement?.focus();
  };

  const activeIndex = () => {
    const idx = Number(root.querySelector<HTMLElement>('[data-showcase-card="media"]')?.dataset.videoIndex);
    return Number.isInteger(idx) ? idx : 0;
  };

  const onTrackDblClick = (e: MouseEvent) => {
    const card = document
      .elementsFromPoint(e.clientX, e.clientY)
      .find((el) => el instanceof HTMLElement && el.matches('[data-showcase-card="media"]'));
    if (card) openFullscreen(activeIndex());
  };

  const onTrackKeyDown = (e: KeyboardEvent) => {
    if (isOpen || e.target !== track) return;
    if (e.key === 'Enter' || e.key.toLowerCase() === 'f') {
      e.preventDefault();
      openFullscreen(activeIndex());
    }
  };

  const onPrevClick = (e: MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex - 1);
  };

  const onNextClick = (e: MouseEvent) => {
    e.stopPropagation();
    goTo(currentIndex + 1);
  };

  const onCloseClick = (e: MouseEvent) => {
    e.stopPropagation();
    closeFullscreen();
  };

  const onModalBackdropClick = (e: MouseEvent) => {
    if (e.target === modal) {
      closeFullscreen();
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      goTo(currentIndex + 1);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      goTo(currentIndex - 1);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      closeFullscreen();
    }
  };

  let touchStartX = 0;
  let touchStartY = 0;

  const onTouchStart = (e: TouchEvent) => {
    if (!isOpen || e.touches.length !== 1) return;
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
  };

  const onTouchEnd = (e: TouchEvent) => {
    if (!isOpen || e.changedTouches.length !== 1) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;
    if (Math.abs(deltaX) > 40 && Math.abs(deltaX) > Math.abs(deltaY)) {
      if (deltaX < 0) {
        goTo(currentIndex + 1);
      } else {
        goTo(currentIndex - 1);
      }
    }
  };

  viewport?.addEventListener('dblclick', onTrackDblClick);
  track?.addEventListener('keydown', onTrackKeyDown);
  closeBtn?.addEventListener('click', onCloseClick);
  prevBtn?.addEventListener('click', onPrevClick);
  nextBtn?.addEventListener('click', onNextClick);
  modal.addEventListener('click', onModalBackdropClick);
  modal.addEventListener('close', closeFullscreen);
  window.addEventListener('keydown', onKeyDown);
  modal.addEventListener('touchstart', onTouchStart, { passive: true });
  modal.addEventListener('touchend', onTouchEnd, { passive: true });

  return () => {
    viewport?.removeEventListener('dblclick', onTrackDblClick);
    track?.removeEventListener('keydown', onTrackKeyDown);
    closeBtn?.removeEventListener('click', onCloseClick);
    prevBtn?.removeEventListener('click', onPrevClick);
    nextBtn?.removeEventListener('click', onNextClick);
    modal.removeEventListener('click', onModalBackdropClick);
    modal.removeEventListener('close', closeFullscreen);
    window.removeEventListener('keydown', onKeyDown);
    modal.removeEventListener('touchstart', onTouchStart);
    modal.removeEventListener('touchend', onTouchEnd);
    if (isOpen) {
      modalVideo.pause();
      modal.close();
    }
  };
}

