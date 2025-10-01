export default function Page() {
  if (typeof window !== 'undefined') {
    window.location.href = '/kanban'
  }
  return null
}

