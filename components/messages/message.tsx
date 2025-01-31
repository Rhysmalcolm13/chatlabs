"use client"
import { ChatbotUIContext } from "@/context/context"
import { LLM_LIST } from "@/lib/models/llm/llm-list"
import { cn } from "@/lib/utils"
import { Tables } from "@/supabase/types"
import { CodeBlock, LLM, LLMID, MessageImage, ModelProvider } from "@/types"
import {
  IconCaretDownFilled,
  IconCaretRightFilled,
  IconCircleFilled,
  IconFileText,
  IconMoodSmile,
  IconPuzzle,
  IconTerminal2
} from "@tabler/icons-react"
import Image from "next/image"
import { FC, useContext, useEffect, useRef, useState } from "react"
import { ModelIcon } from "../models/model-icon"
import { Button } from "../ui/button"
import { FileIcon } from "../ui/file-icon"
import { FilePreview } from "../ui/file-preview"
import { TextareaAutosize } from "../ui/textarea-autosize"
import { WithTooltip } from "../ui/with-tooltip"
import { MessageActions } from "./message-actions"
import { MessageMarkdown } from "./message-markdown"
import { YouTube } from "@/components/messages/annotations/youtube"
import { WebSearch } from "@/components/messages/annotations/websearch"
import AnnotationImage from "@/components/messages/annotations/image"
import { Annotation, Annotation2 } from "@/types/annotation"
import { AssistantIcon } from "@/components/assistants/assistant-icon"
import { toast } from "sonner"
import { LoadingMessage } from "@/components/messages/message-loading"
import { CodeBlock as ChatMessageCodeBlock } from "@/types/chat-message"
import MessageMarkdownMemoized from "./message-markdown-memoized"
import { MessageReplies } from "./message-replies"
import { MessageSharingDialog } from "./message-sharing-dialog"
import { useToast } from "@/components/ui/use-toast"

const ICON_SIZE = 32

interface MessageProps {
  showActions?: boolean
  codeBlocks?: ChatMessageCodeBlock[]
  message: Tables<"messages">
  fileItems: Tables<"file_items">[]
  isEditing: boolean
  isLast: boolean
  onStartEdit?: (message: Tables<"messages">) => void
  onCancelEdit?: () => void
  onSubmitEdit?: (value: string, sequenceNumber: number) => void
  onRegenerate?: (editedMessage?: string) => void
  isGenerating: boolean
  firstTokenReceived: boolean
  setIsGenerating?: (value: boolean) => void
  onSelectCodeBlock?: (codeBlock: ChatMessageCodeBlock | null) => void
}

