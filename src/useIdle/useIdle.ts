import { useEffect, useState, useRef, useCallback } from 'react';

/* istanbul ignore next */
export const IS_BROWSER =
  (typeof window === 'undefined' ? 'undefined' : typeof window) === 'object'

/* istanbul ignore next */
export const DEFAULT_ELEMENT = IS_BROWSER ? document : {}

export const DEFAULT_EVENTS = [
  'mousemove',
  'keydown',
  'wheel',
  'DOMMouseScroll',
  'mousewheel',
  'mousedown',
  'touchstart',
  'touchmove',
  'MSPointerDown',
  'MSPointerMove'
]

export const DEFAULT_IDLE_TIME = 2000;
export const DEFAULT_THROTTLE_TIME = 200;

type useIdleProps = {
  element?: any;
  events?: string[];
  idleMilliSeconds?: number;
  throttleMilliSeconds?: number;
  enabled?: boolean;
  onIdle?: () => void;
  onResume?: () => void;
}

const addListeners = (events: string[], element: any, handler: Function) => {
  events.forEach((event: string) => {
    element.addEventListener(event, handler);
  });
}

const removeListeners = (events: string[], element: any, handler: Function) => {
  events.forEach((event: string) => {
    element.removeEventListener(event, handler);
  });
}

const clearTimer = (timer: NodeJS.Timeout) => {
  clearTimeout(timer);
}

const cleanup = (events: string[], element: any, handler: Function, timer: NodeJS.Timeout | null) => {
  removeListeners(events, element, handler);
  if (timer) clearTimer(timer);
}

export const useIdle = ({
  element = DEFAULT_ELEMENT,
  events = DEFAULT_EVENTS,
  idleMilliSeconds = DEFAULT_IDLE_TIME,
  throttleMilliSeconds = DEFAULT_THROTTLE_TIME,
  enabled = true,
  onIdle,
  onResume,
}: useIdleProps) => {
  const [ isIdle, setIsIdle ] = useState(true);

  const timer = useRef<NodeJS.Timeout | null>(null);
  const pageX = useRef(0);
  const pageY = useRef(0);
  const lastEventTime = useRef(Date.now());
  const wasIdle = useRef(false);

  const markAsIdle = () => {
    setIsIdle(true);
  }

  const handleEvent = useCallback((e) => {
    const currentEventTime = Date.now();

    // fallback to clientX / clientY for testing
    // since jsdom doesn't have pageX / pageY
    const currentPageX = e.pageX || e.clientX;
    const currentPageY = e.pageY || e.clientY;
  
    // mousemove
    if (e.type === 'mousemove') {
      // if coordinates are undefined, don't do anything
      // this can't be tested since jsdom gives clientX / clientY a default value of 0
      /* istanbul ignore next */
      if (typeof currentPageX === 'undefined' || typeof currentPageY === 'undefined')
        return;
      // if coordinates are the same, don't do anything
      if (currentPageX === pageX.current && currentPageY === pageY.current) return;
      // throttle event
      if (currentEventTime - lastEventTime.current < throttleMilliSeconds) {
        return;
      }
    }

    // assign mouse coordinates
    if (currentPageX && currentPageY) {
      pageX.current = currentPageX;
      pageY.current = currentPageY;
    }
    
    // capture event time
    lastEventTime.current = currentEventTime;
    setIsIdle(false);

    // timer
    /* istanbul ignore next */
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(markAsIdle, idleMilliSeconds);
  }, [element, events, idleMilliSeconds, throttleMilliSeconds, enabled]);

  useEffect(() => {
    if (!enabled) {
      cleanup(events, element, handleEvent, timer.current);
    } else {
      addListeners(events, element, handleEvent);
    }

    return () => cleanup(events, element, handleEvent, timer.current);
  }, [element, events, enabled, handleEvent]);

  useEffect(() => {
    if (!enabled) return;

    if (isIdle === true && wasIdle.current === false) {
      onIdle?.();
      wasIdle.current = true;
      return;
    }

    /* istanbul ignore next */
    if (isIdle === false && wasIdle.current === true) {
      onResume?.();
      wasIdle.current = false;
    }

  }, [isIdle, onIdle, onResume])

  return {isIdle};
}

export default useIdle;
