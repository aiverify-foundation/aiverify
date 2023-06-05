import moment from 'moment';
import { WheelEvent } from 'react';


export function formatDate(d: any): string {
  return moment(d).format('D MMM YYYY, HH:mm:ss');
}

export function changeWheelSpeed(el: HTMLDivElement, speedY: number) {
  let removed = false;
  let scrollY = 0;
  const handleMouseWheel: unknown = function (e: WheelEvent) {
    e.preventDefault();
    scrollY += speedY * e.deltaY;
    if (scrollY < 0) {
      scrollY = 0;
    } else {
      const limitY = el.scrollHeight - el.clientHeight;
      if (scrollY > limitY) {
        scrollY = limitY;
      }
    }
    el.scrollTop = scrollY;
  };
  el.addEventListener('mousewheel', handleMouseWheel as EventListener, { passive: false, capture: false });
  return function () {
    if (removed) return;
    el.removeEventListener('mousewheel', handleMouseWheel as EventListener, false);
    removed = true;
  };
}
