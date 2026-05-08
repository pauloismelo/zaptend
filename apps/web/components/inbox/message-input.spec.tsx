import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MessageInput } from './message-input'
import { useMessagesStore } from '@/stores/messages.store'
import { useAiCopilotStore } from '@/stores/ai-copilot.store'

const mockSendMessage = jest.fn()
const mockSuggestReply = jest.fn()
const mockedUseMessagesStore = useMessagesStore as unknown as jest.Mock
const mockedUseAiCopilotStore = useAiCopilotStore as unknown as jest.Mock

jest.mock('@/stores/messages.store', () => ({
  useMessagesStore: jest.fn(),
}))

jest.mock('@/stores/ai-copilot.store', () => ({
  useAiCopilotStore: jest.fn(),
}))

function setup() {
  mockedUseMessagesStore.mockReturnValue({
    sendMessage: mockSendMessage,
  })
  mockedUseAiCopilotStore.mockReturnValue({
    isSuggesting: false,
    suggestReply: mockSuggestReply,
  })
}

describe('MessageInput', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setup()
  })

  it('renderiza o textarea', () => {
    render(<MessageInput conversationId="conv-1" />)
    expect(screen.getByTestId('message-textarea')).toBeInTheDocument()
  })

  it('botão enviar está desabilitado quando textarea vazio', () => {
    render(<MessageInput conversationId="conv-1" />)
    expect(screen.getByTestId('send-button')).toBeDisabled()
  })

  it('botão enviar fica habilitado quando textarea tem texto', async () => {
    render(<MessageInput conversationId="conv-1" />)
    await userEvent.type(screen.getByTestId('message-textarea'), 'Olá')
    expect(screen.getByTestId('send-button')).not.toBeDisabled()
  })

  it('chama sendMessage ao clicar no botão enviar', async () => {
    mockSendMessage.mockResolvedValue(undefined)
    render(<MessageInput conversationId="conv-1" />)
    await userEvent.type(screen.getByTestId('message-textarea'), 'Olá')
    await act(async () => {
      fireEvent.click(screen.getByTestId('send-button'))
    })
    expect(mockSendMessage).toHaveBeenCalledWith('conv-1', 'Olá')
  })

  it('limpa o textarea após envio', async () => {
    mockSendMessage.mockResolvedValue(undefined)
    render(<MessageInput conversationId="conv-1" />)
    const textarea = screen.getByTestId('message-textarea')
    await userEvent.type(textarea, 'Olá')
    await act(async () => {
      fireEvent.click(screen.getByTestId('send-button'))
    })
    await waitFor(() => {
      expect(textarea).toHaveValue('')
    })
  })

  it('chama sendMessage ao pressionar Ctrl+Enter', async () => {
    mockSendMessage.mockResolvedValue(undefined)
    render(<MessageInput conversationId="conv-1" />)
    const textarea = screen.getByTestId('message-textarea')
    await userEvent.type(textarea, 'Mensagem via atalho')
    await act(async () => {
      fireEvent.keyDown(textarea, { key: 'Enter', ctrlKey: true })
    })
    expect(mockSendMessage).toHaveBeenCalledWith('conv-1', 'Mensagem via atalho')
  })

  it('não chama sendMessage para texto apenas de espaços', async () => {
    render(<MessageInput conversationId="conv-1" />)
    await userEvent.type(screen.getByTestId('message-textarea'), '   ')
    fireEvent.click(screen.getByTestId('send-button'))
    expect(mockSendMessage).not.toHaveBeenCalled()
  })

  it('abre o emoji picker ao clicar no botão de emoji', () => {
    render(<MessageInput conversationId="conv-1" />)
    fireEvent.click(screen.getByLabelText('Emojis'))
    expect(screen.getByTestId('emoji-picker')).toBeInTheDocument()
  })

  it('fecha o emoji picker ao clicar em fechar', () => {
    render(<MessageInput conversationId="conv-1" />)
    fireEvent.click(screen.getByLabelText('Emojis'))
    fireEvent.click(screen.getByLabelText('Fechar emojis'))
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
  })

  it('insere emoji no textarea ao clicar', async () => {
    render(<MessageInput conversationId="conv-1" />)
    fireEvent.click(screen.getByLabelText('Emojis'))
    fireEvent.click(screen.getByLabelText('😊'))
    expect(screen.getByTestId('message-textarea')).toHaveValue('😊')
  })

  it('exibe quick replies quando texto começa com /', async () => {
    render(<MessageInput conversationId="conv-1" />)
    await userEvent.type(screen.getByTestId('message-textarea'), '/oi')
    expect(screen.getByTestId('quick-replies')).toBeInTheDocument()
  })

  it('não exibe quick replies quando texto não começa com /', async () => {
    render(<MessageInput conversationId="conv-1" />)
    await userEvent.type(screen.getByTestId('message-textarea'), 'Olá')
    expect(screen.queryByTestId('quick-replies')).not.toBeInTheDocument()
  })

  it('preenche textarea com texto do quick reply ao selecionar', async () => {
    render(<MessageInput conversationId="conv-1" />)
    await userEvent.type(screen.getByTestId('message-textarea'), '/oi')
    const replyButton = screen.getByText('Olá! Como posso ajudar?')
    fireEvent.click(replyButton)
    expect(screen.getByTestId('message-textarea')).toHaveValue('Olá! Como posso ajudar?')
  })

  it('chama onMessageSent após envio bem-sucedido', async () => {
    const onMessageSent = jest.fn()
    mockSendMessage.mockResolvedValue(undefined)
    render(<MessageInput conversationId="conv-1" onMessageSent={onMessageSent} />)
    await userEvent.type(screen.getByTestId('message-textarea'), 'Oi')
    await act(async () => {
      fireEvent.click(screen.getByTestId('send-button'))
    })
    await waitFor(() => {
      expect(onMessageSent).toHaveBeenCalled()
    })
  })

  it('preenche textarea com sugestão do AI Co-Pilot', async () => {
    mockSuggestReply.mockResolvedValue('Resposta sugerida pela IA')
    render(<MessageInput conversationId="conv-1" />)

    await userEvent.click(screen.getByLabelText('Sugerir resposta'))

    await waitFor(() => {
      expect(mockSuggestReply).toHaveBeenCalledWith('conv-1')
      expect(screen.getByTestId('message-textarea')).toHaveValue('Resposta sugerida pela IA')
    })
  })

  it('fecha emoji picker ao pressionar Escape', () => {
    render(<MessageInput conversationId="conv-1" />)
    fireEvent.click(screen.getByLabelText('Emojis'))
    fireEvent.keyDown(screen.getByTestId('message-textarea'), { key: 'Escape' })
    expect(screen.queryByTestId('emoji-picker')).not.toBeInTheDocument()
  })
})
