import { useCallback, useRef } from 'react'

const MAX_HISTORY = 50

export default function useUndoRedo() {
  const pastRef = useRef([])
  const futureRef = useRef([])

  const pushState = useCallback((nodes, edges) => {
    pastRef.current = [
      ...pastRef.current.slice(-(MAX_HISTORY - 1)),
      {
        nodes: JSON.parse(JSON.stringify(nodes)),
        edges: JSON.parse(JSON.stringify(edges))
      }
    ]
    futureRef.current = []
  }, [])

  const undo = useCallback((currentNodes, currentEdges) => {
    if (pastRef.current.length === 0) return null
    const previous = pastRef.current[pastRef.current.length - 1]
    pastRef.current = pastRef.current.slice(0, -1)
    futureRef.current = [
      ...futureRef.current,
      {
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges))
      }
    ]
    return previous
  }, [])

  const redo = useCallback((currentNodes, currentEdges) => {
    if (futureRef.current.length === 0) return null
    const next = futureRef.current[futureRef.current.length - 1]
    futureRef.current = futureRef.current.slice(0, -1)
    pastRef.current = [
      ...pastRef.current,
      {
        nodes: JSON.parse(JSON.stringify(currentNodes)),
        edges: JSON.parse(JSON.stringify(currentEdges))
      }
    ]
    return next
  }, [])

  const canUndo = useCallback(() => pastRef.current.length > 0, [])
  const canRedo = useCallback(() => futureRef.current.length > 0, [])

  return { pushState, undo, redo, canUndo, canRedo }
}
