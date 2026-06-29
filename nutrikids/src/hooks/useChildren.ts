import { useState, useEffect } from 'react';
import { getChildren, getAllergens, type Child, type Allergen } from '../../services/api';

const ACTIVE_KEY = 'nutrikids_active_child_id';

export function useChildren() {
  const [children, setChildren] = useState<Child[]>([]);
  const [activeId, setActiveId] = useState<string | null>(
    () => localStorage.getItem(ACTIVE_KEY)
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getChildren().then(list => {
      setChildren(list);
      // 如果没有存过 activeId，默认选第一个
      if (!localStorage.getItem(ACTIVE_KEY) && list.length > 0) {
        setActiveId(list[0].id);
        localStorage.setItem(ACTIVE_KEY, list[0].id);
      }
      setLoading(false);
    });
  }, []);

  const activeChild = children.find(c => c.id === activeId) ?? children[0] ?? null;

  function switchChild(id: string) {
    setActiveId(id);
    localStorage.setItem(ACTIVE_KEY, id);
  }

  return { children, activeChild, switchChild, loading };
}