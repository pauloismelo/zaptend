import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type React from 'react'
import { PipelineBoard } from './pipeline-board'
import { usePipelineStore } from '@/stores/pipeline.store'
import type { PipelineConversation } from '@/lib/api/pipeline'

jest.mock('@dnd-kit/core', () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  PointerSensor: jest.fn(),
  KeyboardSensor: jest.fn(),
  useSensor: jest.fn(() => ({})),
  useSensors: jest.fn(() => []),
  useDroppable: jest.fn(() => ({ setNodeRef: jest.fn(), isOver: false })),
  useDraggable: jest.fn(() => ({
    attributes: {},
    listeners: {},
    setNodeRef: jest.fn(),
    transform: null,
    isDragging: false,
  })),
}))

jest.mock('@/stores/pipeline.store', () => ({
  usePipelineStore: jest.fn(),
}))

const mockedUseStore = usePipelineStore as jest.MockedFunction<typeof usePipelineStore>

const conversations: PipelineConversation[] = [
  {
    id: 'conv-1',
    status: 'open',
    subject: 'Proposta comercial',
    tags: ['lead', 'vip'],
    pipelineStage: 'new',
    pipelineValue: '1200',
    lastMessageAt: '2026-05-07T12:00:00.000Z',
    assignedUserId: 'user-1',
    departmentId: 'sales',
    contact: { id: 'contact-1', phone: '5511999999999', name: 'Ana', company: 'ACME', tags: [] },
    assignedUser: { id: 'user-1', name: 'Paulo', email: 'paulo@test.com' },
  },
  {
    id: 'conv-2',
    status: 'open',
    subject: null,
    tags: [],
    pipelineStage: 'proposal',
    pipelineValue: 700,
    lastMessageAt: null,
    assignedUserId: null,
    departmentId: null,
    contact: { id: 'contact-2', phone: '5511888888888', name: null, company: null, tags: [] },
    assignedUser: null,
  },
]

function setupStore(overrides: Partial<ReturnType<typeof usePipelineStore>> = {}) {
  const fetchPipeline = jest.fn().mockResolvedValue(undefined)
  const moveConversation = jest.fn().mockResolvedValue(undefined)
  const setFilters = jest.fn()

  mockedUseStore.mockReturnValue({
    columns: [
      { id: 'new', title: 'Novo', color: 'bg-sky-500' },
      { id: 'proposal', title: 'Proposta', color: 'bg-amber-500' },
    ],
    conversations,
    filters: {},
    isLoading: false,
    isMoving: false,
    error: null,
    setColumns: jest.fn(),
    setFilters,
    fetchPipeline,
    moveConversation,
    ...overrides,
  } as ReturnType<typeof usePipelineStore>)

  return { fetchPipeline, setFilters, moveConversation }
}

describe('PipelineBoard', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('carrega pipeline ao montar e renderiza colunas/cards', () => {
    const { fetchPipeline } = setupStore()

    render(<PipelineBoard />)

    expect(fetchPipeline).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Pipeline')).toBeInTheDocument()
    expect(screen.getByTestId('pipeline-column-new')).toBeInTheDocument()
    expect(screen.getByTestId('pipeline-column-proposal')).toBeInTheDocument()
    expect(screen.getByText('Ana')).toBeInTheDocument()
    expect(screen.getByText('Proposta comercial')).toBeInTheDocument()
    expect(screen.getAllByText('Paulo')).toHaveLength(2)
  })

  it('aplica filtro de agente', async () => {
    const { setFilters } = setupStore()
    render(<PipelineBoard />)

    await userEvent.selectOptions(screen.getByLabelText('Agente'), 'user-1')

    await waitFor(() => {
      expect(setFilters).toHaveBeenCalledWith({ assignedUserId: 'user-1' })
    })
  })

  it('exibe erro do store', () => {
    setupStore({ error: 'Falha ao carregar pipeline' })
    render(<PipelineBoard />)

    expect(screen.getByText('Falha ao carregar pipeline')).toBeInTheDocument()
  })
})
