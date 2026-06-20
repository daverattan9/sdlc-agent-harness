'use client'

import { useState, useCallback } from 'react'
import { ConversationProvider, useConversationStatus } from '@elevenlabs/react'

import { cn } from '@/lib/utils'
import { ConversationBar } from '@/components/ui/conversation-bar'
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ui/conversation'
import { Message, MessageContent } from '@/components/ui/message'

interface ChatMessage {
  id: string
  source: 'user' | 'assistant'
  message: string
}

function VoiceSupportInner({ agentId }: { agentId: string }) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isConnected, setIsConnected] = useState(false)
  const { status } = useConversationStatus()

  const handleConnect = useCallback(() => {
    setMessages([])
    setIsConnected(true)
  }, [])

  const handleDisconnect = useCallback(() => {
    setIsConnected(false)
  }, [])

  const handleMessage = useCallback(
    (msg: { source: 'user' | 'ai'; message: string }) => {
      setMessages((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          source: msg.source === 'user' ? 'user' : 'assistant',
          message: msg.message,
        },
      ])
    },
    []
  )

  const handleError = useCallback((error: Error) => {
    console.error('ElevenLabs conversation error:', error)
  }, [])

  const panelVisible = isConnected || status === 'connecting'

  return (
    <div className="dark">
      {/* Chat transcript panel — slides in from the left */}
      <div
        className={cn(
          'fixed bottom-20 right-4 z-50 flex w-80 flex-col overflow-hidden rounded-xl border border-[#242331] bg-[#16151D] shadow-2xl transition-all duration-300 ease-out',
          panelVisible
            ? 'max-h-[420px] opacity-100 translate-y-0'
            : 'max-h-0 opacity-0 translate-y-4 pointer-events-none'
        )}
      >
        <div className="flex items-center gap-2 border-b border-[#242331] px-4 py-3">
          <span
            className={cn(
              'inline-block h-2 w-2 rounded-full',
              status === 'connected'
                ? 'bg-[#4ADE80] shadow-[0_0_6px_rgba(74,222,128,0.4)]'
                : 'animate-pulse bg-[#8B7CF8]'
            )}
          />
          <span className="text-xs font-medium text-[#E9E8EE]">
            {status === 'connected' ? 'Live transcript' : 'Connecting...'}
          </span>
        </div>

        <Conversation className="h-[340px]">
          <ConversationContent className="flex flex-col gap-1 p-3">
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <p className="text-xs text-[#6C6A7C]">
                  {status === 'connected'
                    ? 'Start speaking...'
                    : 'Waiting for connection...'}
                </p>
              </div>
            ) : (
              messages.map((msg) => (
                <Message key={msg.id} from={msg.source === 'user' ? 'user' : 'assistant'}>
                  <MessageContent variant="flat" className="text-xs">
                    {msg.message}
                  </MessageContent>
                </Message>
              ))
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>
      </div>

      {/* Conversation bar — fixed bottom-right */}
      <div style={{ position: 'fixed', bottom: 0, right: 0, zIndex: 50, width: '20rem' }}>
        <ConversationBar
          agentId={agentId}
          className="max-w-80"
          onConnect={handleConnect}
          onDisconnect={handleDisconnect}
          onMessage={handleMessage}
          onError={handleError}
        />
      </div>
    </div>
  )
}

export default function VoiceSupport({ agentId }: { agentId: string }) {
  return (
    <ConversationProvider>
      <VoiceSupportInner agentId={agentId} />
    </ConversationProvider>
  )
}