export const Message: FC<MessageProps> = ({
  isGenerating,
  firstTokenReceived,
  setIsGenerating,
  message,
  fileItems,
  isEditing,
  isLast,
  onStartEdit,
  onCancelEdit,
  onRegenerate,
  onSubmitEdit,
  onSelectCodeBlock,
  showActions = true,
  codeBlocks
}) => {
  const {
    assistants,
    profile,
    availableLocalModels,
    availableOpenRouterModels,
    selectedAssistant,
    chatImages,
    toolInUse,
    files,
    models
  } = useContext(ChatbotUIContext)

  const editInputRef = useRef<HTMLTextAreaElement>(null)

  const [isHovering, setIsHovering] = useState(false)
  const [editedMessage, setEditedMessage] = useState(message.content)

  const [showImagePreview, setShowImagePreview] = useState(false)
  const [selectedImage, setSelectedImage] = useState<MessageImage | null>(null)

  const [showFileItemPreview, setShowFileItemPreview] = useState(false)
  const [selectedFileItem, setSelectedFileItem] =
    useState<Tables<"file_items"> | null>(null)

  const [viewSources, setViewSources] = useState(false)

  const [isVoiceToTextPlaying, setIsVoiceToTextPlaying] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(message.content)
    } else {
      const textArea = document.createElement("textarea")
      textArea.value = message.content
      document.body.appendChild(textArea)
      textArea.focus()
      textArea.select()
      document.execCommand("copy")
      document.body.removeChild(textArea)
    }
  }

  function cleanupMessageForSpeech(message: string) {
    const codeBlockRegex = /```[\s\S]*?```|(?:(?:^|\n)( {4}|\t).*)+/g
    return (
      message
        // remove any ``` code blocks
        .replace(codeBlockRegex, "see code example in the chat")
    )
  }

  const handleSpeakMessage = async () => {
    if (isVoiceToTextPlaying) {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (audioRef.current) {
        audioRef.current.pause()
      }
      setIsVoiceToTextPlaying(false)
      return
    }

    if (profile?.plan !== "free") {
      // PRO plan users can use OpenAI voice to text
      await handleOpenAISpeech(cleanupMessageForSpeech(message.content))
    } else if ("speechSynthesis" in window) {
      if (window.speechSynthesis.paused) {
        // If speech synthesis is paused, resume it
        window.speechSynthesis.resume()
      } else if (!window.speechSynthesis.speaking) {
        // If speech synthesis is not speaking, start speaking the message
        speakMessage()
      } else {
        // If speech synthesis is speaking, pause it
        handlePauseSpeech()
      }
    } else {
      console.error("Speech synthesis is not supported in this browser.")
    }
  }

  const handleOpenAISpeech = async (text: string) => {
    try {
      setIsVoiceToTextPlaying(true)
      const response = await fetch("/api/text-to-speech", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ text })
      })

      if (!response.ok) {
        throw new Error("Failed to generate speech")
      }

      const audioBlob = await response.blob()
      const audioUrl = URL.createObjectURL(audioBlob)

      if (audioRef.current) {
        audioRef.current.pause()
      }
      audioRef.current = new Audio(audioUrl)
      audioRef.current.onended = () => {
        setIsVoiceToTextPlaying(false)
      }
      audioRef.current.play()
    } catch (error) {
      console.error("Error in OpenAI text-to-speech:", error)
      toast.error("Failed to generate speech")
      setIsVoiceToTextPlaying(false)
    }
  }

  useEffect(() => {
    return () => {
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel()
      }
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isVoiceToTextPlaying) {
        if (window.speechSynthesis) {
          window.speechSynthesis.pause()
        }
        if (audioRef.current) {
          audioRef.current.pause()
        }
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [isVoiceToTextPlaying])

  const speakMessage = () => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(
        cleanupMessageForSpeech(message.content)
      )
      utterance.onerror = () => {
        console.error("An error occurred while speaking the message.")
        setIsVoiceToTextPlaying(false)
      }
      utterance.onend = () => {
        setIsVoiceToTextPlaying(false)
      }
      utterance.onpause = () => {
        setIsVoiceToTextPlaying(false)
      }
      utterance.onresume = () => {
        setIsVoiceToTextPlaying(true)
      }
      utterance.onstart = () => {
        setIsVoiceToTextPlaying(true)
      }
      window.speechSynthesis.speak(utterance)
    } else {
      console.error("Speech synthesis is not supported in this browser.")
    }
  }

  const handlePauseSpeech = () => {
    if (window.speechSynthesis) {
      window.speechSynthesis.pause()
    }
  }

  const handleSendEdit = () => {
    onSubmitEdit?.(editedMessage, message.sequence_number)
    onCancelEdit?.()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (isEditing && event.key === "Enter" && event.metaKey) {
      handleSendEdit()
    }
  }

  const handleRegenerate = async () => {
    setIsGenerating?.(true)
    onRegenerate?.(editedMessage)
  }

  const handleStartEdit = () => {
    onStartEdit?.(message)
  }

  useEffect(() => {
    setEditedMessage(message.content)

    if (isEditing && editInputRef.current) {
      const input = editInputRef.current
      input.focus()
      input.setSelectionRange(input.value.length, input.value.length)
    }
  }, [isEditing])

  const MODEL_DATA = [
    ...models.map(model => ({
      modelId: model.model_id as LLMID,
      modelName: model.name,
      provider: "custom" as ModelProvider,
      hostedId: model.id,
      platformLink: "",
      imageInput: false
    })),
    ...LLM_LIST,
    ...availableLocalModels,
    ...availableOpenRouterModels
  ].find(llm => llm.modelId === message.model) as LLM

  const fileAccumulator: Record<
    string,
    {
      id: string
      name: string
      count: number
      type: string
      description: string
    }
  > = {}

  const fileSummary = fileItems.reduce((acc, fileItem) => {
    const parentFile = files.find(file => file.id === fileItem.file_id)
    if (parentFile) {
      if (!acc[parentFile.id]) {
        acc[parentFile.id] = {
          id: parentFile.id,
          name: parentFile.name,
          count: 1,
          type: parentFile.type,
          description: parentFile.description
        }
      } else {
        acc[parentFile.id].count += 1
      }
    }
    return acc
  }, fileAccumulator)

  function Annotations({ annotation }: { annotation: Annotation }) {
    if (!annotation) {
      return null
    }

    if (Array.isArray(annotation)) {
      annotation = annotation.reduce((acc, item) => {
        acc = {
          ...acc,
          ...item
        }

        return acc
      }, {})
    }

    const annotationMap: {
      [key: string]: React.FC<{ annotation: Annotation | Annotation2 }>
    } = {
      imageGenerator__generateImage: AnnotationImage,
      webScraper__youtubeCaptions: YouTube,
      webScraper__googleSearch: WebSearch
    }

    return Object.keys(annotation).map(key => {
      if (!annotationMap[key]) {
        return null
      }
      const AnnotationComponent = annotationMap[key]!
      return <AnnotationComponent key={key} annotation={annotation} />
    })
  }

  let assistant =
    message.role === "assistant" && message.assistant_id
      ? assistants.find(assistant => assistant.id === message.assistant_id)
      : null

  if (!assistant && selectedAssistant) {
    assistant = selectedAssistant
  }

  const isReasoner = message.model.includes("deepseek-reasoner")

  return (
    <div
      className={cn(
        "group relative flex w-full flex-col items-start space-y-1.5",
        isReasoner && "bg-muted/20" // Example styling for reasoner steps
      )}
    >
      <MessageReplies message={message} />

      <div className="relative flex w-full flex-col items-start">
        {isGenerating && isLast ? (
          <LoadingMessage />
        ) : (
          <MessageMarkdownMemoized
            content={message.content}
            codeBlocks={codeBlocks}
            onSelectCodeBlock={onSelectCodeBlock}
            fileItems={fileItems}
          />
        )}
      </div>
      {showActions && (
        <MessageActions
          message={message}
          isEditing={isEditing}
          onStartEdit={onStartEdit}
          onCancelEdit={onCancelEdit}
          onSubmitEdit={onSubmitEdit}
          onRegenerate={onRegenerate}
        />
      )}
      <MessageSharingDialog message={message} />
    </div>
  )
}
