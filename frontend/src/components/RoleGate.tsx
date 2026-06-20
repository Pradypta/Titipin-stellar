interface Props {
  condition: boolean
  children: React.ReactNode
  fallback?: React.ReactNode
}

export function RoleGate({ condition, children, fallback = null }: Props) {
  return condition ? <>{children}</> : <>{fallback}</>
}
