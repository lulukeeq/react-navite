import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, G } from 'react-native-svg';
import { useColors } from '../colors';
import { formatCNY } from '../utils';

const PALETTE = [
  '#3b82f6', '#f59e0b', '#10b981', '#ef4444', '#8b5cf6',
  '#ec4899', '#14b8a6', '#f97316', '#6366f1', '#84cc16',
  '#06b6d4', '#a855f7',
];

type Slice = { id: string; name: string; value: number };

type Props = {
  data: Slice[];
  size?: number;
  thickness?: number;
};

const polar = (cx: number, cy: number, r: number, angleDeg: number) => {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
};

const arcPath = (
  cx: number, cy: number, rOuter: number, rInner: number,
  startAngle: number, endAngle: number,
) => {
  const startOuter = polar(cx, cy, rOuter, endAngle);
  const endOuter = polar(cx, cy, rOuter, startAngle);
  const startInner = polar(cx, cy, rInner, startAngle);
  const endInner = polar(cx, cy, rInner, endAngle);
  const largeArc = endAngle - startAngle <= 180 ? '0' : '1';
  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${rOuter} ${rOuter} 0 ${largeArc} 0 ${endOuter.x} ${endOuter.y}`,
    `L ${startInner.x} ${startInner.y}`,
    `A ${rInner} ${rInner} 0 ${largeArc} 1 ${endInner.x} ${endInner.y}`,
    'Z',
  ].join(' ');
};

export const PieChart = ({ data, size = 180, thickness = 28 }: Props) => {
  const c = useColors();
  const total = data.reduce((s, x) => s + x.value, 0);
  const r = size / 2;
  const inner = r - thickness;
  const cx = r;
  const cy = r;

  if (total <= 0) {
    return (
      <View style={[styles.wrap, { height: size }]}>
        <Text style={{ color: c.textDim }}>暂无数据</Text>
      </View>
    );
  }

  let cursor = 0;
  const slices = data.map((s, i) => {
    const angle = (s.value / total) * 360;
    const start = cursor;
    const end = cursor + angle;
    cursor = end;
    return { ...s, start, end, color: PALETTE[i % PALETTE.length] };
  });

  return (
    <View style={styles.wrap}>
      <View style={{ width: size, height: size }}>
        <Svg width={size} height={size}>
          <G>
            {slices.length === 1 ? (
              <>
                <Circle cx={cx} cy={cy} r={r} fill={slices[0].color} />
                <Circle cx={cx} cy={cy} r={inner} fill={c.bg} />
              </>
            ) : (
              slices.map((s) => (
                <Path
                  key={s.id}
                  d={arcPath(cx, cy, r, inner, s.start, s.end)}
                  fill={s.color}
                />
              ))
            )}
          </G>
        </Svg>
        <View style={[styles.center, { width: size, height: size }]}>
          <Text style={[styles.totalLabel, { color: c.textMuted }]}>合计</Text>
          <Text style={[styles.totalValue, { color: c.text }]}>{formatCNY(total)}</Text>
        </View>
      </View>
      <View style={styles.legend}>
        {slices.map((s) => (
          <View key={s.id} style={styles.legendRow}>
            <View style={[styles.dot, { backgroundColor: s.color }]} />
            <Text style={[styles.legendName, { color: c.text }]} numberOfLines={1}>
              {s.name}
            </Text>
            <Text style={[styles.legendPct, { color: c.textMuted }]}>
              {((s.value / total) * 100).toFixed(1)}%
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 12 },
  center: {
    position: 'absolute', alignItems: 'center', justifyContent: 'center',
  },
  totalLabel: { fontSize: 12 },
  totalValue: { fontSize: 18, fontWeight: '700', marginTop: 2 },
  legend: { width: '100%', marginTop: 16, paddingHorizontal: 16 },
  legendRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendName: { flex: 1, fontSize: 14 },
  legendPct: { fontSize: 13 },
});
