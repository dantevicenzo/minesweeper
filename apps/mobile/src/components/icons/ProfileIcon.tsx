import Svg, { Rect } from 'react-native-svg'

interface IconProps {
  width?: number
  height?: number
  color?: string
  testID?: string
}

export function ProfileIcon({ width = 16, height = 16, color = '#517598', testID }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 16 16" testID={testID}>
      <Rect x={6} y={1} width={4} height={1} fill={color} />
      <Rect x={5} y={2} width={6} height={1} fill={color} />
      <Rect x={4} y={3} width={8} height={3} fill={color} />
      <Rect x={5} y={6} width={6} height={1} fill={color} />
      <Rect x={6} y={7} width={4} height={1} fill={color} />
      <Rect x={4} y={9} width={8} height={1} fill={color} />
      <Rect x={3} y={10} width={10} height={1} fill={color} />
      <Rect x={2} y={11} width={12} height={2} fill={color} />
      <Rect x={3} y={13} width={10} height={1} fill={color} />
      <Rect x={4} y={14} width={8} height={1} fill={color} />
    </Svg>
  )
}
