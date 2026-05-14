import { COLORS, SPACE } from '../constants';

export default function Skeleton({ width = '100%', height = 16, count = 1 }) {
  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
        `}
      </style>
      
      <div style={{ display: 'flex', flexDirection: 'column', gap: SPACE.sm }}>
        {Array.from({ length: count }).map((_, index) => (
          <div
            key={index}
            style={{
              width,
              height,
              background: `linear-gradient(90deg, ${COLORS.surface} 25%, ${COLORS.border} 50%, ${COLORS.surface} 75%)`,
              backgroundSize: '200% 100%',
              animation: 'shimmer 1.5s infinite',
              borderRadius: 4,
            }}
          />
        ))}
      </div>
    </>
  );
}
