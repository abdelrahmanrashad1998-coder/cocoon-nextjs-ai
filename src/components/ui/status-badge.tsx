import { Badge } from "@/components/ui/badge"
import { 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertCircle,
  Loader2
} from "lucide-react"

export type StatusType = 
  | "draft" 
  | "pending_review" 
  | "approved" 
  | "rejected" 
  | "in_production" 
  | "completed" 
  | "cancelled"
  | "done"
  | "in_progress"
  | "not_started"

interface StatusBadgeProps {
  status: StatusType
  className?: string
}

export function StatusBadge({ status, className = "" }: StatusBadgeProps) {
  const getStatusConfig = (status: StatusType) => {
    const configs = {
      // Quote statuses
      draft: {
        variant: "secondary" as const,
        text: "Draft",
        icon: FileText,
        className: "bg-info/10 text-foreground border-info/20 dark:bg-info/20 dark:text-foreground dark:border-info/80",
        iconColor: "text-info dark:text-info"
      },
      pending_review: {
        variant: "outline" as const,
        text: "Pending Review",
        icon: Clock,
        className: "bg-warning/10 text-foreground border-warning/20 dark:bg-warning/20 dark:text-foreground dark:border-warning/80",
        iconColor: "text-warning dark:text-warning"
      },
      approved: {
        variant: "default" as const,
        text: "Approved",
        icon: CheckCircle,
        className: "bg-success/10 text-foreground border-success/20 dark:bg-success/20 dark:text-foreground dark:border-success/80",
        iconColor: "text-success dark:text-success"
      },
      rejected: {
        variant: "destructive" as const,
        text: "Rejected",
        icon: XCircle,
        className: "bg-destructive/10 text-foreground border-destructive/20 dark:bg-destructive/20 dark:text-foreground dark:border-destructive/80",
        iconColor: "text-destructive dark:text-destructive"
      },
      in_production: {
        variant: "default" as const,
        text: "In Production",
        icon: AlertCircle,
        className: "bg-special/10 text-foreground border-special/20 dark:bg-special/20 dark:text-foreground dark:border-special/80",
        iconColor: "text-special dark:text-special"
      },
      completed: {
        variant: "default" as const,
        text: "Completed",
        icon: CheckCircle,
        className: "bg-success/10 text-foreground border-success/20 dark:bg-success/20 dark:text-foreground dark:border-success/80",
        iconColor: "text-success dark:text-success"
      },
      cancelled: {
        variant: "secondary" as const,
        text: "Cancelled",
        icon: XCircle,
        className: "bg-muted text-foreground border-border dark:bg-muted dark:text-foreground dark:border-border",
        iconColor: "text-muted-foreground dark:text-muted-foreground"
      },
      // Dashboard statuses (legacy support)
      done: {
        variant: "default" as const,
        text: "Done",
        icon: CheckCircle,
        className: "bg-success/10 text-foreground border-success/20 dark:bg-success/20 dark:text-foreground dark:border-success/80",
        iconColor: "text-success dark:text-success"
      },
      in_progress: {
        variant: "default" as const,
        text: "In Progress",
        icon: Loader2,
        className: "bg-info/10 text-foreground border-info/20 dark:bg-info/20 dark:text-foreground dark:border-info/80",
        iconColor: "text-info dark:text-info"
      },
      not_started: {
        variant: "secondary" as const,
        text: "Not Started",
        icon: Clock,
        className: "bg-muted text-foreground border-border dark:bg-muted dark:text-foreground dark:border-border",
        iconColor: "text-muted-foreground dark:text-muted-foreground"
      }
    }

    return configs[status] || configs.draft
  }

  const config = getStatusConfig(status)
  const IconComponent = config.icon

  return (
    <Badge 
      variant={config.variant} 
      className={`flex items-center gap-1 px-2 py-1 ${config.className} ${className}`}
    >
      <IconComponent className={`h-3 w-3 ${config.iconColor}`} />
      {config.text}
    </Badge>
  )
}
