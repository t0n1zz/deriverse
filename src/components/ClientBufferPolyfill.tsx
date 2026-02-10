'use client';

import { Buffer } from 'buffer';

if (typeof window !== 'undefined') {
  if (!window.Buffer) {
    // @ts-ignore
    window.Buffer = Buffer;
  }
}

export function ClientBufferPolyfill() {
  return null;
}
