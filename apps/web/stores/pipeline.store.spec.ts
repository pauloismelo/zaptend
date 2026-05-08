import { act } from 'react'
import { usePipelineStore } from './pipeline.store'
import { pipelineApi } from '@/lib/api/pipeline'
import type { PipelineConversation } from '@/lib/api/pipeline'

jest.mock('@/lib/api/pipeline', () => ({
  pipelineApi: {
    list: jest.fn(),
    moveConversation: jest.fn(),
  },
}))

const mockedApi = pipelineApi as jest.Mocked<typeof pipelineApi>

const conversation: PipelineConversation = {
  id: 'conv-1',
  status: 'open',
  subject: 'Venda',
  tags: ['lead'],
  pipelineStage: 'new',
  pipelineValue: '1200',
  lastMessageAt: '2026-05-07T12:00:00.000Z',
  assignedUserId: 'user-1',
  departmentId: 'dept-1',
  contact: { id: 'contact-1', phone: '5511999999999', name: 'Ana', company: 'ACME', tags: ['lead'] },
  assignedUser: { id: 'user-1', name: 'Paulo', email: 'paulo@test.com' },
}

function resetStore() {
  usePipelineStore.setState({
    conversations: [],
    filters: {},
    isLoading: false,
    isMoving: false,
    error: null,
  })
}

describe('usePipelineStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  it('carrega conversas do pipeline com filtros atuais', async () => {
    mockedApi.list.mockResolvedValue([conversation])
    usePipelineStore.getState().setFilters({ assignedUserId: 'user-1' })

    await act(async () => {
      await usePipelineStore.getState().fetchPipeline()
    })

    expect(mockedApi.list).toHaveBeenCalledWith({ assignedUserId: 'user-1' })
    expect(usePipelineStore.getState().conversations).toEqual([conversation])
    expect(usePipelineStore.getState().isLoading).toBe(false)
  })

  it('move conversa com atualização otimista', async () => {
    usePipelineStore.setState({ conversations: [conversation] })
    mockedApi.moveConversation.mockResolvedValue({ ...conversation, pipelineStage: 'proposal' })

    await act(async () => {
      await usePipelineStore.getState().moveConversation('conv-1', 'proposal')
    })

    expect(mockedApi.moveConversation).toHaveBeenCalledWith('conv-1', 'proposal')
    expect(usePipelineStore.getState().conversations[0].pipelineStage).toBe('proposal')
    expect(usePipelineStore.getState().isMoving).toBe(false)
  })

  it('reverte conversa quando movimento falha', async () => {
    usePipelineStore.setState({ conversations: [conversation] })
    mockedApi.moveConversation.mockRejectedValue(new Error('Falha'))

    await expect(
      act(async () => {
        await usePipelineStore.getState().moveConversation('conv-1', 'proposal')
      }),
    ).rejects.toThrow('Falha')

    expect(usePipelineStore.getState().conversations[0].pipelineStage).toBe('new')
    expect(usePipelineStore.getState().error).toBe('Falha')
  })
})
