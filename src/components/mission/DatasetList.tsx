import { useState } from 'react'
import { FileDown, FileText, MonitorDown, Sheet } from 'lucide-react'
import { getDataset } from '../../datasets/registry'
import { downloadDataset, SUPPORTING_DOCS } from '../../datasets/download'
import { useAppStore } from '../../store/app'
import { useToasts } from '../../store/toasts'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Alert } from '../ui/overlays'
import { cn } from '../../lib/utils'

export function DatasetList({
  datasetIds,
  docIds,
}: {
  datasetIds: string[]
  docIds?: string[]
}) {
  const track = useAppStore((s) => s.trackEvent)
  const push = useToasts((s) => s.push)
  const [downloading, setDownloading] = useState<string | null>(null)

  const handleDataset = async (id: string) => {
    setDownloading(id)
    try {
      const ds = getDataset(id)
      await downloadDataset(id)
      track('dataset_downloaded', { value: ds.recordCount })
      push({
        variant: 'success',
        title: `${ds.filename} downloaded`,
        description: 'Open it in Excel and follow the mission tasks.',
      })
    } catch {
      push({ variant: 'default', title: 'Could not generate the file', description: 'Please try again.' })
    } finally {
      setDownloading(null)
    }
  }

  const handleDoc = async (id: string) => {
    const doc = SUPPORTING_DOCS[id]
    if (!doc) return
    await doc.download()
    track('doc_downloaded')
    push({ variant: 'success', title: `${doc.filename} downloaded` })
  }

  return (
    <div className="space-y-3">
      <Alert variant="warning" className="lg:hidden">
        <span className="flex items-start gap-2">
          <MonitorDown size={15} className="mt-0.5 shrink-0" />
          <span>
            Practical dataset work is best done on a desktop or laptop with Microsoft
            Excel. You can still read the brief and submit answers here.
          </span>
        </span>
      </Alert>

      {datasetIds.map((id) => {
        const ds = getDataset(id)
        return (
          <div
            key={id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-success-soft text-success">
              <Sheet size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-[13px] font-medium">{ds.filename}</span>
                <Badge variant="muted">{ds.recordCount.toLocaleString()} records</Badge>
              </div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {ds.description}
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleDataset(id)}
              loading={downloading === id}
              className={cn('shrink-0')}
            >
              <FileDown size={15} /> Download .xlsx
            </Button>
          </div>
        )
      })}

      {(docIds ?? []).map((id) => {
        const doc = SUPPORTING_DOCS[id]
        if (!doc) return null
        return (
          <div
            key={id}
            className="flex flex-wrap items-center gap-3 rounded-xl border border-border bg-card p-4"
          >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-info-soft text-info">
              <FileText size={18} />
            </span>
            <div className="min-w-0 flex-1">
              <div className="font-mono text-[13px] font-medium">{doc.filename}</div>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                {doc.description}
              </p>
            </div>
            <Button variant="secondary" onClick={() => handleDoc(id)} className="shrink-0">
              <FileDown size={15} /> Download PDF
            </Button>
          </div>
        )
      })}
    </div>
  )
}
