import { Textarea, type TextareaProps } from '@citron-systems/citron-ui'
import { forwardRef, useCallback, useLayoutEffect, useRef, type MutableRefObject } from 'react'

export type AutoGrowTextareaProps = Omit<TextareaProps, 'resize'>

/**
 * Textarea sin asa de redimensionado; la altura crece con el texto (controlado vía `value`).
 */
export const AutoGrowTextarea = forwardRef<HTMLTextAreaElement, AutoGrowTextareaProps>(function AutoGrowTextarea(
  { value, onChange, className, rows = 2, ...rest },
  ref,
) {
  const innerRef = useRef<HTMLTextAreaElement | null>(null)

  const setRefs = useCallback(
    (node: HTMLTextAreaElement | null) => {
      innerRef.current = node
      if (typeof ref === 'function') ref(node)
      else if (ref && 'current' in ref) (ref as MutableRefObject<HTMLTextAreaElement | null>).current = node
    },
    [ref],
  )

  useLayoutEffect(() => {
    const el = innerRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])

  return (
    <Textarea
      ref={setRefs}
      value={value}
      onChange={onChange}
      rows={rows}
      resize="none"
      className={className}
      {...rest}
    />
  )
})
