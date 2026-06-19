import Svg, { Path } from 'react-native-svg'

interface IconProps {
  width?: number
  height?: number
  color?: string
  testID?: string
}

export function FlagIcon({ width = 14, height = 18, testID }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 355.303 444.127" testID={testID}>
      <Path
        fill="#e60000"
        d="M105 174v-50H-95V24h-100V-76h100v-100h200v-100h200v500H105Z"
        transform="matrix(.44413 0 0 .44413 86.605 122.579)"
      />
      <Path
        fill="#000"
        d="M-195 624V524H5V424h200V224h100v200h100v100h200v200h-800Z"
        transform="matrix(.44413 0 0 .44413 86.605 122.579)"
      />
    </Svg>
  )
}
