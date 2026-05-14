import { COLORS, FONTS, SIZE, SPACE, DIFF_COLOR } from '../constants';

export default function Badge({ difficulty }) {
  return (
    <span style={{
      fontFamily: FONTS.mono,
      fontSize: SIZE.xs,
      color: DIFF_COLOR[difficulty] ?? COLORS.muted,
      border: `1px solid currentColor`,
      padding: `${SPACE.xs}px ${SPACE.sm}px`,
      textTransform: 'uppercase',
      fontWeight: 500,
      display: 'inline-block',
    }}>
      {difficulty}
    </span>
  );
}
