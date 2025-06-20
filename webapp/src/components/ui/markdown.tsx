/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import React, { memo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'
import { Copy, Check } from 'lucide-react'
import { useState } from "react";

const NonMemoizedMarkdown = ({ children }: { children: string }) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  const copyToClipboard = async (text: string, codeId: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedCode(codeId)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (err) {
      console.error('Failed to copy text: ', err)
    }
  }

  const components = {
    code: ({ inline, className, children, ...props }: any) => {
      const match = /language-(\w+)/.exec(className || "");
      const language = match ? match[1] : 'text'
      const codeString = String(children).replace(/\n$/, '')
      const codeId = `code-${Date.now()}-${Math.random()}`
      
      return !inline && match ? (
        <div className="relative group my-4">
          <div className="flex items-center justify-between bg-gray-800 text-gray-200 px-4 py-2 text-xs rounded-t-lg">
            <span className="font-medium">{language.toUpperCase()}</span>
            <button
              onClick={() => copyToClipboard(codeString, codeId)}
              className="flex items-center space-x-1 hover:bg-gray-700 px-2 py-1 rounded transition-colors"
              title="Copy code"
            >
              {copiedCode === codeId ? (
                <>
                  <Check className="w-3 h-3" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="!mt-0 !rounded-t-none text-sm w-full max-w-full overflow-x-auto"
            customStyle={{
              margin: 0,
              borderTopLeftRadius: 0,
              borderTopRightRadius: 0,
            }}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      ) : (
        <code
          className="text-sm bg-orange-50 text-orange-800 py-0.5 px-1 rounded-md border border-orange-200"
          {...props}
        >
          {children}
        </code>
      );
    },
    ol: ({ children, ...props }: any) => {
      return (
        <ol className="list-decimal list-outside ml-4 my-2" {...props}>
          {children}
        </ol>
      );
    },
    li: ({ children, ...props }: any) => {
      return (
        <li className="py-1" {...props}>
          {children}
        </li>
      );
    },
    ul: ({ children, ...props }: any) => {
      return (
        <ul className="list-disc list-outside ml-4 my-2" {...props}>
          {children}
        </ul>
      );
    },
    strong: ({ children, ...props }: any) => {
      return (
        <span className="font-semibold" {...props}>
          {children}
        </span>
      );
    },
    a: ({ children, ...props }: any) => {
      return (
        <Link
          className="text-orange-600 hover:text-orange-800 underline font-medium"
          target="_blank"
          rel="noreferrer"
          {...props}
        >
          {children}
        </Link>
      );
    },
    h1: ({ children, ...props }: any) => {
      return (
        <h1 className="text-2xl font-bold text-gray-900 mt-6 mb-4 border-b border-gray-200 pb-2" {...props}>
          {children}
        </h1>
      )
    },
    h2: ({ children, ...props }: any) => {
      return (
        <h2 className="text-xl font-semibold text-gray-900 mt-5 mb-3" {...props}>
          {children}
        </h2>
      )
    },
    h3: ({ children, ...props }: any) => {
      return (
        <h3 className="text-lg font-semibold text-gray-900 mt-4 mb-2" {...props}>
          {children}
        </h3>
      )
    },
    table: ({ children, ...props }: any) => {
      return (
        <div className="overflow-x-auto my-4">
          <table 
            className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg" 
            {...props}
          >
            {children}
          </table>
        </div>
      )
    },
    thead: ({ children, ...props }: any) => {
      return (
        <thead className="bg-gray-50" {...props}>
          {children}
        </thead>
      )
    },
    th: ({ children, ...props }: any) => {
      return (
        <th 
          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b border-gray-200" 
          {...props}
        >
          {children}
        </th>
      )
    },
    td: ({ children, ...props }: any) => {
      return (
        <td 
          className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 border-b border-gray-200" 
          {...props}
        >
          {children}
        </td>
      )
    },
    blockquote: ({ children, ...props }: any) => {
      return (
        <blockquote 
          className="border-l-4 border-orange-500 bg-orange-50 pl-4 py-2 my-4 italic text-gray-700" 
          {...props}
        >
          {children}
        </blockquote>
      )
    },
  };

  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  );
};

export const Markdown = memo(
  NonMemoizedMarkdown,
  (prevProps, nextProps) => prevProps.children === nextProps.children,
);
