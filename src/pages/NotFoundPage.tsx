import { Link } from 'react-router-dom'
import { Compass } from 'lucide-react'
import { Button } from '../components/ui/button'
import { EmptyState } from '../components/ui/overlays'

export function NotFoundPage() {
  return (
    <div className="flex items-center justify-center py-16">
      <EmptyState
        icon={<Compass size={36} />}
        title="File not found"
        description="This page does not exist — the audit trail goes cold here."
        action={
          <Link to="/">
            <Button>Back to dashboard</Button>
          </Link>
        }
      />
    </div>
  )
}
