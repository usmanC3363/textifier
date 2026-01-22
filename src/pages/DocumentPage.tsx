// src/pages/DocumentPage.tsx
import DocPage from '@/components/documents/doc-page';
import { useParams } from 'react-router-dom';

export default function DocumentPage() {
  const { id } = useParams();

  return (
    <DocPage/>
  );
}
