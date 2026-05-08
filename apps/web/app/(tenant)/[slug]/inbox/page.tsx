import { ConversationList } from '@/components/inbox/conversation-list'
import { ChatPanel } from '@/components/inbox/chat-panel'
import { ContactDetails } from '@/components/inbox/contact-details'
import { InboxDashboard } from '@/components/dashboard/inbox-dashboard'

export default function InboxPage() {
  return (
    <div className="flex h-full flex-col overflow-hidden">
      <InboxDashboard />
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="w-80 flex-shrink-0 border-r border-border flex flex-col overflow-hidden bg-card">
          <ConversationList />
        </div>

        <div className="flex flex-1 flex-col overflow-hidden bg-background">
          <ChatPanel />
        </div>

        <div className="w-72 flex-shrink-0 border-l border-border overflow-hidden bg-card">
          <ContactDetails />
        </div>
      </div>
    </div>
  )
}
