import {formatDateTime} from '../../api/helpers'

const AttendanceHistory = ({history}) => {
  return (
    <div className='card overflow-hidden'>
        <div className="px-6 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
        </div>
        <div className="overflow-x-auto">
            <table className="table-modern">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Punch In</th>
                        <th>Punch Out</th>
                        <th>Working Hours</th>
                        <th>Auto Closed</th>
                    </tr>
                </thead>
                <tbody>
                    {history.length === 0 ? (
                        <tr><td colSpan={5} className="text-center py-12 text-slate-400">No records found</td></tr>
                    ) : history.map((record)=>(
                        <tr key={record._id}>
                            <td className='font-medium text-slate-900'>{new Date(record.date).toLocaleDateString()}</td>
                            <td className='text-slate-600'>{formatDateTime(record.punchIn?.time)}</td>
                            <td className='text-slate-600'>{formatDateTime(record.punchOut?.time)}</td>
                            <td className='text-slate-600 font-medium'>{record.workingHours ? `${record.workingHours}h` : "-"}</td>
                            <td><span className={`badge ${record.isAutoClosed ? "badge-warning" : "bg-slate-100 text-slate-600"}`}>{record.isAutoClosed ? "Yes" : "No"}</span></td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
  )
}

export default AttendanceHistory
