import Svg, { Circle, Path } from 'react-native-svg';

export function GryttLogo({ size = 100 }: { size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 200 200">
      <Circle cx="100" cy="100" r="100" fill="#111111" />

      <Path
        d="M 130 68
           A 45 45 0 1 0 145 100
           L 145 100
           L 110 100
           L 110 88
           L 165 88
           L 165 130"
        fill="none"
        stroke="#ffffff"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      <Path
        d="M 35 158 C 65 140, 90 176, 120 158 S 165 140, 170 150"
        fill="none"
        stroke="#fc4c02"
        strokeWidth="7"
        strokeLinecap="round"
      />
    </Svg>
  );
}