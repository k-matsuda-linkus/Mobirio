"use client";
import { useState, useRef } from "react";
import { Bold, Italic, Underline, List, Link as LinkIcon } from "lucide-react";

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ value, onChange, placeholder = "入力してください...", minHeight = "200px" }: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [, setForceUpdate] = useState(0);

  const execCommand = (command: string, val?: string) => {
    document.execCommand(command, false, val);
    editorRef.current?.focus();
    setForceUpdate((n) => n + 1);
  };

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const handleInsertLink = () => {
    const url = prompt("URLを入力してください:");
    if (url) execCommand("createLink", url);
  };

  return (
    <div className="border border-gray-200">
      <div className="flex items-center gap-[2px] px-[8px] py-[6px] border-b border-gray-200 bg-gray-50">
        <button type="button" onClick={() => execCommand("bold")} className="p-[4px] hover:bg-gray-200 rounded" title="太字">
          <Bold className="w-[16px] h-[16px]" />
        </button>
        <button type="button" onClick={() => execCommand("italic")} className="p-[4px] hover:bg-gray-200 rounded" title="斜体">
          <Italic className="w-[16px] h-[16px]" />
        </button>
        <button type="button" onClick={() => execCommand("underline")} className="p-[4px] hover:bg-gray-200 rounded" title="下線">
          <Underline className="w-[16px] h-[16px]" />
        </button>
        <div className="w-[1px] h-[20px] bg-gray-300 mx-[4px]" />
        <button type="button" onClick={() => execCommand("insertUnorderedList")} className="p-[4px] hover:bg-gray-200 rounded" title="箇条書き">
          <List className="w-[16px] h-[16px]" />
        </button>
        <button type="button" onClick={handleInsertLink} className="p-[4px] hover:bg-gray-200 rounded" title="リンク">
          <LinkIcon className="w-[16px] h-[16px]" />
        </button>
      </div>
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        dangerouslySetInnerHTML={{ __html: value }}
        className="px-[12px] py-[10px] text-sm focus:outline-none prose prose-sm max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
}
