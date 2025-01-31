import React, { useMemo } from "react"
import ReactMarkdown from "react-markdown"
import rehypeKatex from "rehype-katex"
import remarkMath from "remark-math"
import rehypeMathjax from "rehype-mathjax"
import remarkGfm from "remark-gfm"
import { CodeBlock } from "@/types/chat-message"
import { MessageAnnotations } from "./annotations/message-annotations"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"
import { CodeViewer } from "@/components/code-viewer/code-viewer"
import { Tables } from "@/supabase/types"
import { FilePreview } from "@/components/ui/file-preview"
import { IconExternalLink } from "@tabler/icons-react"

interface MessageMarkdownProps {
  content: string
  codeBlocks: CodeBlock[]
  onSelectCodeBlock: (codeBlock: CodeBlock | null) => void
  fileItems: Tables<"file_items">[]
}

const MessageMarkdownMemoized = React.memo(
  ({ content, codeBlocks, onSelectCodeBlock, fileItems }: MessageMarkdownProps) => {
    const { theme } = useTheme()

    const renderers = useMemo(
      () => ({
        code: ({ node, inline, className, children, ...props }) => {
          const match = (className || '').match(/language-(?<lang>[\w-]+)/);
          const codeString = String(children).replace(/\n$/, "");
          const language = match?.groups?.lang || "";

          const existingCodeBlock = codeBlocks.find(
            block => block.code === codeString
          )

          if (!existingCodeBlock) {
            return (
              <code className={className} {...props}>
                {children}
              </code>
            )
          }

          return (
            <CodeViewer
              language={language}
              value={codeString}
              showCloseButton={false}
              onClick={()=> onSelectCodeBlock(existingCodeBlock)}
            />
          )
        },
        link: ({ node, ...props }) => {
          const isExternal = props.href.startsWith("http")
          return (
            <a {...props}
               target={isExternal ? "_blank" : "_self"}
               rel={isExternal ? "noopener noreferrer nofollow" : "noopener noreferrer"}
               className={"underline"}
            >
              {props.children}
              {isExternal && <IconExternalLink size={14} />}
            </a>
          )
        },
      }),
      [codeBlocks, theme]
    )
    const files = useMemo(() => {
      return fileItems.map((item, index) => (
        <FilePreview type={"retrieval"} item={item} key={item.id} onOpenChange={()=>{}} isOpen={false} />
      ))
    }, [fileItems])

    return (
      <div className="w-full">
        <ReactMarkdown
          className={"prose w-full break-words dark:prose-invert"}
          remarkPlugins={[remarkMath, remarkGfm]}
          rehypePlugins={[rehypeKatex, rehypeMathjax]}
          components={renderers}
        >
          {content}
        </ReactMarkdown>
        {files}
        <MessageAnnotations text={content} />
      </div>
    )
  }
)

export default MessageMarkdownMemoized
