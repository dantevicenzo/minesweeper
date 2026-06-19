import Svg, { Path } from 'react-native-svg'

interface IconProps {
  width?: number
  height?: number
  color?: string
  testID?: string
}

export function TrophyIcon({ width = 14, height = 14, color = '#000', testID }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 24 24" testID={testID}>
      <Path
        fill={color}
        d="M7 4V2h10v2h3v4c0 2.21-1.79 4-4 4h-1.04c-.6 1.18-1.66 2.08-2.96 2.42V17h3v2H8v-2h3v-2.58c-1.3-.34-2.36-1.24-2.96-2.42H7c-2.21 0-4-1.79-4-4V4h4zm0 2H5v2c0 1.1.9 2 2 2V6zm10 4c1.1 0 2-.9 2-2V6h-2v4z"
      />
    </Svg>
  )
}
