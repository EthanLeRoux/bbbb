/**
 * ChartRenderer
 *
 * Renders any chart config object by calling its `.component` with its `.props`,
 * merging in `fullscreenProps` when `fullscreen` is true, and always passing
 * `expanded` / `fullscreen` / `detailed` so every chart component can adapt.
 */
export default function ChartRenderer({ chart, fullscreen = false }) {
  if (!chart) return null;

  const Component = chart.component;

  const mergedProps = {
    ...chart.props,
    ...(fullscreen && chart.fullscreenProps ? chart.fullscreenProps : {}),
    expanded: fullscreen,
    fullscreen,
    detailed: fullscreen,
  };

  return <Component {...mergedProps} />;
}
