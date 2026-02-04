interface BadgeProps {
    children: React.ReactNode
    variant?: "primary" | "success" | "warning" | "danger" | "disable"
  }
  
  export function Badge({ children, variant = "primary" }: BadgeProps) {
    const styles = {
      primary: "bg-blue-300 text-blue-700",
      success: "bg-green-300 text-green-700",
      warning: "bg-yellow-300 text-yellow-700",
      danger: "bg-red-300 text-red-700",
      disable: "bg-gray-300 text-gray-700"
    }
  
    return (
      <span
        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${styles[variant]}`}
      >
        {children}
      </span>
    )
  }
  