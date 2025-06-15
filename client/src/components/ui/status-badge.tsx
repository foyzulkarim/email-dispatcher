
import { Badge } from "@/components/ui/badge";

interface StatusBadgeProps {
  status: string;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

export function StatusBadge({ status, variant }: StatusBadgeProps) {
  const getVariant = () => {
    if (variant) return variant;
    
    switch (status.toLowerCase()) {
      case 'completed':
      case 'sent':
      case 'online':
        return 'default';
      case 'processing':
      case 'pending':
        return 'secondary';
      case 'failed':
      case 'error':
      case 'offline':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getColor = () => {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'sent':
      case 'online':
        return 'bg-green-100 text-green-800 hover:bg-green-100';
      case 'processing':
        return 'bg-blue-100 text-blue-800 hover:bg-blue-100';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100';
      case 'failed':
      case 'error':
      case 'offline':
        return 'bg-red-100 text-red-800 hover:bg-red-100';
      default:
        return '';
    }
  };

  return (
    <Badge variant={getVariant()} className={getColor()}>
      {status}
    </Badge>
  );
}
