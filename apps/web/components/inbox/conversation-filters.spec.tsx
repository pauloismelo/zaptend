import { render, screen, fireEvent } from '@testing-library/react'
import { ConversationFilters, DEFAULT_INBOX_FILTERS, type InboxFilters } from './conversation-filters'

const makeFilters = (overrides: Partial<InboxFilters> = {}): InboxFilters => ({
  ...DEFAULT_INBOX_FILTERS,
  ...overrides,
})

describe('ConversationFilters', () => {
  it('renderiza o campo de busca', () => {
    render(<ConversationFilters filters={makeFilters()} onChange={jest.fn()} />)
    expect(screen.getByTestId('search-input')).toBeInTheDocument()
  })

  it('renderiza todos os filtros de status', () => {
    render(<ConversationFilters filters={makeFilters()} onChange={jest.fn()} />)
    expect(screen.getByTestId('status-filter-all')).toBeInTheDocument()
    expect(screen.getByTestId('status-filter-open')).toBeInTheDocument()
    expect(screen.getByTestId('status-filter-attending')).toBeInTheDocument()
    expect(screen.getByTestId('status-filter-waiting_customer')).toBeInTheDocument()
    expect(screen.getByTestId('status-filter-resolved')).toBeInTheDocument()
  })

  it('chama onChange com o texto digitado na busca', () => {
    const onChange = jest.fn()
    render(<ConversationFilters filters={makeFilters()} onChange={onChange} />)
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'João' } })
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: 'João' }))
  })

  it('chama onChange com o status selecionado ao clicar', () => {
    const onChange = jest.fn()
    render(<ConversationFilters filters={makeFilters()} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('status-filter-open'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ status: 'open' }))
  })

  it('filtro ativo tem aria-selected=true', () => {
    render(<ConversationFilters filters={makeFilters({ status: 'open' })} onChange={jest.fn()} />)
    expect(screen.getByTestId('status-filter-open')).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByTestId('status-filter-all')).toHaveAttribute('aria-selected', 'false')
  })

  it('filtro "Todas" ativo por padrão', () => {
    render(<ConversationFilters filters={makeFilters()} onChange={jest.fn()} />)
    expect(screen.getByTestId('status-filter-all')).toHaveAttribute('aria-selected', 'true')
  })

  it('exibe botão de limpar busca quando há texto', () => {
    render(<ConversationFilters filters={makeFilters({ search: 'teste' })} onChange={jest.fn()} />)
    expect(screen.getByTestId('clear-search')).toBeInTheDocument()
  })

  it('não exibe botão de limpar quando busca está vazia', () => {
    render(<ConversationFilters filters={makeFilters({ search: '' })} onChange={jest.fn()} />)
    expect(screen.queryByTestId('clear-search')).not.toBeInTheDocument()
  })

  it('chama onChange com search vazio ao clicar em limpar', () => {
    const onChange = jest.fn()
    render(<ConversationFilters filters={makeFilters({ search: 'teste' })} onChange={onChange} />)
    fireEvent.click(screen.getByTestId('clear-search'))
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ search: '' }))
  })

  it('mantém outros filtros ao mudar a busca', () => {
    const onChange = jest.fn()
    render(
      <ConversationFilters
        filters={makeFilters({ status: 'open', search: '' })}
        onChange={onChange}
      />,
    )
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'João' } })
    expect(onChange).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'open', search: 'João' }),
    )
  })
})
