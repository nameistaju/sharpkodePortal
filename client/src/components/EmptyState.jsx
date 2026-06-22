import { InboxIcon } from "lucide-react"

const EmptyState = ({ title = "Nothing here yet", description = "New records will appear here once they are created.", action }) => {
  return (
    <div className="empty-state">
      <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-500 ring-1 ring-slate-200">
        <InboxIcon className="h-5 w-5" />
      </div>
      <p className="font-medium text-slate-900">{title}</p>
      <p className="mx-auto mt-1 max-w-sm text-sm leading-6 text-slate-500">{description}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

export default EmptyState
