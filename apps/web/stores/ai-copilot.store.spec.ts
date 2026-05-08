import { act } from 'react'
import { useAiCopilotStore } from './ai-copilot.store'
import { aiApi } from '@/lib/api/ai'

jest.mock('@/lib/api/ai', () => ({
  aiApi: {
    suggest: jest.fn(),
    summarize: jest.fn(),
    intent: jest.fn(),
    mood: jest.fn(),
  },
}))

const mockedApi = aiApi as jest.Mocked<typeof aiApi>

function resetStore() {
  useAiCopilotStore.setState({
    suggestion: null,
    summary: [],
    intent: null,
    isSuggesting: false,
    isSummarizing: false,
    isDetectingIntent: false,
    error: null,
  })
}

describe('useAiCopilotStore', () => {
  beforeEach(() => {
    resetStore()
    jest.clearAllMocks()
  })

  it('busca sugestão de resposta', async () => {
    mockedApi.suggest.mockResolvedValue({ suggestion: 'Sugestão' })

    await act(async () => {
      await useAiCopilotStore.getState().suggestReply('conv-1')
    })

    expect(mockedApi.suggest).toHaveBeenCalledWith('conv-1')
    expect(useAiCopilotStore.getState().suggestion).toBe('Sugestão')
  })

  it('busca resumo em bullets', async () => {
    mockedApi.summarize.mockResolvedValue({ bullets: ['A', 'B', 'C'] })

    await act(async () => {
      await useAiCopilotStore.getState().summarize('conv-1')
    })

    expect(useAiCopilotStore.getState().summary).toEqual(['A', 'B', 'C'])
  })

  it('detecta intenção', async () => {
    mockedApi.intent.mockResolvedValue({ intent: 'compra' })

    await act(async () => {
      await useAiCopilotStore.getState().detectIntent('conv-1')
    })

    expect(useAiCopilotStore.getState().intent).toBe('compra')
  })

  it('limpa dados do co-pilot', () => {
    useAiCopilotStore.setState({ suggestion: 'A', summary: ['B'], intent: 'compra', error: 'Erro' })

    useAiCopilotStore.getState().clear()

    expect(useAiCopilotStore.getState()).toEqual(
      expect.objectContaining({ suggestion: null, summary: [], intent: null, error: null }),
    )
  })
})
