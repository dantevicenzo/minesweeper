import Svg, { Path } from 'react-native-svg'

interface IconProps {
  width?: number
  height?: number
  color?: string
  testID?: string
}

export function MineIcon({ width = 18, height = 18, color = '#000', testID }: IconProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 117.509 117.509" testID={testID}>
      <Path
        fill="#fff"
        strokeWidth=".1"
        strokeLinejoin="bevel"
        d="M35.134 34.736h20.478v20.612H35.134z"
      />
      <Path
        fill={color}
        d="M54.29 108.46v-9.047H36.192v-9.049h-9.048v9.049h-9.049v-9.049h9.049v-9.048h-9.049V63.22H0V54.289h18.096V36.193h9.049v-9.048h-9.049v-9.049h9.049v9.049h9.048v-9.049h18.096V0H63.22v18.096h18.096v9.049h9.048v-9.049h9.049v9.049h-9.049v9.048h9.049v18.096h18.096V63.22H99.413v18.096h-9.049v9.048h9.049v9.049h-9.049v-9.049h-9.048v9.049H63.22v18.096H54.289zm0-63.219v-9.048H36.192v18.096h18.096z"
      />
    </Svg>
  )
}
