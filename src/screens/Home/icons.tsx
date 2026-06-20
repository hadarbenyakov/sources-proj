type IconProps = { className?: string; size?: number }

export function MenuIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M3 7h18M3 12h18M3 17h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function BellIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M6.50248 6.97519C6.78492 4.15083 9.16156 2 12 2C14.8384 2 17.2151 4.15083 17.4975 6.97519L17.7841 9.84133C17.8016 10.0156 17.8103 10.1028 17.8207 10.1885C17.9649 11.3717 18.3717 12.5077 19.0113 13.5135C19.0576 13.5865 19.1062 13.6593 19.2034 13.8051L20.0645 15.0968C20.8508 16.2763 21.244 16.866 21.0715 17.3412C21.0388 17.4311 20.9935 17.5158 20.9368 17.5928C20.6371 18 19.9283 18 18.5108 18H5.48923C4.07168 18 3.36291 18 3.06318 17.5928C3.00651 17.5158 2.96117 17.4311 2.92854 17.3412C2.75601 16.866 3.14916 16.2763 3.93548 15.0968L4.79661 13.8051C4.89378 13.6593 4.94236 13.5865 4.98873 13.5135C5.62832 12.5077 6.03508 11.3717 6.17927 10.1885C6.18972 10.1028 6.19844 10.0156 6.21587 9.84133L6.50248 6.97519Z" fill="currentColor" />
      <path d="M10.0681 20.6294C10.1821 20.7357 10.4332 20.8297 10.7825 20.8967C11.1318 20.9637 11.5597 21 12 21C12.4403 21 12.8682 20.9637 13.2175 20.8967C13.5668 20.8297 13.8179 20.7357 13.9319 20.6294" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function LightningIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 25 25" fill="none" className={className}>
      <path d="M12.1062 2.21608C12.2665 2.08808 12.5388 1.94921 12.8819 2.01844C13.2254 2.08787 13.4101 2.31902 13.4968 2.49704C13.5768 2.66131 13.6094 2.84539 13.6279 3.00183C13.6652 3.32068 13.6642 3.76943 13.6642 4.29596V9.69626H15.4841C16.3972 9.69626 17.1578 9.69399 17.7349 9.77245C18.3231 9.85252 18.8921 10.0377 19.2421 10.5404C19.5918 11.0428 19.5358 11.5933 19.3679 12.1166C19.2032 12.6302 18.8812 13.2633 18.4976 14.0239L14.8692 21.2171C14.6284 21.6947 14.4239 22.1018 14.244 22.3768C14.1558 22.5116 14.0414 22.6657 13.8938 22.7838C13.7335 22.9118 13.4612 23.0508 13.1181 22.9816C12.7746 22.9121 12.5899 22.6809 12.5032 22.5029C12.4232 22.3386 12.3906 22.1545 12.3721 21.9981C12.3348 21.6793 12.3358 21.2305 12.3358 20.704V15.3037H10.5159C9.60281 15.3037 8.84213 15.306 8.2652 15.2275C7.67696 15.1474 7.10785 14.9623 6.75784 14.4596C6.40821 13.9572 6.46423 13.4066 6.63201 12.8834C6.79675 12.3698 7.11878 11.7367 7.50244 10.9761L11.1308 3.78283C11.3716 3.30524 11.5762 2.89808 11.756 2.62325C11.8442 2.48841 11.9586 2.33422 12.1062 2.21608Z" fill="currentColor" stroke="currentColor" />
    </svg>
  )
}

export function FireIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 30 29" fill="none" className={className}>
      <path d="M17.1895 3.79475C17.1877 3.71916 17.1055 3.66927 17.0398 3.70667C12.6225 6.22044 12.7527 12.639 12.8039 13.6774C12.8074 13.7481 12.7403 13.7952 12.6754 13.7669C12.2069 13.5624 10.6939 12.713 10.6273 10.2514C10.6252 10.1757 10.5441 10.126 10.4782 10.1633C7.94918 11.5951 6.25 14.2609 6.25 17.2187C6.25 21.7233 10.1675 25.375 15 25.375C19.8325 25.375 23.75 21.7233 23.75 17.2187C23.75 10.6592 17.3203 9.2606 17.1895 3.79475Z" fill="currentColor" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  )
}

