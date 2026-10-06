import type { Achievement } from '../lib/types'

export const ACHIEVEMENTS: Achievement[] = [
  {
    id: 'first-finding',
    name: 'First Finding',
    description: 'Complete your first audit exception test.',
    icon: 'flag',
    color: 'from-emerald-500 to-teal-600',
  },
  {
    id: 'excel-detective',
    name: 'Excel Detective',
    description: 'Complete 5 Excel-based audit challenges.',
    icon: 'search',
    color: 'from-sky-500 to-blue-600',
  },
  {
    id: 'duplicate-hunter',
    name: 'Duplicate Hunter',
    description: 'Successfully identify duplicate transactions.',
    icon: 'copy',
    color: 'from-violet-500 to-purple-600',
  },
  {
    id: 'reconciliation-specialist',
    name: 'Reconciliation Specialist',
    description: 'Complete your first reconciliation.',
    icon: 'scale',
    color: 'from-amber-500 to-orange-600',
  },
  {
    id: 'data-detective',
    name: 'Data Detective',
    description: 'Complete an investigation mission without using hints.',
    icon: 'eye',
    color: 'from-rose-500 to-pink-600',
  },
  {
    id: 'procurement-analyst',
    name: 'Procurement Analyst',
    description: 'Complete the Procurement Audit module.',
    icon: 'briefcase',
    color: 'from-cyan-500 to-teal-600',
  },
  {
    id: 'audit-boss',
    name: 'Audit Boss',
    description: 'Complete the final procurement audit case.',
    icon: 'crown',
    color: 'from-yellow-400 to-amber-600',
  },
]

export const SKILLS = [
  { id: 'excel-fundamentals', name: 'Excel Fundamentals', levelId: 'L1' },
  { id: 'data-cleaning', name: 'Data Cleaning', levelId: 'L1' },
  { id: 'exception-testing', name: 'Exception Testing', levelId: 'L2' },
  { id: 'procurement-analytics', name: 'Procurement Analytics', levelId: 'L2' },
  { id: 'audit-documentation', name: 'Audit Documentation', levelId: 'L3' },
] as const
