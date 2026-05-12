'use client';

import React from 'react';

export function PlasticButton({ text, onClick }: { text: string; onClick?: () => void }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'relative',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '0.4rem 1rem',
        borderRadius: '9999px',
        color: 'white',
        fontWeight: 500,
        fontSize: '0.875rem',
        transition: 'all 200ms',
        background: 'linear-gradient(to bottom, rgb(140, 82, 255), rgb(108, 92, 231))',
        boxShadow: '0 2px 8px 0 rgba(108, 92, 231, 0.35), 0 1.5px 0 0 rgba(255,255,255,0.25) inset, 0 -2px 8px 0 rgba(108, 92, 231, 0.5) inset',
        border: 'none',
        cursor: 'pointer',
      }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.98)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      <span style={{ position: 'relative', zIndex: 10 }}>{text}</span>
      <span
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          zIndex: 20,
          width: '80%',
          height: '40%',
          transform: 'translateX(-50%)',
          borderTopLeftRadius: '9999px',
          borderTopRightRadius: '9999px',
          pointerEvents: 'none',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.25) 0%, rgba(255,255,255,0) 80%, transparent 100%)',
          filter: 'blur(1.5px)',
        }}
      />
      <span
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          borderRadius: '9999px',
          pointerEvents: 'none',
          boxShadow: '0 0 0 2px rgba(255,255,255,0.10) inset, 0 1.5px 0 0 rgba(255,255,255,0.18) inset, 0 -2px 8px 0 rgba(108, 92, 231, 0.18) inset',
        }}
      />
    </button>
  );
}