export function ArrowRightIcon({ size = 14, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 14 14" fill="none" className={className}>
      <circle cx="7" cy="7" r="6.5" stroke="currentColor" />
      <path d="M5 7h4M7.5 5.5L9 7l-1.5 1.5" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export function PlusIcon({
  size = 16,
  className,
  strokeWidth = 1.5,
}: IconProps & { strokeWidth?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />
    </svg>
  )
}

export function MinusIcon({ size = 16, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" fill="none" className={className}>
      <path d="M3 8h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  )
}

export function TurnLeftIcon({ size = 32, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" className={className}>
      {/* Vertical stem going up, then curving LEFT, arrow tip on the left */}
      <path
        d="M22 28 V18 a8 8 0 0 0 -8 -8 H6"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 6 L6 10 L10 14"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function MapIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 23.2929 18.8562" fill="none" className={className}>
      <path fillRule="evenodd" clipRule="evenodd" d="M6.21862 0.0523708C6.56779 -0.0938951 6.85085 0.0935645 6.85085 0.471924V15.5171C6.85085 15.8951 6.56952 16.3194 6.21862 16.4664L0.632232 18.8065C0.28306 18.9527 0 18.7653 0 18.3869V3.3417C0 2.96372 0.281334 2.53946 0.632232 2.39247L6.21862 0.0523708ZM22.6607 0.0496992C23.0098 -0.0965667 23.2929 0.0908929 23.2929 0.469253V15.5145C23.2929 15.8924 23.0116 16.3167 22.6607 16.4637L17.0743 18.8038C16.7251 18.9501 16.4421 18.7626 16.4421 18.3842V3.33903C16.4421 2.96105 16.7234 2.53679 17.0743 2.3898L22.6607 0.0496992ZM8.85326 0.0496992C8.50409 -0.0965667 8.22103 0.0908929 8.22103 0.469253V15.5145C8.22103 15.8924 8.50236 16.3167 8.85326 16.4637L14.4396 18.8038C14.7888 18.9501 15.0719 18.7626 15.0719 18.3842V3.33903C15.0719 2.96105 14.7905 2.53679 14.4396 2.3898L8.85326 0.0496992Z" fill="currentColor" />
    </svg>
  )
}

export function HomeIcon({ size = 22, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 22 19" fill="none" className={className}>
      <path d="M21.3718 8.04984L12.1605 0.420723C11.4897 -0.140241 10.517 -0.140241 9.82258 0.420723L0.611298 8.04984C-0.614581 9.05958 0.12582 11.0115 1.74585 11.0115H2.76379V17.5187C2.76379 18.3487 3.45809 19 4.29162 19H7.5553C8.41141 19 9.08313 18.3268 9.08313 17.5187L9.08222 13.1878C9.08222 12.8284 9.38327 12.5594 9.73042 12.5594H12.2301C12.6008 12.5594 12.8783 12.8512 12.8783 13.1878V17.5187C12.8783 18.3487 13.5726 19 14.4062 19H17.715C18.5711 19 19.2428 18.3268 19.2428 17.5187V11.0115H20.2607C21.8808 11.0115 22.6211 9.05953 21.3718 8.04984Z" fill="currentColor" />
    </svg>
  )
}

export function SwapIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 19 19" fill="none" className={className}>
      <path d="M18.6412 5.58219L14.0909 0.366999C13.8043 0.0380367 13.3416 -0.083352 12.9118 0.0584146C12.4829 0.200195 12.2053 0.566222 12.2053 0.989718V3.552H2.38813C1.07166 3.552 0 4.55001 0 5.776C0 7.00199 1.07166 8 2.38813 8H17.4054C18.0253 8 18.5766 7.67659 18.8433 7.15488C19.1099 6.63317 19.0323 6.03069 18.6412 5.58219Z" fill="currentColor" />
      <path d="M16.611 11.0001H1.59451C0.974623 11.0001 0.423383 11.3236 0.156742 11.8453C-0.1099 12.367 -0.0323094 12.9693 0.358727 13.4178L4.9088 18.633C5.11675 18.8712 5.41526 19 5.72668 19C5.84707 19 5.96846 18.9805 6.08787 18.9416C6.51672 18.7998 6.79431 18.4338 6.79431 18.0103V15.448H16.612C17.9284 15.448 19 14.45 19 13.224C19 11.998 17.9284 11 16.612 11L16.611 11.0001Z" fill="currentColor" />
    </svg>
  )
}

export function SearchIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11 4C14.866 4 18 7.13401 18 11C18 14.866 14.866 18 11 18C7.13401 18 4 14.866 4 11C4 7.13401 7.13401 4 11 4ZM11 6C10.3435 6 9.69349 6.12964 9.08691 6.38086C8.48029 6.63213 7.92914 7.00055 7.46484 7.46484C7.00055 7.92914 6.63213 8.48029 6.38086 9.08691C6.12964 9.69349 6 10.3435 6 11C6 11.5523 6.44772 12 7 12C7.55228 12 8 11.5523 8 11C8 10.606 8.07775 10.2155 8.22852 9.85156C8.37928 9.48774 8.60043 9.15738 8.87891 8.87891C9.15738 8.60043 9.48774 8.37928 9.85156 8.22852C10.2155 8.07775 10.606 8 11 8C11.5523 8 12 7.55228 12 7C12 6.44772 11.5523 6 11 6Z" fill="currentColor" />
      <path d="M20 20L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}

export function CheckIcon({ size = 24, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path
        d="M5 12.5l4.5 4.5L19 7.5"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function ChevronLeftIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 24" fill="none" className={className}>
      <path
        d="M13 4L5 12l8 8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export function XIcon({ size = 18, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 18 18" fill="none" className={className}>
      <path
        d="M3.5 3.5l11 11M14.5 3.5l-11 11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function BackspaceIcon({ size = 28, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 28 28" fill="none" className={className}>
      <path
        d="M9.5 6.5L3.5 14l6 7.5h13a2.5 2.5 0 0 0 2.5-2.5V9a2.5 2.5 0 0 0-2.5-2.5h-13z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M13 11l6 6M19 11l-6 6"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  )
}

export function WaterDropIcon({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M11.3662 3.58008C11.7247 3.23938 12.2753 3.23938 12.6338 3.58008C14.3569 5.21788 19 10.0508 19 14.5713C19 18.1217 15.866 21 12 21C8.13401 21 5.00001 18.1217 5 14.5713C5 10.0508 9.64307 5.21788 11.3662 3.58008ZM8.46484 14.0283C8.19181 14.0696 8.00367 14.3246 8.04492 14.5977C8.17326 15.4467 8.57153 16.2326 9.18066 16.8379C9.7898 17.443 10.578 17.8361 11.4277 17.959C11.7009 17.9984 11.9546 17.8083 11.9941 17.5352C12.0334 17.262 11.8435 17.0083 11.5703 16.9688C10.9331 16.8765 10.3425 16.5817 9.88574 16.1279C9.42889 15.674 9.12946 15.085 9.0332 14.4482C8.99194 14.1753 8.73776 13.9872 8.46484 14.0283Z" fill="currentColor" />
    </svg>
  )
}

export function MealIcon({ size = 17, className }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className}>
      <path d="M16.6545 6.61876C15.829 6.21171 14.4211 6 13.5007 6C13.5007 6 13.6083 8.93514 13.6083 10.8295C13.6083 12.7238 12.0021 14 10.5 14.5C10.5021 16 10.5 17 10.5 17C11.5 18 12.5 18 13.5 18C14.3864 18 15.4466 17.8955 16.2968 17.5433C17.1471 17.1911 17.9049 16.648 18.5118 15.9561C19.1186 15.2641 19.5581 14.4419 19.7963 13.5529C20.0345 12.6639 20.065 11.7321 19.8854 10.8295C19.7059 9.92682 19.3211 9.07758 18.7608 8.34743C18.2006 7.61729 17.4799 7.02581 16.6545 6.61876Z" fill="currentColor" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M7 19V5" stroke="currentColor" strokeWidth="2" />
      <path d="M10 5V9.5C10 10.3284 9.32843 11 8.5 11C7.67157 11 7 10.3284 7 9.5V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M4 5V9.5C4 10.3284 4.67157 11 5.5 11C6.32843 11 7 10.3284 7 9.5V5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
