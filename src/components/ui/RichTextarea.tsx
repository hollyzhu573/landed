'use client'

import { useRef, useEffect, useState, useImperativeHandle, forwardRef, useCallback } from 'react'

export type RichTextareaHandle = {
  insert: (text: string) => void
}

const RichTextarea = forwardRef<
  RichTextareaHandle,
  {
    value: string
    onChange: (html: string) => void
    onSlash?: (removeSlash: () => void, rect: DOMRect | null) => void
    onSlashDismiss?: () => void
    placeholder?: string
    className?: string
    disabled?: boolean
  }
>(function RichTextarea({ value, onChange, onSlash, onSlashDismiss, placeholder, className, disabled }, ref) {
  const divRef = useRef<HTMLDivElement>(null)
  const slashPending = useRef(false)
  const [toolbar, setToolbar] = useState<{ x: number; y: number } | null>(null)

  // Set initial HTML on mount only
  useEffect(() => {
    if (divRef.current) divRef.current.innerHTML = value || ''
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Sync external value changes only when the div is not focused
  useEffect(() => {
    const el = divRef.current
    if (!el || document.activeElement === el) return
    el.innerHTML = value || ''
  }, [value])

  // Expose insert() so parents can append suggestion text at the cursor end
  useImperativeHandle(ref, () => ({
    insert(text: string) {
      const el = divRef.current
      if (!el) return
      el.focus()
      const range = document.createRange()
      range.selectNodeContents(el)
      range.collapse(false)
      window.getSelection()?.removeAllRanges()
      window.getSelection()?.addRange(range)
      const hasContent = el.innerHTML && el.innerHTML !== '<br>'
      if (hasContent) {
        document.execCommand('insertParagraph')
        document.execCommand('insertParagraph')
      }
      document.execCommand('insertText', false, text)
      onChange(el.innerHTML)
    },
  }))

  const emit = useCallback(() => {
    if (divRef.current) onChange(divRef.current.innerHTML)
  }, [onChange])

  function handleKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    const ctrl = e.metaKey || e.ctrlKey

    if (ctrl && e.key === 'b') { e.preventDefault(); document.execCommand('bold'); emit(); return }
    if (ctrl && e.key === 'i') { e.preventDefault(); document.execCommand('italic'); emit(); return }
    if (ctrl && e.key === 'u') { e.preventDefault(); document.execCommand('underline'); emit(); return }

    // "/" → let the character appear, mark slash as pending, open picker after insertion
    if (e.key === '/' && onSlash) {
      slashPending.current = true
      setTimeout(() => {
        const sel = window.getSelection()
        const rect = sel?.rangeCount ? sel.getRangeAt(0).getBoundingClientRect() : null
        onSlash(() => {
          slashPending.current = false
          divRef.current?.focus()
          document.execCommand('delete')
          emit()
        }, rect)
      }, 0)
      return
    }

    // Space or Backspace right after "/" → dismiss the picker, type normally
    if (slashPending.current && (e.key === ' ' || e.key === 'Backspace')) {
      slashPending.current = false
      onSlashDismiss?.()
      // fall through so the key still takes effect
    }

    // "- " at start of a text node → convert to bullet list
    if (e.key === ' ') {
      const sel = window.getSelection()
      if (!sel?.rangeCount) return
      const range = sel.getRangeAt(0)
      if (!range.collapsed) return
      const node = range.startContainer
      if (node.nodeType !== Node.TEXT_NODE) return
      const before = (node.textContent ?? '').slice(0, range.startOffset)
      if (before === '-') {
        e.preventDefault()
        ;(node as Text).deleteData(range.startOffset - 1, 1)
        document.execCommand('insertUnorderedList')
        emit()
      }
    }
  }

  function handleMouseUp() {
    const sel = window.getSelection()
    if (!sel || sel.isCollapsed || !sel.rangeCount) { setToolbar(null); return }
    const rect = sel.getRangeAt(0).getBoundingClientRect()
    const containerRect = divRef.current?.closest('.rich-root')?.getBoundingClientRect()
    if (!containerRect) return
    setToolbar({
      x: rect.left - containerRect.left + rect.width / 2,
      y: rect.top - containerRect.top,
    })
  }

  function handleBlur() {
    setTimeout(() => setToolbar(null), 120)
  }

  function execFormat(cmd: string) {
    divRef.current?.focus()
    document.execCommand(cmd)
    emit()
  }

  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault()
    document.execCommand('insertText', false, e.clipboardData.getData('text/plain'))
    emit()
  }

  return (
    <div className="rich-root relative">
      {/* Floating format toolbar — appears above any text selection */}
      {toolbar && (
        <div
          className="absolute z-20 flex items-center overflow-hidden rounded-lg border border-zinc-200 bg-white shadow-md"
          style={{ left: toolbar.x, top: toolbar.y - 38, transform: 'translateX(-50%)' }}
          onMouseDown={e => e.preventDefault()}
        >
          <button onClick={() => execFormat('bold')} className="px-2.5 py-1.5 text-[13px] font-bold text-zinc-600 hover:bg-zinc-50" title="Bold (⌘B)">B</button>
          <button onClick={() => execFormat('italic')} className="border-x border-zinc-100 px-2.5 py-1.5 text-[13px] italic text-zinc-600 hover:bg-zinc-50" title="Italic (⌘I)">I</button>
          <button onClick={() => execFormat('underline')} className="px-2.5 py-1.5 text-[13px] underline text-zinc-600 hover:bg-zinc-50" title="Underline (⌘U)">U</button>
        </div>
      )}

      {/* Editable area — placeholder via CSS ::before when empty */}
      <div
        ref={divRef}
        contentEditable={!disabled}
        suppressContentEditableWarning
        data-placeholder={placeholder}
        onInput={emit}
        onKeyDown={handleKeyDown}
        onMouseUp={handleMouseUp}
        onBlur={handleBlur}
        onPaste={handlePaste}
        className={[className, '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1'].join(' ')}
      />
    </div>
  )
})

export default RichTextarea
