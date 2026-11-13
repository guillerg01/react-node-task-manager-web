import { Pagination } from '@mui/material'

type Props = {
  page: number
  pageCount: number
  onChange: (page: number) => void
}

export default function PaginationControl({
  page,
  pageCount,
  onChange,
}: Props) {
  if (pageCount <= 1) return null

  return (
    <nav aria-label="Paginación" className="flex justify-center py-4">
      <Pagination
        size="large"
        page={page}
        count={pageCount}
        onChange={(_event, selectedPage) => onChange(selectedPage)}
        getItemAriaLabel={(type, selectedPage) => {
          if (type === 'page') return `Ir a la página ${selectedPage}`
          if (type === 'next') return 'Página siguiente'
          if (type === 'previous') return 'Página anterior'
          if (type === 'first') return 'Primera página'
          return 'Última página'
        }}
      />
    </nav>
  )
}
