'use client';

import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  if (!window.Buffer) {
    (window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;
  }
}

export function ClientBufferPolyfill() {
  return null;
}
