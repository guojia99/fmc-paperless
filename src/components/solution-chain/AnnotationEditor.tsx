import { useState } from 'react';
import { useSessionStore } from '@/store/sessionStore';

interface AnnotationEditorProps {
  nodeId: string;
  value: string;
}

export function AnnotationEditor({ nodeId, value }: AnnotationEditorProps) {
  const setAnnotation = useSessionStore((s) => s.setNodeAnnotation);
  const [draft, setDraft] = useState(value);

  return (
    <textarea
      className="textarea mt-2 text-xs"
      placeholder="添加注释 (Shift+Enter 换行)"
      rows={2}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={() => {
        if (draft !== value) setAnnotation(nodeId, draft);
      }}
    />
  );
}
